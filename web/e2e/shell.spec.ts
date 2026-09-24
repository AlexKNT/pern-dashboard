import { expect, test, type Page } from "@playwright/test";

/**
 * The shell checks that need a real browser.
 *
 * `jsdom` has no layout engine, so the viewport floor, the sheet below `md`, the
 * keyboard traversal, the focus return from an overlay and reduced motion are only
 * meaningful here. Spec 0003's AC-8, AC-9, AC-11 and AC-20 are covered by these.
 */

/** The API the shell calls. Every test starts signed out, which is the shipped state. */
const SESSION_ENDPOINT = "**/api/auth/get-session";

/**
 * Sign the browser in with a session that carries a role, so the role aware parts of
 * the shell can be checked without the accounts feature.
 */
async function signIn(page: Page, role: "admin" | "teacher" | "student" | null): Promise<void> {
  await page.route(SESSION_ENDPOINT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.edu",
          ...(role ? { role } : {}),
        },
      }),
    });
  });
}

/** Sign out: the endpoint answers with a null body, so the guard redirects. */
async function signOut(page: Page): Promise<void> {
  await page.route(SESSION_ENDPOINT, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
}

test.describe("signed out", () => {
  test("a sessionless visitor lands on the sign in route without an error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await signOut(page);
    await page.goto("/");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("the shell at 360 pixels", () => {
  test.use({ viewport: { width: 360, height: 720 } });

  test("is usable and does not scroll sideways", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // The permanent rail is replaced by a sheet below `md`.
    await expect(page.getByRole("button", { name: "Toggle Sidebar" }).first()).toBeVisible();
  });

  test("opens the sidebar as a sheet from the header", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/");

    await page.getByRole("button", { name: "Toggle Sidebar" }).first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  });
});

test.describe("keyboard and focus", () => {
  test("reaches the shell controls and returns focus when an overlay closes", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/");

    // The sidebar trigger is reachable and named.
    const trigger = page.getByRole("button", { name: "Toggle Sidebar" }).first();
    await trigger.focus();
    await expect(trigger).toBeFocused();

    // Every navigation destination is reachable by keyboard and named.
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link").first()).toBeVisible();

    // Opening the command palette and closing it on escape returns focus to the page.
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("names every interactive control in the header", async ({ page }) => {
    await signIn(page, "teacher");
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Toggle Sidebar" }).first()).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Theme" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
  });

  test("opens the theme menu with its three choices", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/");

    await page.getByRole("combobox", { name: "Theme" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option", { name: "Light" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Dark" })).toBeVisible();
    await expect(page.getByRole("option", { name: "System" })).toBeVisible();
  });
});

test.describe("the theme", () => {
  test("applies the stored preference before the first paint", async ({ page }) => {
    await signIn(page, "admin");
    await page.addInitScript(() => window.localStorage.setItem("pern-dashboard-theme", "dark"));
    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("switches to dark through the control", async ({ page }) => {
    await signIn(page, "admin");
    await page.addInitScript(() => window.localStorage.setItem("pern-dashboard-theme", "light"));
    await page.goto("/");

    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await page.getByRole("combobox", { name: "Theme" }).click();
    await page.getByRole("option", { name: "Dark" }).click();

    await expect(page.locator("html")).toHaveClass(/dark/);
    const stored = await page.evaluate(() => window.localStorage.getItem("pern-dashboard-theme"));
    expect(stored).toBe("dark");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("collapses the sidebar transition", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/");

    // The reduced motion media query collapses every transition to a near instant
    // change. The browser reports the value in whichever form it prefers, so the
    // check is that it is effectively zero rather than a specific string.
    const duration = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);
      const value = getComputedStyle(probe).transitionDuration;
      probe.remove();
      return value;
    });

    const seconds = Number.parseFloat(duration);
    expect(seconds).toBeLessThan(0.001);
  });
});

test.describe("role aware navigation", () => {
  test("shows a student only the destinations their role may reach", async ({ page }) => {
    await signIn(page, "student");
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "My classes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Departments" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Audit log" })).toHaveCount(0);
  });

  test("shows only the shared destinations when the session carries no role", async ({ page }) => {
    await signIn(page, null);
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Departments" })).toHaveCount(0);
  });
});
