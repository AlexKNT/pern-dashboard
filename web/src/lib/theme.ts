/**
 * Reading, writing and resolving the theme preference.
 *
 * This module is deliberately plain TypeScript with no React in it, so the same
 * logic can be unit tested and can also be inlined into `web/index.html` as the pre
 * paint script. The inline script and this file must resolve identically: if they
 * disagree, a page loaded in dark flashes light before the bundle runs.
 */

/** What the user picked. `system` follows the operating system. */
export type ThemePreference = "light" | "dark" | "system";

/** What the interface is actually showing. */
export type ResolvedTheme = "light" | "dark";

/** The `localStorage` key the preference is stored under. */
export const THEME_STORAGE_KEY = "pern-dashboard-theme";

/** The media query that reports the operating system's colour scheme. */
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/** Every valid preference, in the order the switcher lists them. */
export const THEME_PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];

/** Narrow an unknown value to a preference, or return null for anything else. */
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Read the stored preference.
 * Anything unset, unreadable or unrecognised falls back to `system` rather than
 * throwing, so a corrupt or blocked `localStorage` cannot break the app.
 */
export function readThemePreference(storage?: Pick<Storage, "getItem">): ThemePreference {
  const store = storage ?? safeStorage();
  if (!store) return "system";

  try {
    const stored = store.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/**
 * Store the preference.
 * Failing to write is not an error worth surfacing: the theme still applies for
 * this session, it just is not remembered.
 */
export function writeThemePreference(
  preference: ThemePreference,
  storage?: Pick<Storage, "setItem">,
): void {
  const store = storage ?? safeStorage();
  if (!store) return;

  try {
    store.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage can be full or blocked. The in memory state stays correct, so ignore it.
  }
}

/**
 * Turn a preference into the theme to render: `system` becomes whatever the
 * operating system reports, and the two explicit values pass through.
 */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
}

/**
 * Put the resolved theme on the document.
 * Dark is an additive `dark` class on the root element and light is its absence, so
 * Tailwind's `dark:` variant and the `.dark` token block both follow.
 */
export function applyTheme(theme: ResolvedTheme, root: HTMLElement): void {
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Whether the operating system currently asks for dark. */
export function systemPrefersDark(query: MediaQueryList | null): boolean {
  return query?.matches ?? false;
}

/**
 * Subscribe to a change of the operating system's colour scheme.
 * Returns an unsubscribe function. A null query (no `matchMedia`) is a no-op, which
 * keeps this usable in jsdom and in older environments.
 */
export function watchSystemTheme(
  query: MediaQueryList | null,
  onChange: (prefersDark: boolean) => void,
): () => void {
  if (!query) return () => undefined;

  const listener = (event: MediaQueryListEvent) => onChange(event.matches);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function safeStorage(): Pick<Storage, "getItem" | "setItem"> | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    // Accessing `localStorage` throws when storage is blocked by the browser.
    return undefined;
  }
}
