import { expect, type Page } from "@playwright/test";

const CUSTOMER_IDENTIFIER = process.env.E2E_CUSTOMER_IDENTIFIER ?? "skyhook";
const CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD ?? "LinkzzzSky!2026";

export async function loginAsCustomer(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username or email").fill(CUSTOMER_IDENTIFIER);
  await page.getByLabel("Password", { exact: true }).fill(CUSTOMER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
}

export async function openSeedLandingPageEditor(page: Page) {
  await page.goto("/dashboard/links");
  const skyHookCard = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Sky Hook", exact: true }) });

  await expect(skyHookCard).toBeVisible();
  await skyHookCard.getByRole("link", { name: /Edit/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/links\/[^/]+$/);
}

export async function openAppearanceEditor(page: Page) {
  await openSeedLandingPageEditor(page);
  await page.getByRole("button", { name: "Page", exact: true }).click();
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Appearance settings" })).toBeVisible();
}
