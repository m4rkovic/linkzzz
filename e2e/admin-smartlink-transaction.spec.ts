import { Client } from "pg";

import { requireIsolatedE2EDatabaseUrl } from "./environment";
import {
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("admin SmartLink status changes are revisioned and audited together", async ({ page }) => {
  const customer = createUniqueCustomer("admin link tx");

  try {
    await loginAsAdmin(page);
    const created = await createCustomerViaAdminApi(page, customer);
    const userId = created.id!;
    const seeded = await seedLandingPagePublished(customer.username);
    const origin = new URL(page.url()).origin;

    const disable = await page.request.post(`${origin}/api/admin/users/${userId}/actions`, {
      headers: { origin },
      data: {
        type: "SET_SMART_LINK_STATUS",
        smartLinkId: seeded.smartLinkId,
        status: "DISABLED",
      },
    });
    expect(disable.status()).toBe(200);

    const disabled = await readState(seeded.smartLinkId);
    expect(disabled.status).toBe("DISABLED");
    expect(disabled.revision).toBe(seeded.revision + 1);
    expect(disabled.disabledAudits).toBe(1);
    expect(disabled.enabledAudits).toBe(0);

    const duplicateDisable = await page.request.post(
      `${origin}/api/admin/users/${userId}/actions`,
      {
        headers: { origin },
        data: {
          type: "SET_SMART_LINK_STATUS",
          smartLinkId: seeded.smartLinkId,
          status: "DISABLED",
        },
      },
    );
    expect(duplicateDisable.status()).toBe(400);

    const unchanged = await readState(seeded.smartLinkId);
    expect(unchanged).toEqual(disabled);

    const enable = await page.request.post(`${origin}/api/admin/users/${userId}/actions`, {
      headers: { origin },
      data: {
        type: "SET_SMART_LINK_STATUS",
        smartLinkId: seeded.smartLinkId,
        status: "PUBLISHED",
      },
    });
    expect(enable.status()).toBe(200);

    const enabled = await readState(seeded.smartLinkId);
    expect(enabled.status).toBe("PUBLISHED");
    expect(enabled.revision).toBe(disabled.revision + 1);
    expect(enabled.disabledAudits).toBe(1);
    expect(enabled.enabledAudits).toBe(1);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function seedLandingPagePublished(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{ smartLinkId: string; revision: number }>(
      `UPDATE "SmartLink" AS link
       SET "status" = 'PUBLISHED',
           "revision" = link."revision" + 1,
           "updatedAt" = NOW()
       FROM "User" AS app_user
       WHERE app_user."id" = link."userId"
         AND app_user."username" = $1
         AND link."type" = 'LANDING_PAGE'
       RETURNING link."id" AS "smartLinkId", link."revision"`,
      [username],
    );
    const row = result.rows[0];
    if (!row) throw new Error("E2E landing page SmartLink was not found.");
    return row;
  } finally {
    await database.end();
  }
}

async function readState(smartLinkId: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const link = await database.query<{ status: string; revision: number }>(
      `SELECT "status"::text AS "status", "revision"
       FROM "SmartLink"
       WHERE "id" = $1`,
      [smartLinkId],
    );
    const audits = await database.query<{
      disabledAudits: number;
      enabledAudits: number;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE "action" = 'SMART_LINK_DISABLED')::int AS "disabledAudits",
         COUNT(*) FILTER (WHERE "action" = 'SMART_LINK_ENABLED')::int AS "enabledAudits"
       FROM "AuditLog"
       WHERE "resourceType" = 'SMART_LINK'
         AND "resourceId" = $1`,
      [smartLinkId],
    );

    const smartLink = link.rows[0];
    const auditCounts = audits.rows[0];
    if (!smartLink || !auditCounts) throw new Error("E2E SmartLink state was not found.");
    return {
      status: smartLink.status,
      revision: smartLink.revision,
      disabledAudits: auditCounts.disabledAudits,
      enabledAudits: auditCounts.enabledAudits,
    };
  } finally {
    await database.end();
  }
}
