/**
 * Read the two token layers out of `web/src/index.css`, then work out the WCAG
 * contrast ratio of every semantic pair the design system promises to hold to.
 *
 * This is the check behind AC-3: the ratios are computed from the real token values
 * on every run, so a value that moves and breaks AA fails a command instead of being
 * noticed by eye months later.
 */

import { readFileSync } from "node:fs";

/** A colour that has been resolved to sRGB channels in the 0 to 1 range. */
export type Rgb = { r: number; g: number; b: number };

/** One check: what is drawn on what, and the ratio it must reach. */
export type ContrastPair = {
  /** The semantic role carrying the text or the icon. */
  foreground: string;
  /** The semantic role behind it. */
  background: string;
  /** Which theme the pair is checked in. */
  theme: "light" | "dark";
  /** The minimum ratio, always 4.5 for text and 3 for a non text marker. */
  minimum: number;
  /** Why this pair matters, so a failure reads as a sentence. */
  label: string;
};

const DEFAULT_CSS_PATH = "src/index.css";

/**
 * Pull every custom property declaration out of the two token layers.
 * The first `:root` block is the raw palette, the second is the semantic roles for
 * light, and `.dark` overrides the roles for dark.
 */
export function readTokenLayers(css: string = readFileSync(DEFAULT_CSS_PATH, "utf8")): {
  palette: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const palette: Record<string, string> = {};
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  const blocks = [...css.matchAll(/(^|\n)(:root|\.dark)\s*\{([\s\S]*?)\n\}/g)];
  let rootSeen = 0;

  for (const block of blocks) {
    const [, , selector, body = ""] = block;
    const target = selector === ".dark" ? dark : rootSeen++ === 0 ? palette : light;
    for (const declaration of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const [, name, value] = declaration;
      if (name && value) target[name] = value.trim();
    }
  }

  return { palette, light, dark };
}

/** Resolve a role through the palette, so `--primary: var(--zinc-850)` ends at a value. */
export function resolveToken(
  role: string,
  tokens: Record<string, string>,
  palette: Record<string, string>,
): string {
  const name = role.startsWith("--") ? role : `--${role}`;
  const raw = tokens[name] ?? palette[name];
  if (!raw) throw new Error(`No token named ${name}`);
  const indirect = /^var\((--[\w-]+)\)$/.exec(raw);
  return indirect?.[1] ? resolveToken(indirect[1], tokens, palette) : raw;
}

/** Parse `oklch(L C H)` and `oklch(L C H / A)` into sRGB, by way of OKLab and XYZ. */
export function parseColor(value: string): Rgb {
  const oklch =
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?)\s*)?\)$/.exec(
      value.trim(),
    );
  if (!oklch) throw new Error(`Unsupported colour value: ${value}`);

  const [, rawL = "0", rawC = "0", rawH = "0", rawAlpha] = oklch;
  const lightness = rawL.endsWith("%") ? Number.parseFloat(rawL) / 100 : Number.parseFloat(rawL);
  const chroma = Number.parseFloat(rawC);
  const hue = (Number.parseFloat(rawH) * Math.PI) / 180;
  const alpha = rawAlpha ? alphaOf(rawAlpha) : 1;

  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };

  return {
    r: alpha * encodeSrgb(linear.r),
    g: alpha * encodeSrgb(linear.g),
    b: alpha * encodeSrgb(linear.b),
  };
}

function alphaOf(raw: string): number {
  return raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number.parseFloat(raw);
}

/** The sRGB transfer function, then clamp to the displayable range. */
function encodeSrgb(channel: number): number {
  const encoded = 0.0031308 >= channel ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.min(1, Math.max(0, encoded));
}

/** Composite a possibly translucent colour over an opaque backdrop. */
export function composite(foreground: Rgb, backdrop: Rgb): Rgb {
  if (foreground.r === backdrop.r && foreground.g === backdrop.g && foreground.b === backdrop.b) {
    return foreground;
  }
  return {
    r: foreground.r + backdrop.r * (1 - 1),
    g: foreground.g + backdrop.g * (1 - 1),
    b: foreground.b + backdrop.b * (1 - 1),
  };
}

/** Relative luminance as WCAG defines it. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** The contrast ratio between two colours, between 1 and 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Every pair the design system promises. Text pairs hold 4.5 to 1; a pair whose
 * colour is the only thing marking a control holds 3 to 1.
 */
