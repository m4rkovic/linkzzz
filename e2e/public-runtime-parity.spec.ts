import { randomUUID } from "node:crypto";

import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("custom domain root shares runtime and metadata with the platform slug", async ({ page }) => {
  const customer = createUniqueCustomer("runtime parity", { plan: "PRO" });
  const domain = `e2e-${randomUUID().slice(0, 12)}.example.test`;

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await publishCustomerLandingPageAndAttachDomain(customer.username, domain);

    const origin = new URL(
      process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
    ).origin;
    const crawlerHeaders = {
      "user-agent": "facebookexternalhit/1.1",
    };

    const [platformResponse, customDomainResponse] = await Promise.all([
      page.request.get(`${origin}/${customer.slug}`, {
        headers: crawlerHeaders,
      }),
      page.request.get(`${origin}/`, {
        headers: {
          ...crawlerHeaders,
          host: domain,
        },
      }),
    ]);

    expect(platformResponse.status()).toBe(200);
    expect(customDomainResponse.status()).toBe(200);

    const [platformHtml, customDomainHtml] = await Promise.all([
      platformResponse.text(),
      customDomainResponse.text(),
    ]);

    expect(customDomainHtml).toContain(customer.displayName);
    expect(extractTitle(customDomainHtml)).toBe(extractTitle(platformHtml));
    expect(extractMeta(customDomainHtml, "og:title")).toBe(
      extractMeta(platformHtml, "og:title"),
    );
    expect(extractMeta(customDomainHtml, "og:description")).toBe(
      extractMeta(platformHtml, "og:description"),
    );
    expect(extractMeta(customDomainHtml, "og:title")).toBe(customer.displayName);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function publishCustomerLandingPageAndAttachDomain(
  username: string,
  domain: string,
) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    await database.query("BEGIN");

    const result = await database.query<{ smartLinkId: string }>(
      `SELECT link."id" AS "smartLinkId"
       FROM "SmartLink" AS link
       INNER JOIN "User" AS owner ON owner."id" = link."userId"
       WHERE owner."username" = $1
         AND link."type" = 'LANDING_PAGE'
       ORDER BY link."createdAt" ASC
       LIMIT 1`,
      [username],
    );
    const smartLinkId = result.rows[0]?.smartLinkId;
    if (!smartLinkId) throw new Error("E2E Landing Page was not created.");

    await database.query(
      `UPDATE "SmartLink"
       SET "status" = 'PUBLISHED', "revision" = "revision" + 1
       WHERE "id" = $1`,
      [smartLinkId],
    );
    await database.query(
      `INSERT INTO "CustomDomain" (
         "id", "smartLinkId", "domain", "status", "verificationToken", "verifiedAt", "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, 'ACTIVE', $4, NOW(), NOW(), NOW())`,
      [randomUUID(), smartLinkId, domain, `e2e-${randomUUID()}`],
    );

    await database.query("COMMIT");
  } catch (error) {
    await database.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await database.end();
  }
}

function extractTitle(html: string) {
  return decodeHtmlAttribute(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
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
