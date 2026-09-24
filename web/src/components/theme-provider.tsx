import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyTheme,
  DARK_MEDIA_QUERY,
  readThemePreference,
  resolveTheme,
  systemPrefersDark,
  watchSystemTheme,
  writeThemePreference,
  type ThemePreference,
} from "@/lib/theme";
import { ThemeContext } from "@/lib/theme-context";

/**
 * Owns the theme for the app: reads the stored preference, resolves it against the
 * operating system, and keeps the `dark` class on the document in step.
 *
 * The first paint is already correct because `index.html` runs the same resolve
 * before the bundle loads; this provider takes over from there, including when the
 * system preference changes while the app is open.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [prefersDark, setPrefersDark] = useState<boolean>(() =>
    systemPrefersDark(safeMatchMedia(DARK_MEDIA_QUERY)),
  );

  const resolved = resolveTheme(preference, prefersDark);

  useEffect(() => {
    applyTheme(resolved, document.documentElement);
  }, [resolved]);

  useEffect(() => watchSystemTheme(safeMatchMedia(DARK_MEDIA_QUERY), setPrefersDark), []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeThemePreference(next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

function safeMatchMedia(query: string): MediaQueryList | null {
  return typeof globalThis.matchMedia === "function" ? globalThis.matchMedia(query) : null;
}
