import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

const CHROME_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36";

test("browser analytics ingest accepts only bounded fallback events with server-owned identity", async ({ page }) => {
  const customer = createUniqueCustomer("analytics ingest", { plan: "PRO" });
  const requestIp = `198.51.100.${10 + Math.floor(Math.random() * 200)}`;

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await publishCustomerSmartLink(customer.username);

    const origin = new URL(page.url()).origin;
    const headers = {
      "x-forwarded-for": requestIp,
      "x-vercel-ip-country": "RS",
      "x-vercel-ip-city": "Nis",
      "user-agent": CHROME_ANDROID_UA,
    };

    const spoofedIdentity = await page.request.post(`${origin}/api/analytics/events`, {
      headers,
      data: {
        slug: customer.slug,
        type: "DEEPLINK_FALLBACK",
        visitorId: "attacker-controlled-visitor",
      },
    });
    expect(spoofedIdentity.status()).toBe(400);

    const serverOnlyEvent = await page.request.post(`${origin}/api/analytics/events`, {
      headers,
      data: { slug: customer.slug, type: "SMART_LINK_VIEW" },
    });
    expect(serverOnlyEvent.status()).toBe(400);

    const oversized = await page.request.post(`${origin}/api/analytics/events`, {
      headers,
      data: {
        slug: customer.slug,
        type: "DEEPLINK_FALLBACK",
        padding: "x".repeat(5_000),
      },
    });
    expect(oversized.status()).toBe(413);

    const accepted = await page.request.post(`${origin}/api/analytics/events`, {
      headers,
      data: { slug: customer.slug, type: "DEEPLINK_FALLBACK" },
    });
    expect(accepted.status()).toBe(202);

    const events = await readFallbackEvents(customer.username);
    expect(events).toHaveLength(1);
    expect(events[0]?.visitorId).toMatch(/^[a-f0-9]{32}$/);
    expect(events[0]?.visitorId).not.toBe("attacker-controlled-visitor");
    expect(events[0]?.countryCode).toBe("RS");
    expect(events[0]?.city).toBe("Nis");
    expect(events[0]?.device).toBe("Mobile");
    expect(events[0]?.browser).toBe("Chrome");
    expect(events[0]?.os).toBe("Android");
    expect(events[0]?.isBot).toBe(false);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function publishCustomerSmartLink(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query(
      `UPDATE "SmartLink" AS link
       SET "status" = 'PUBLISHED'::"SmartLinkStatus"
       FROM "User" AS app_user
       WHERE app_user."id" = link."userId"
         AND app_user."username" = $1
         AND link."type" = 'LANDING_PAGE'::"SmartLinkType"`,
      [username],
    );
    if (result.rowCount !== 1) {
      throw new Error("E2E analytics SmartLink was not found.");
    }
  } finally {
    await database.end();
  }
}

async function readFallbackEvents(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{
      visitorId: string | null;
      countryCode: string | null;
      city: string | null;
      device: string | null;
      browser: string | null;
      os: string | null;
      isBot: boolean;
    }>(
      `SELECT event."visitorId", event."countryCode", event."city", event."device",
              event."browser", event."os", event."isBot"
       FROM "AnalyticsEvent" AS event
       INNER JOIN "SmartLink" AS link ON link."id" = event."smartLinkId"
       INNER JOIN "User" AS app_user ON app_user."id" = link."userId"
       WHERE app_user."username" = $1
         AND event."type" = 'DEEPLINK_FALLBACK'::"AnalyticsEventType"
       ORDER BY event."createdAt" ASC`,
      [username],
    );
    return result.rows;
  } finally {
    await database.end();
  }
}
