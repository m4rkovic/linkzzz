import { expect, test } from "@playwright/test";

import { loginAsCustomer, openAppearanceEditor } from "./helpers";

async function stabilize(page: Parameters<typeof loginAsCustomer>[0]) {
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
}

test.describe("R1.4 visual regression matrix", () => {
  test("landing", async ({ page }) => {
    await page.goto("/");
    await stabilize(page);
    await expect(page).toHaveScreenshot("landing.png", { fullPage: true });
  });

  test("login", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/login");
    await stabilize(page);
    await expect(page).toHaveScreenshot("login.png", { fullPage: true });
  });

  test("dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/dashboard");
    await stabilize(page);
    await expect(page).toHaveScreenshot("dashboard.png", { fullPage: true });
  });

  test("smart links list", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/dashboard/links");
    await stabilize(page);
    await expect(page).toHaveScreenshot("smart-links.png", { fullPage: true });
  });

  test("appearance editor", async ({ page }) => {
    await loginAsCustomer(page);
    await openAppearanceEditor(page);
    await stabilize(page);
    await expect(page).toHaveScreenshot("appearance-editor.png", { fullPage: true });
  });
});
