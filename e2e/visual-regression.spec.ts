import { loginAsCustomer, openAppearanceEditor, openCardsEditor } from "./helpers";
import { expect, test } from "./test";

async function stabilize(page: Parameters<typeof loginAsCustomer>[0]) {
  // Screenshot helpers may temporarily mutate caret/animation styles. Wait for
  // client hydration to finish first so React never hydrates over a DOM that
  // Playwright has already modified for deterministic screenshots.
  await expect(page.locator('[data-hydrated="false"]')).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
    `,
  });

  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });

  const viewportWidth = page.viewportSize()?.width;
  if (viewportWidth) {
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewportWidth);
  }
}

test.describe("R1.4 visual regression matrix", () => {
  test("landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot("landing.png", { fullPage: true });
  });

  test("login", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in to Linkzzz" })).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot("login.png", { fullPage: true });
  });

  test("dashboard", async ({ page }) => {
    await loginAsCustomer(page, "/dashboard");
    await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot("dashboard.png", { fullPage: true });
  });

  test("smart links list", async ({ page }) => {
    await loginAsCustomer(page, "/dashboard/links");
    await expect(page.getByRole("heading", { name: "Smart Links", exact: true })).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot("smart-links.png", { fullPage: true });
  });

  test("appearance editor", async ({ page }) => {
    await loginAsCustomer(page, "/dashboard/links");
    await openAppearanceEditor(page);
    await stabilize(page);
    await expect(page).toHaveScreenshot("appearance-editor.png", { fullPage: true });
  });

  test("cards editor create form", async ({ page }) => {
    await loginAsCustomer(page, "/dashboard/links");
    await openCardsEditor(page);
    await page.getByRole("button", { name: "Add link", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Create link", exact: true })).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot("cards-editor-create.png", { fullPage: true });
  });
});
