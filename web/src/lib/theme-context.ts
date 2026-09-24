import { createContext } from "react";
import type { ResolvedTheme, ThemePreference } from "@/lib/theme";

/** What the theme context hands to the switcher and to anything else that reads it. */
export type ThemeContextValue = {
  /** What the user picked, including `system`. */
  preference: ThemePreference;
  /** What is actually on screen right now. */
  resolved: ResolvedTheme;
  /** Store a new preference and apply it immediately. */
  setPreference: (preference: ThemePreference) => void;
};

/**
 * The theme context, kept in its own file so the provider module exports only
 * components and React's fast refresh keeps working.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);
