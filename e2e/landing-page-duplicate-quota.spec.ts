import { randomUUID } from "node:crypto";
import { Client } from "pg";

import { getPageCardLimit } from "../src/server/business/plans";
import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  loginViaApi,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("over-limit Landing Page cannot grow or be duplicated after a plan downgrade", async ({ page, context }) => {
  const customer = createUniqueCustomer("dup card quota", { plan: "BASIC" });
  const limit = getPageCardLimit("BASIC");
  const overLimitCount = limit + 1;

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    const sourceSmartLinkId = await seedLandingPageCards(customer.username, overLimitCount);

    await context.clearCookies();
    await loginViaApi(page, customer.username, customer.password, "CUSTOMER");
    const origin = new URL(page.url()).origin;

    const pageResponse = await page.request.get(
      `${origin}/api/smart-links/${sourceSmartLinkId}/page`,
    );
    expect(pageResponse.status()).toBe(200);
    const pageRecord = await pageResponse.json() as {
      profile: {
        links: Array<Record<string, unknown>>;
        [key: string]: unknown;
      };
      revision: number;
    };

    const growthResponse = await page.request.put(
      `${origin}/api/smart-links/${sourceSmartLinkId}/page`,
      {
        headers: { origin },
        data: {
          revision: pageRecord.revision,
          profile: {
            ...pageRecord.profile,
            links: [
              ...pageRecord.profile.links,
              {
                id: `e2e-growth-${randomUUID()}`,
                title: "Attempted overage growth",
                url: "https://example.com/overage-growth",
                visible: true,
                geoDestinations: [],
              },
            ],
          },
        },
      },
    );
    expect(growthResponse.status()).toBe(409);
    expect(await growthResponse.json()).toMatchObject({
      code: "PAGE_CARD_LIMIT_REACHED",
    });

    const duplicateResponse = await page.request.post(
      `${origin}/api/smart-links/${sourceSmartLinkId}/duplicate`,
      { headers: { origin } },
    );

    expect(duplicateResponse.status()).toBe(409);
    const payload = await duplicateResponse.json() as {
      code?: string;
      limit?: number;
      currentCount?: number;
    };
    expect(payload.code).toBe("PAGE_CARD_LIMIT_REACHED");
    expect(payload.limit).toBe(limit);
    expect(payload.currentCount).toBe(overLimitCount);

    const state = await readCustomerState(customer.username);
    expect(state.smartLinkCount).toBe(1);
    expect(state.pageCardCount).toBe(overLimitCount);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function seedLandingPageCards(username: string, count: number) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const source = await database.query<{ smartLinkId: string; pageId: string }>(
      `SELECT link."id" AS "smartLinkId", page."id" AS "pageId"
       FROM "User" AS app_user
       INNER JOIN "SmartLink" AS link ON link."userId" = app_user."id"
       INNER JOIN "Page" AS page ON page."smartLinkId" = link."id"
       WHERE app_user."username" = $1
         AND link."type" = 'LANDING_PAGE'
       ORDER BY link."createdAt" ASC
       LIMIT 1`,
      [username],
    );
    const row = source.rows[0];
    if (!row) throw new Error("E2E Landing Page was not found.");

    for (let index = 0; index < count; index += 1) {
      await database.query(
        `INSERT INTO "PageCard"
          ("id", "pageId", "title", "url", "visible", "sortOrder", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())`,
        [
          randomUUID(),
          row.pageId,
          `Existing overage card ${index + 1}`,
          `https://example.com/overage/${index + 1}`,
          index,
        ],
      );
    }

    return row.smartLinkId;
  } finally {
    await database.end();
  }
}

async function readCustomerState(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{
      smartLinkCount: number;
      pageCardCount: number;
    }>(
      `SELECT
         COUNT(DISTINCT link."id")::int AS "smartLinkCount",
         COUNT(card."id")::int AS "pageCardCount"
       FROM "User" AS app_user
       INNER JOIN "SmartLink" AS link ON link."userId" = app_user."id"
       LEFT JOIN "Page" AS page ON page."smartLinkId" = link."id"
       LEFT JOIN "PageCard" AS card ON card."pageId" = page."id"
       WHERE app_user."username" = $1`,
      [username],
    );
    return result.rows[0] ?? { smartLinkCount: 0, pageCardCount: 0 };
  } finally {
    await database.end();
  }
}
