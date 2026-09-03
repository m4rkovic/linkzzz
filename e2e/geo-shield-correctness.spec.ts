import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

const HUMAN_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
const FACEBOOK_CRAWLER_UA = "facebookexternalhit/1.1";

test("unknown geo is safe while strict Shield serves metadata previews to known crawlers", async ({ page }) => {
  const customer = createUniqueCustomer("geo shield", { plan: "PRO" });

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await configurePublishedGeoShieldLink(customer.username);

    const origin = new URL(
      process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
    ).origin;
    const publicUrl = `${origin}/${customer.slug}`;

    const unknownLocation = await page.request.get(publicUrl, {
      headers: { "user-agent": HUMAN_UA },
    });
    expect(unknownLocation.status()).toBe(200);
    expect(await unknownLocation.text()).toContain(customer.displayName);

    const spoofedUnconfiguredHeader = await page.request.get(publicUrl, {
      headers: {
        "user-agent": HUMAN_UA,
        "cf-ipcountry": "RS",
      },
    });
    expect(spoofedUnconfiguredHeader.status()).toBe(200);

    const trustedConfiguredHeader = await page.request.get(publicUrl, {
      headers: {
        "user-agent": HUMAN_UA,
        "x-vercel-ip-country": "RS",
      },
    });
    expect(trustedConfiguredHeader.status()).toBe(404);

    const crawlerPreview = await page.request.get(publicUrl, {
      headers: { "user-agent": FACEBOOK_CRAWLER_UA },
    });
    expect(crawlerPreview.status()).toBe(200);
    const crawlerHtml = await crawlerPreview.text();
    expect(crawlerHtml).toContain("Link preview");
    expect(extractMeta(crawlerHtml, "og:title")).toBe(customer.displayName);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function configurePublishedGeoShieldLink(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query(
      `UPDATE "SmartLink" AS link
       SET "status" = 'PUBLISHED'::"SmartLinkStatus",
           "geoConfig" = $2::jsonb,
           "shieldConfig" = $3::jsonb,
           "revision" = "revision" + 1
       FROM "User" AS app_user
       WHERE app_user."id" = link."userId"
         AND app_user."username" = $1
         AND link."type" = 'LANDING_PAGE'::"SmartLinkType"`,
      [
        username,
        JSON.stringify({
          enabled: true,
          rules: [
            {
              id: "block-rs",
              countries: ["RS"],
              action: { type: "BLOCK" },
            },
          ],
          fallback: { type: "BLOCK" },
        }),
        JSON.stringify({
          enabled: true,
          mode: "STRICT",
          verifiedCrawlerPolicy: "ALLOW",
        }),
      ],
    );
    if (result.rowCount !== 1) {
      throw new Error("E2E Geo/Shield SmartLink was not found.");
    }
  } finally {
    await database.end();
  }
}

function extractMeta(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const propertyFirst = new RegExp(
    `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escaped}["'][^>]*>`,
    "i",
  );
  return decodeHtmlAttribute(
    propertyFirst.exec(html)?.[1] ?? contentFirst.exec(html)?.[1] ?? "",
  );
}

function decodeHtmlAttribute(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
