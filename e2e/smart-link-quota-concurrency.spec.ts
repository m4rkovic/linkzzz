import { Client } from "pg";

import { getPlanDefinition } from "../src/features/plans/plan-catalog";
import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  loginViaApi,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("parallel SmartLink creates cannot exceed the plan quota", async ({ page, context }) => {
  const customer = createUniqueCustomer("quota race", { plan: "BASIC" });
  const limit = getPlanDefinition("BASIC").smartLinkLimit;

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await seedSmartLinksToCount(customer.username, limit - 1);

    await context.clearCookies();
    await loginViaApi(page, customer.username, customer.password, "CUSTOMER");
    const origin = new URL(page.url()).origin;

    const createLink = (suffix: string) => page.request.post(`${origin}/api/smart-links`, {
      headers: { origin },
      data: {
        type: "DIRECT",
        title: `Concurrent quota ${suffix}`,
        slug: `${customer.slug}-quota-${suffix}`.slice(0, 40),
        primaryDestination: {
          provider: "CUSTOM",
          url: `https://example.com/quota/${suffix}`,
        },
      },
    });

    const responses = await Promise.all([createLink("a"), createLink("b")]);
    expect(responses.map((response) => response.status()).sort()).toEqual([201, 409]);

    const rejected = responses.find((response) => response.status() === 409);
    expect(rejected).toBeTruthy();
    const payload = await rejected!.json() as { code?: string };
    expect(payload.code).toBe("SMART_LINK_LIMIT_REACHED");
    expect(await countSmartLinks(customer.username)).toBe(limit);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function seedSmartLinksToCount(username: string, targetCount: number) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const user = await database.query<{ id: string }>(
      `SELECT "id" FROM "User" WHERE "username" = $1 AND "role" = 'CUSTOMER'`,
      [username],
    );
    const userId = user.rows[0]?.id;
    if (!userId) throw new Error("E2E quota customer was not found.");

    const count = await database.query<{ count: number }>(
      `SELECT COUNT(*)::int AS "count" FROM "SmartLink" WHERE "userId" = $1`,
      [userId],
    );
    const missing = targetCount - (count.rows[0]?.count ?? 0);
    if (missing <= 0) return;

    await database.query(
      `INSERT INTO "SmartLink"
        ("userId", "type", "title", "slug", "status", "createdAt", "updatedAt")
       SELECT $1,
              'DIRECT'::"SmartLinkType",
              'Quota seed ' || seed::text,
              LEFT($2 || '-seed-' || seed::text, 40),
              'DRAFT'::"SmartLinkStatus",
              NOW(),
              NOW()
       FROM generate_series(1, $3::int) AS seed`,
      [userId, username.replaceAll("_", "-"), missing],
    );
  } finally {
    await database.end();
  }
}

async function countSmartLinks(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{ count: number }>(
      `SELECT COUNT(*)::int AS "count"
       FROM "SmartLink" AS link
       INNER JOIN "User" AS app_user ON app_user."id" = link."userId"
       WHERE app_user."username" = $1`,
      [username],
    );
    return result.rows[0]?.count ?? 0;
  } finally {
    await database.end();
  }
}
