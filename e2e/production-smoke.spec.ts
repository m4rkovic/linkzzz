import { expect, test } from "@playwright/test";

const publicSlug = process.env.E2E_PUBLIC_SMART_LINK_SLUG?.trim();

test.describe("production deployment smoke", () => {
  test.skip(
    process.env.E2E_EXTERNAL_SERVER !== "1",
    "Production smoke targets an already deployed preview/production server.",
  );

  test("marketing homepage is reachable with the static production CSP", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /One Smart Link/i })).toBeVisible();

    const csp = response?.headers()["content-security-policy"] ?? "";
    const scriptSrc = directive(csp, "script-src");
    expect(scriptSrc).toBe("script-src 'none'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(directive(csp, "style-src")).toContain("'unsafe-inline'");
  });

  test("native marketing navigation reaches the nonce-protected login surface", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.locator('input[type="password"]')).toBeVisible();

    const loginResponse = await page.request.get("/login", { maxRedirects: 0 });
    expect(loginResponse.ok()).toBeTruthy();
    const csp = loginResponse.headers()["content-security-policy"] ?? "";
    const scriptSrc = directive(csp, "script-src");
    expect(scriptSrc).toMatch(/'nonce-[^']+'/);
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  test("internal custom-domain runtime route is not public on the application host", async ({ request }) => {
    const response = await request.get("/__linkzzz/custom-domain", { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });

  test("configured public Smart Link renders through the deployed runtime", async ({ page }) => {
    test.skip(!publicSlug, "Set E2E_PUBLIC_SMART_LINK_SLUG to enable public-runtime smoke coverage.");
    const response = await page.goto(`/${encodeURIComponent(publicSlug!)}`);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator(".linkzzz-public-page")).toBeVisible();
  });
});

function directive(policy: string, name: string) {
  return (
    policy
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name} `)) ?? ""
  );
}
