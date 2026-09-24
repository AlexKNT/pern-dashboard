import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the checks Vitest cannot do.
 *
 * `jsdom` has no layout engine, so the 360 pixel viewport floor, the keyboard focus
 * order, the focus return from an overlay and reduced motion are all checked here
 * instead. The dev server is started and stopped by Playwright itself.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    /*
      The shell reads the session from the API. Each test stubs that one call, so the
      API does not have to be running: point it at a port nothing serves and the
      stubbed route answers first.
    */
    env: { VITE_API_URL: "http://127.0.0.1:3399" },
  },
});
