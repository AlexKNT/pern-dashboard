import { defineConfig } from "vitest/config";

/** Vitest for the API: node environment, tests colocated under src. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
