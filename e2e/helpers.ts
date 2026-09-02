import { expect, type Page } from "@playwright/test";

const CUSTOMER_IDENTIFIER = process.env.E2E_CUSTOMER_IDENTIFIER ?? "skyhook";
const CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD ?? "LinkzzzSky!2026";

export async function loginAsCustomer(page: Page) {
  const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
  const origin = new URL(baseURL).origin;
  const response = await page.request.post(`${origin}/api/auth/login`, {
    headers: { origin },
    data: {
      identifier: CUSTOMER_IDENTIFIER,
      password: CUSTOMER_PASSWORD,
      rememberMe: true,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    role?: string;
    mustChangePassword?: boolean;
    error?: string;
  };

  if (!response.ok() || !payload.ok) {
    throw new Error(
      `Customer E2E API login failed (${response.status()}): ${payload.error ?? "Unknown login error."}`,
    );
  }

  if (payload.mustChangePassword) {
    throw new Error("Customer E2E seed unexpectedly requires a password change.");
  }

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
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
  const viewportWidth = page.viewportSize()?.width ?? 1440;
  const navigationKind = viewportWidth >= 1280 ? "sidebar" : "compact";
  const navigation = page.locator(`nav[data-editor-navigation="${navigationKind}"]`);
  await expect(navigation).toBeVisible();
  await navigation.getByRole("button", { name: "Page", exact: true }).click();
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Appearance settings" })).toBeVisible();
}
