import { useContext } from "react";
import { ThemeContext } from "@/lib/theme-context";
import type { ThemeContextValue } from "@/lib/theme-context";

/**
 * Read the current theme and the setter.
 * Throws when used outside `ThemeProvider`, because a silent fallback would leave a
 * control that appears to work and does nothing.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider.");
  return context;
}
