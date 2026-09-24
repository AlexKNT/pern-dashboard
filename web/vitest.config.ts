import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for the web app.
 *
 * The alias and the React plugin match `vite.config.ts`, so a test imports the same
 * modules the app does. `jsdom` gives the DOM the component tests need; anything
 * that depends on a real layout engine (viewport, focus order, reduced motion) is
 * checked in Playwright instead, because jsdom has none.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL("./src/", import.meta.url)) },
      /*
        `@refinedev/react-table` imports `lodash/isEqual` without an extension, which
        Node's ESM resolver refuses to resolve when Vitest loads it directly. Pointing
        that one specifier at the real file keeps the library usable without a
        workaround at the call site.
      */
      {
        find: /^lodash\/isEqual$/,
        replacement: fileURLToPath(new URL("./node_modules/lodash/isEqual.js", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "eslint-rules/**/*.test.ts"],
    css: false,
    server: {
      deps: {
        /*
          `@refinedev/react-table` imports `lodash/isEqual` without a file extension,
          which Node's ESM resolver refuses when Vitest loads the library as an
          external dependency. Inlining it puts the import through Vite's resolver,
          which handles the extensionless path.
        */
        inline: ["@refinedev/react-table"],
      },
    },
  },
});
