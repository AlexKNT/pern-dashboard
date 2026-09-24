import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import palette from "./eslint-rules/no-raw-palette-class.js";

/**
 * ESLint for the web app: the template's React setup, plus the rules this project
 * holds itself to. Prettier owns formatting, so no stylistic rule appears here.
 */
export default defineConfig([
  globalIgnores(["dist", "coverage", "playwright-report", "test-results"]),
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { palette },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // The project rule: no `any` anywhere, including an accidental one.
      "@typescript-eslint/no-explicit-any": "error",
      "no-warning-comments": ["warn", { terms: ["todo", "fixme", "hack"], location: "anywhere" }],
      // Every colour comes from a semantic role. `src/index.css` is the one
      // exception, because that is where the palette is declared.
      "palette/no-raw-palette-class": "error",
    },
  },
  {
    /*
      The shadcn components are copied into the repo from the registry and kept as
      they came, so upstream fixes stay applicable. The project's own house rules
      apply to the code we write, not to the vendored component source.
    */
    files: ["src/components/ui/**/*.tsx", "src/hooks/use-mobile.ts"],
    rules: {
      "react-refresh/only-export-components": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // The palette declaration site, and the rule's own tests, which must be able to
    // write a raw palette class in order to prove the rule catches it.
    files: ["eslint-rules/**/*.js", "eslint-rules/**/*.test.ts"],
    rules: { "palette/no-raw-palette-class": "off" },
  },
  {
    files: ["vite.config.ts", "eslint.config.js", "vitest.config.ts", "playwright.config.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
]);
