import { randomUUID } from "node:crypto";
import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  loginViaApi,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("page saves replace client child IDs without touching another customer's rows", async ({
  page,
  context,
}) => {
  const customer = createUniqueCustomer("page child owner");
  const otherCustomer = createUniqueCustomer("page child other");
  const temporarySocialId = `tmp-social-${randomUUID()}`;
  const temporaryStatId = `tmp-stat-${randomUUID()}`;
  const temporaryGeoId = `tmp-geo-${randomUUID()}`;

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await createCustomerViaAdminApi(page, otherCustomer);

    const fixture = await seedForeignPageCard(
      customer.username,
      otherCustomer.username,
    );

    await context.clearCookies();
    await loginViaApi(page, customer.username, customer.password, "CUSTOMER");
    const origin = new URL(page.url()).origin;

    const currentResponse = await page.request.get(
      `${origin}/api/smart-links/${fixture.smartLinkId}/page`,
    );
    expect(currentResponse.status()).toBe(200);
    const current = (await currentResponse.json()) as {
      profile: Record<string, unknown> & {
        links: unknown[];
        socials: unknown[];
        stats?: unknown[];
      };
      revision: number;
    };

    const saveResponse = await page.request.put(
      `${origin}/api/smart-links/${fixture.smartLinkId}/page`,
      {
        headers: { origin },
        data: {
          revision: current.revision,
          profile: {
            ...current.profile,
            links: [
              {
                id: fixture.foreignCardId,
                title: "Owned replacement",
                url: "https://example.com/owned-replacement",
                visible: true,
                geoDestinations: [
                  {
                    id: temporaryGeoId,
                    countryCode: "RS",
                    countryName: "Serbia",
                    url: "https://example.com/rs",
                  },
                ],
              },
            ],
            socials: [
              {
                id: temporarySocialId,
                name: "Website",
                url: "https://example.com/social",
                visible: true,
              },
            ],
            stats: [
              {
                id: temporaryStatId,
                value: "42",
                label: "Projects",
                visible: true,
              },
            ],
            engagement: {
              featuredLinkId: fixture.foreignCardId,
              campaign: {
                enabled: true,
                primaryLinkId: fixture.foreignCardId,
              },
            },
          },
        },
      },
    );

    expect(saveResponse.status()).toBe(200);
    const saved = (await saveResponse.json()) as {
      profile: {
        links: Array<{ id: string; geoDestinations: Array<{ id: string }> }>;
        socials: Array<{ id: string }>;
        stats?: Array<{ id: string }>;
        engagement?: {
          featuredLinkId?: string;
          campaign?: { primaryLinkId?: string };
        };
      };
    };

    const savedCardId = saved.profile.links[0]?.id;
    expect(savedCardId).toBeTruthy();
    expect(savedCardId).not.toBe(fixture.foreignCardId);
    expect(saved.profile.links[0]?.geoDestinations[0]?.id).not.toBe(temporaryGeoId);
    expect(saved.profile.socials[0]?.id).not.toBe(temporarySocialId);
    expect(saved.profile.stats?.[0]?.id).not.toBe(temporaryStatId);
    expect(saved.profile.engagement?.featuredLinkId).toBe(savedCardId);
    expect(saved.profile.engagement?.campaign?.primaryLinkId).toBe(savedCardId);

    const databaseState = await readIntegrityState(
      fixture.foreignCardId,
      fixture.foreignGeoId,
      fixture.smartLinkId,
    );
    expect(databaseState.foreignCardTitle).toBe("Foreign protected card");
    expect(databaseState.foreignGeoUrl).toBe("https://example.com/foreign-rs");
    expect(databaseState.ownedCardId).toBe(savedCardId);
  } finally {
    await removeTestCustomer(customer.username);
    await removeTestCustomer(otherCustomer.username);
  }
});

async function seedForeignPageCard(
  username: string,
  otherUsername: string,
) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  const foreignCardId = randomUUID();
  const foreignGeoId = randomUUID();

  try {
    await database.connect();
    const pages = await database.query<{
      username: string;
      smartLinkId: string;
      pageId: string;
    }>(
      `SELECT app_user."username",
              link."id" AS "smartLinkId",
              page."id" AS "pageId"
       FROM "User" AS app_user
       INNER JOIN "SmartLink" AS link ON link."userId" = app_user."id"
       INNER JOIN "Page" AS page ON page."smartLinkId" = link."id"
       WHERE app_user."username" = ANY($1::text[])
         AND link."type" = 'LANDING_PAGE'`,
      [[username, otherUsername]],
    );

    const ownPage = pages.rows.find((row) => row.username === username);
    const foreignPage = pages.rows.find((row) => row.username === otherUsername);
    if (!ownPage || !foreignPage) {
      throw new Error("E2E page-child fixture pages were not found.");
    }

    await database.query(
      `INSERT INTO "PageCard"
        ("id", "pageId", "title", "url", "visible", "sortOrder", "createdAt", "updatedAt")
       VALUES ($1, $2, 'Foreign protected card', 'https://example.com/foreign', true, 0, NOW(), NOW())`,
      [foreignCardId, foreignPage.pageId],
    );
    await database.query(
      `INSERT INTO "PageCardGeoDestination"
        ("id", "pageCardId", "countryCode", "countryName", "url", "createdAt", "updatedAt")
       VALUES ($1, $2, 'RS', 'Serbia', 'https://example.com/foreign-rs', NOW(), NOW())`,
      [foreignGeoId, foreignCardId],
    );

    return {
      smartLinkId: ownPage.smartLinkId,
      foreignCardId,
      foreignGeoId,
    };
  } finally {
    await database.end();
  }
}

async function readIntegrityState(
  foreignCardId: string,
  foreignGeoId: string,
  ownedSmartLinkId: string,
) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const foreign = await database.query<{
      title: string;
      geoUrl: string;
    }>(
      `SELECT card."title", geo."url" AS "geoUrl"
       FROM "PageCard" AS card
       INNER JOIN "PageCardGeoDestination" AS geo ON geo."pageCardId" = card."id"
       WHERE card."id" = $1 AND geo."id" = $2`,
      [foreignCardId, foreignGeoId],
    );
    const owned = await database.query<{ id: string }>(
      `SELECT card."id"
       FROM "PageCard" AS card
       INNER JOIN "Page" AS page ON page."id" = card."pageId"
       WHERE page."smartLinkId" = $1`,
      [ownedSmartLinkId],
    );

    return {
      foreignCardTitle: foreign.rows[0]?.title ?? null,
      foreignGeoUrl: foreign.rows[0]?.geoUrl ?? null,
      ownedCardId: owned.rows[0]?.id ?? null,
    };
  } finally {
    await database.end();
  }
}
