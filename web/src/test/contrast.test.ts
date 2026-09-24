import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  contrastRatio,
  parseColor,
  readTokenLayers,
  resolveToken,
  runContrastCheck,
} from "../../scripts/contrast";

// Read relative to the project root, which is where Vitest runs from, so the path
// works the same on every platform.
const CSS_PATH = "src/index.css";

describe("parseColor", () => {
  it("reads white and black exactly", () => {
    const white = parseColor("oklch(1 0 0)");
    expect(white.r).toBeCloseTo(1, 5);
    expect(white.g).toBeCloseTo(1, 5);
    expect(white.b).toBeCloseTo(1, 5);

    const black = parseColor("oklch(0 0 0)");
    expect(black.r).toBeCloseTo(0, 5);
    expect(black.g).toBeCloseTo(0, 5);
    expect(black.b).toBeCloseTo(0, 5);
  });

  it("reads a percentage lightness", () => {
    expect(parseColor("oklch(100% 0 0)").r).toBeCloseTo(1, 5);
  });

  it("applies an alpha channel", () => {
    const translucent = parseColor("oklch(1 0 0 / 50%)");
    expect(translucent.r).toBeCloseTo(0.5, 2);
  });

  it("rejects a value it cannot read rather than guessing", () => {
    expect(() => parseColor("#ffffff")).toThrow();
    expect(() => parseColor("rgb(1 1 1)")).toThrow();
  });
});

describe("contrastRatio", () => {
  it("is 21 to 1 for black on white", () => {
    expect(contrastRatio({ r: 1, g: 1, b: 1 }, { r: 0, g: 0, b: 0 })).toBeCloseTo(21, 1);
  });

  it("is 1 to 1 for a colour against itself", () => {
    expect(contrastRatio({ r: 0.5, g: 0.5, b: 0.5 }, { r: 0.5, g: 0.5, b: 0.5 })).toBeCloseTo(1, 5);
  });
});

describe("token layers", () => {
  const layers = readTokenLayers();

  it("finds the palette, the light roles and the dark roles", () => {
    expect(Object.keys(layers.palette).length).toBeGreaterThan(5);
    expect(layers.light["--background"]).toBeDefined();
    expect(layers.dark["--background"]).toBeDefined();
  });

  it("gives every semantic role a real dark value", () => {
    /*
      The chart roles are deliberately the same ladder in both themes, and the radius
      is a scale rather than a colour, so neither is a theme override.
      `--sidebar-primary-foreground` is white in both because the sidebar's primary
      role is a dark surface in both themes, so the text on it is the same.
    */
    const exempt = (role: string) =>
      role === "--radius" ||
      role.startsWith("--chart-") ||
      role.startsWith("--duration-") ||
      role.startsWith("--ease-") ||
      role === "--sidebar-primary-foreground";

    for (const role of Object.keys(layers.light)) {
      if (exempt(role)) continue;
      expect(layers.dark[role], `${role} has no dark value`).toBeDefined();
      expect(layers.dark[role], `${role} dark value is a copy of its light value`).not.toBe(
        layers.light[role],
      );
    }
  });

  it("resolves a role through the palette", () => {
    const resolved = resolveToken("--background", layers.light, layers.palette);
    expect(resolved).toMatch(/^oklch\(/);
  });

  it("throws for a role that does not exist", () => {
    expect(() => resolveToken("--nope", layers.light, layers.palette)).toThrow();
  });
});

describe("runContrastCheck", () => {
  it("passes every pair in both themes", () => {
    const failures = runContrastCheck().filter((result) => !result.passes);
    expect(failures.map((failure) => `${failure.theme} ${failure.label}`)).toEqual([]);
  });

  it("fails when a role is moved to a clearly insufficient value", () => {
    const css = readCss();
    const broken = css.replace("--foreground: var(--zinc-900);", "--foreground: var(--zinc-300);");
    const failures = runContrastCheck(broken).filter((result) => !result.passes);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((failure) => failure.theme === "light")).toBe(true);
  });
});

function readCss(): string {
  return readFileSync(CSS_PATH, "utf8");
}
