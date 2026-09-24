import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * ESLint for the web app: the template's React setup, plus the rules this project
 * holds itself to. Prettier owns formatting, so no stylistic rule appears here.
 */
export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
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
    },
  },
  {
    files: ["vite.config.ts", "eslint.config.js"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
]);
