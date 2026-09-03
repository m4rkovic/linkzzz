import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  loginViaApi,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("SmartLink creation is rate limited per customer", async ({ page, context }) => {
  const customer = createUniqueCustomer("create rate", { plan: "PRO" });
  const origin = new URL(
    process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
  ).origin;
  const slugPrefix = customer.slug.slice(0, 24);

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await context.clearCookies();
    await loginViaApi(page, customer.username, customer.password, "CUSTOMER");

    for (let index = 1; index <= 10; index += 1) {
      const response = await page.request.post(`${origin}/api/smart-links`, {
        headers: { origin },
        data: {
          type: "DIRECT",
          title: `Rate limited link ${index}`,
          slug: `${slugPrefix}-rate-${index}`,
          primaryDestination: {
            provider: "WEBSITE",
            url: `https://example.com/rate-limit-${index}`,
          },
        },
      });
      expect(response.status(), `create request ${index}`).toBe(201);
    }

    const blockedSlug = `${slugPrefix}-rate-11`;
    const blocked = await page.request.post(`${origin}/api/smart-links`, {
      headers: { origin },
      data: {
        type: "DIRECT",
        title: "Rate limited link 11",
        slug: blockedSlug,
        primaryDestination: {
          provider: "WEBSITE",
          url: "https://example.com/rate-limit-11",
        },
      },
    });
    expect(blocked.status()).toBe(429);
    const blockedPayload = (await blocked.json()) as {
      error?: string;
      retryAfterMs?: number;
    };
    expect(blockedPayload.error).toContain("Too many SmartLink creation attempts");
    expect(blockedPayload.retryAfterMs).toBeGreaterThan(0);

    const listResponse = await page.request.get(`${origin}/api/smart-links`);
    expect(listResponse.ok()).toBe(true);
    const listPayload = (await listResponse.json()) as {
      smartLinks?: Array<{ slug?: string }>;
    };
    const createdRateLimitLinks = (listPayload.smartLinks ?? []).filter((smartLink) =>
      smartLink.slug?.startsWith(`${slugPrefix}-rate-`),
    );
    expect(createdRateLimitLinks).toHaveLength(10);
    expect(createdRateLimitLinks.some((smartLink) => smartLink.slug === blockedSlug)).toBe(false);
  } finally {
    await removeTestCustomer(customer.username);
  }
});
