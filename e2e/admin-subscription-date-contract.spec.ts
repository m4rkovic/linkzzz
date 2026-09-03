import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("admin date-only subscription input persists the selected day at UTC noon", async ({ page }) => {
  const customer = createUniqueCustomer("date contract");
  customer.periodStart = "2027-03-28";
  customer.periodEnd = "2027-10-31";

  try {
    await loginAsAdmin(page);
    const created = await createCustomerViaAdminApi(page, customer);
    const subscription = await readSubscriptionDates(created.id!);

    expect(subscription.startsAt.toISOString()).toBe("2027-03-28T12:00:00.000Z");
    expect(subscription.endsAt.toISOString()).toBe("2027-10-31T12:00:00.000Z");
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function readSubscriptionDates(userId: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{ startsAt: Date; endsAt: Date }>(
      `SELECT "startsAt", "endsAt"
       FROM "Subscription"
       WHERE "userId" = $1`,
      [userId],
    );
    const subscription = result.rows[0];
    if (!subscription) throw new Error("E2E subscription date customer was not found.");
    return subscription;
  } finally {
    await database.end();
  }
}
