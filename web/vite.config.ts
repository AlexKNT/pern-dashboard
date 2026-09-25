import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

/**
 * Vite config for the admin app: React, Tailwind CSS v4 through its Vite plugin,
 * and the `@` alias pointing at `src` so imports read the same everywhere.
 *
 * In development the web app and the API run on different origins, so `/api` is
 * proxied to the API to keep the auth cookies first party. Production serves one
 * origin, so the proxy is a development concern only.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