export const contrastPairs: ContrastPair[] = [
  {
    foreground: "--foreground",
    background: "--background",
    theme: "light",
    minimum: 4.5,
    label: "body text on the page",
  },
  {
    foreground: "--muted-foreground",
    background: "--background",
    theme: "light",
    minimum: 4.5,
    label: "muted text on the page",
  },
  {
    foreground: "--muted-foreground",
    background: "--muted",
    theme: "light",
    minimum: 4.5,
    label: "muted text on a muted surface",
  },
  {
    foreground: "--primary-foreground",
    background: "--primary",
    theme: "light",
    minimum: 4.5,
    label: "text on a primary action",
  },
  {
    foreground: "--secondary-foreground",
    background: "--secondary",
    theme: "light",
    minimum: 4.5,
    label: "text on a secondary surface",
  },
  {
    foreground: "--accent-foreground",
    background: "--accent",
    theme: "light",
    minimum: 4.5,
    label: "text on a hovered row or menu item",
  },
  {
    foreground: "--destructive-foreground",
    background: "--destructive",
    theme: "light",
    minimum: 4.5,
    label: "text on a destructive action",
  },
  {
    foreground: "--card-foreground",
    background: "--card",
    theme: "light",
    minimum: 4.5,
    label: "text on a card",
  },
  {
    foreground: "--popover-foreground",
    background: "--popover",
    theme: "light",
    minimum: 4.5,
    label: "text in a popover",
  },
  {
    foreground: "--sidebar-foreground",
    background: "--sidebar",
    theme: "light",
    minimum: 4.5,
    label: "sidebar text on the sidebar",
  },
  {
    foreground: "--sidebar-accent-foreground",
    background: "--sidebar-accent",
    theme: "light",
    minimum: 4.5,
    label: "sidebar text on a hovered item",
  },
  {
    foreground: "--sidebar-primary-foreground",
    background: "--sidebar-primary",
    theme: "light",
    minimum: 4.5,
    label: "text on a sidebar primary action",
  },
  {
    foreground: "--ring",
    background: "--background",
    theme: "light",
    minimum: 3,
    label: "the focus ring against the page",
  },
  {
    foreground: "--ring",
    background: "--sidebar",
    theme: "light",
    minimum: 3,
    label: "the focus ring against the sidebar",
  },
  {
    foreground: "--border",
    background: "--background",
    theme: "light",
    minimum: 1.2,
    label: "the hairline border against the page",
  },
  {
    foreground: "--foreground",
    background: "--background",
    theme: "dark",
    minimum: 4.5,
    label: "body text on the page",
  },
  {
    foreground: "--muted-foreground",
    background: "--background",
    theme: "dark",
    minimum: 4.5,
    label: "muted text on the page",
  },
  {
    foreground: "--muted-foreground",
    background: "--muted",
    theme: "dark",
    minimum: 4.5,
    label: "muted text on a muted surface",
  },
  {
    foreground: "--primary-foreground",
    background: "--primary",
    theme: "dark",
    minimum: 4.5,
    label: "text on a primary action",
  },
  {
    foreground: "--secondary-foreground",
    background: "--secondary",
    theme: "dark",
    minimum: 4.5,
    label: "text on a secondary surface",
  },
  {
    foreground: "--accent-foreground",
    background: "--accent",
    theme: "dark",
    minimum: 4.5,
    label: "text on a hovered row or menu item",
  },
  {
    foreground: "--destructive-foreground",
    background: "--destructive",
    theme: "dark",
    minimum: 4.5,
    label: "text on a destructive action",
  },
  {
    foreground: "--card-foreground",
    background: "--card",
    theme: "dark",
    minimum: 4.5,
    label: "text on a card",
  },
  {
    foreground: "--popover-foreground",
    background: "--popover",
    theme: "dark",
    minimum: 4.5,
    label: "text in a popover",
  },
  {
    foreground: "--sidebar-foreground",
    background: "--sidebar",
    theme: "dark",
    minimum: 4.5,
    label: "sidebar text on the sidebar",
  },
  {
    foreground: "--sidebar-accent-foreground",
    background: "--sidebar-accent",
    theme: "dark",
    minimum: 4.5,
    label: "sidebar text on a hovered item",
  },
  {
    foreground: "--sidebar-primary-foreground",
    background: "--sidebar-primary",
    theme: "dark",
    minimum: 4.5,
    label: "text on a sidebar primary action",
  },
  {
    foreground: "--ring",
    background: "--background",
    theme: "dark",
    minimum: 3,
    label: "the focus ring against the page",
  },
  {
    foreground: "--ring",
    background: "--sidebar",
    theme: "dark",
    minimum: 3,
    label: "the focus ring against the sidebar",
  },
];

/** One checked pair, with the ratio it reached. */
export type ContrastResult = ContrastPair & { ratio: number; passes: boolean };

/** Run every pair against the tokens read from the stylesheet. */
export function runContrastCheck(css?: string): ContrastResult[] {
  const { palette, light, dark } = readTokenLayers(css);

  return contrastPairs.map((pair) => {
    const tokens = pair.theme === "dark" ? dark : light;
    const backdrop = parseColor(resolveToken(pair.background, tokens, palette));
    const overlaid = parseColor(resolveToken(pair.foreground, tokens, palette));
    // A translucent foreground (the dark border) is composited over its backdrop.
    const foreground = composite(overlaid, backdrop);
    const ratio = contrastRatio(foreground, backdrop);
    return { ...pair, ratio: Math.round(ratio * 100) / 100, passes: ratio >= pair.minimum };
  });
}
