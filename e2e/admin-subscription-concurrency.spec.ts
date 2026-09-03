import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("parallel renewals serialize instead of losing a subscription extension", async ({ page }) => {
  const customer = createUniqueCustomer("renew race", { plan: "PRO" });

  try {
    await loginAsAdmin(page);
    const created = await createCustomerViaAdminApi(page, customer);
    const userId = created.id!;
    const initial = await readSubscriptionState(userId);
    const origin = new URL(page.url()).origin;

    const renew = () => page.request.post(`${origin}/api/admin/users/${userId}/actions`, {
      headers: { origin },
      data: { type: "RENEW", months: 1 },
    });

    const responses = await Promise.all([renew(), renew()]);
    expect(responses.map((response) => response.status())).toEqual([200, 200]);

    const final = await readSubscriptionState(userId);
    const expectedEnd = addMonthsClamped(addMonthsClamped(initial.endsAt, 1), 1);

    expect(final.endsAt.getTime()).toBe(expectedEnd.getTime());
    expect(final.historyRenewals).toBe(initial.historyRenewals + 2);
    expect(final.auditRenewals).toBe(initial.auditRenewals + 2);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function readSubscriptionState(userId: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const subscription = await database.query<{ endsAt: Date }>(
      `SELECT "endsAt" FROM "Subscription" WHERE "userId" = $1`,
      [userId],
    );
    const history = await database.query<{ count: number }>(
      `SELECT COUNT(*)::int AS "count"
       FROM "SubscriptionHistory"
       WHERE "userId" = $1 AND "action" = 'RENEWED'`,
      [userId],
    );
    const audit = await database.query<{ count: number }>(
      `SELECT COUNT(*)::int AS "count"
       FROM "AuditLog"
       WHERE "targetUserId" = $1 AND "action" = 'SUBSCRIPTION_RENEWED'`,
      [userId],
    );

    const endsAt = subscription.rows[0]?.endsAt;
    if (!endsAt) throw new Error("E2E renewal customer subscription was not found.");

    return {
      endsAt,
      historyRenewals: history.rows[0]?.count ?? 0,
      auditRenewals: audit.rows[0]?.count ?? 0,
    };
  } finally {
    await database.end();
  }
}

function addMonthsClamped(source: Date, months: number) {
  const day = source.getDate();
  const result = new Date(source);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}
