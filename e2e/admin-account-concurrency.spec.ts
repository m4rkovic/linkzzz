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
    expect([200, 409]).toContain(statuses[1]);

    const state = await readAccountState(userId);
    expect(state.subscriptionStatus).toBe("STOPPED");
    expect(state.accountStatus).toBe("DISABLED");
    expect(state.stopAudits).toBe(1);
    expect(state.userDisabledAudits).toBe(1);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

test("subscription stop and renewal preserve an existing moderation suspension", async ({ page }) => {
  const customer = createUniqueCustomer("moderation lock", { plan: "PRO" });

  try {
    await loginAsAdmin(page);
    const created = await createCustomerViaAdminApi(page, customer);
    const userId = created.id!;
    const origin = new URL(page.url()).origin;

    const suspendResponse = await page.request.post(
      `${origin}/api/admin/users/${userId}/actions`,
      {
        headers: { origin },
        data: { type: "SUSPEND", reason: "E2E moderation lock" },
      },
    );
    expect(suspendResponse.status()).toBe(200);

    const stopResponse = await page.request.post(
      `${origin}/api/admin/users/${userId}/actions`,
      {
        headers: { origin },
        data: { type: "STOP_IMMEDIATELY" },
      },
    );
    expect(stopResponse.status()).toBe(200);

    const stopped = await readAccountState(userId);
    expect(stopped.accountStatus).toBe("SUSPENDED");
    expect(stopped.subscriptionStatus).toBe("STOPPED");
    expect(stopped.userDisabledAudits).toBe(0);

    const renewResponse = await page.request.post(
      `${origin}/api/admin/users/${userId}/actions`,
      {
        headers: { origin },
        data: { type: "RENEW", months: 1 },
      },
    );
    expect(renewResponse.status()).toBe(200);

    const renewed = await readAccountState(userId);
    expect(renewed.accountStatus).toBe("SUSPENDED");
    expect(renewed.subscriptionStatus).toBe("ACTIVE");
    expect(renewed.userReactivatedAudits).toBe(0);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

test("password reset changes credentials, forces rotation and revokes sessions atomically", async ({ page }) => {
  const customer = createUniqueCustomer("password reset", { plan: "PRO" });

  try {
    await loginAsAdmin(page);
    const created = await createCustomerViaAdminApi(page, customer);
    const userId = created.id!;
    const origin = new URL(page.url()).origin;

    const initial = await seedSessionAndReadPasswordState(userId);
    const response = await page.request.post(`${origin}/api/admin/users/${userId}/actions`, {
      headers: { origin },
      data: { type: "RESET_PASSWORD" },
    });
    expect(response.status()).toBe(200);
    const payload = await response.json() as { temporaryPassword?: string };
    expect(payload.temporaryPassword).toMatch(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%]).{16}$/);

    const final = await readPasswordState(userId);
    expect(final.passwordHash).not.toBe(initial.passwordHash);
    expect(final.mustChangePassword).toBe(true);
    expect(final.activeSessions).toBe(0);
    expect(final.resetAudits).toBe(initial.resetAudits + 1);
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
      userDisabledAudits: number;
      userReactivatedAudits: number;
    }>(
      `SELECT app_user."accountStatus",
              subscription."status" AS "subscriptionStatus",
              (
                SELECT COUNT(*)::int
                FROM "AuditLog" AS audit
                WHERE audit."targetUserId" = app_user."id"
                  AND audit."action" = 'SUBSCRIPTION_STOPPED'
              ) AS "stopAudits",
              (
                SELECT COUNT(*)::int
                FROM "AuditLog" AS audit
                WHERE audit."targetUserId" = app_user."id"
                  AND audit."action" = 'USER_DISABLED'
              ) AS "userDisabledAudits",
              (
                SELECT COUNT(*)::int
                FROM "AuditLog" AS audit
                WHERE audit."targetUserId" = app_user."id"
                  AND audit."action" = 'USER_REACTIVATED'
              ) AS "userReactivatedAudits"
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

async function seedSessionAndReadPasswordState(userId: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const initial = await readPasswordStateWithClient(database, userId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    await database.query(
      `INSERT INTO "Session"
        ("id", "userId", "tokenHash", "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [randomUUID(), userId, `e2e-reset-${randomUUID()}`, expiresAt, now],
    );
    return initial;
  } finally {
    await database.end();
  }
}

async function readPasswordState(userId: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    return await readPasswordStateWithClient(database, userId);
  } finally {
    await database.end();
  }
}

async function readPasswordStateWithClient(database: Client, userId: string) {
  const result = await database.query<{
    passwordHash: string;
    mustChangePassword: boolean;
    activeSessions: number;
    resetAudits: number;
  }>(
    `SELECT credential."passwordHash",
            credential."mustChangePassword",
            (
              SELECT COUNT(*)::int
              FROM "Session" AS session
              WHERE session."userId" = credential."userId"
                AND session."revokedAt" IS NULL
            ) AS "activeSessions",
            (
              SELECT COUNT(*)::int
              FROM "AuditLog" AS audit
              WHERE audit."targetUserId" = credential."userId"
                AND audit."action" = 'PASSWORD_RESET'
            ) AS "resetAudits"
     FROM "PasswordCredential" AS credential
     WHERE credential."userId" = $1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) throw new Error("E2E password credential was not found.");
  return row;
}
