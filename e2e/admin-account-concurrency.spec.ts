import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("stop immediately cannot race with reactivation into an active stopped account", async ({ page }) => {
  const customer = createUniqueCustomer("account race", { plan: "PRO" });

  try {
    await loginAsAdmin(page);
    const created = await createCustomerViaAdminApi(page, customer);
    const userId = created.id!;
    const origin = new URL(page.url()).origin;

    const stop = () => page.request.post(`${origin}/api/admin/users/${userId}/actions`, {
      headers: { origin },
      data: { type: "STOP_IMMEDIATELY" },
    });
    const reactivate = () => page.request.post(`${origin}/api/admin/users/${userId}/actions`, {
      headers: { origin },
      data: { type: "REACTIVATE" },
    });

    const responses = await Promise.all([stop(), reactivate()]);
    const statuses = responses.map((response) => response.status()).sort();
    expect(statuses[0]).toBe(200);
    expect([200, 400]).toContain(statuses[1]);

    const state = await readAccountState(userId);
    expect(state.subscriptionStatus).toBe("STOPPED");
    expect(state.accountStatus).toBe("DISABLED");
    expect(state.stopAudits).toBe(1);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function readAccountState(userId: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{
      accountStatus: string;
      subscriptionStatus: string;
      stopAudits: number;
    }>(
      `SELECT app_user."accountStatus",
              subscription."status" AS "subscriptionStatus",
              (
                SELECT COUNT(*)::int
                FROM "AuditLog" AS audit
                WHERE audit."targetUserId" = app_user."id"
                  AND audit."action" = 'SUBSCRIPTION_STOPPED'
              ) AS "stopAudits"
       FROM "User" AS app_user
       INNER JOIN "Subscription" AS subscription
         ON subscription."userId" = app_user."id"
       WHERE app_user."id" = $1`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) throw new Error("E2E admin account customer was not found.");
    return row;
  } finally {
    await database.end();
  }
}
