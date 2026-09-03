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

type LinkSnapshot = {
  id: string;
  type: "LANDING_PAGE" | "DIRECT";
  revision: number;
};

test("parallel Landing Page deletes cannot remove the final Landing Page", async ({
  page,
  context,
}) => {
  const customer = createUniqueCustomer("landing delete");

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await context.clearCookies();
    await loginViaApi(page, customer.username, customer.password, "CUSTOMER");

    const origin = new URL(page.url()).origin;
    const initialResponse = await page.request.get(`${origin}/api/smart-links`);
    expect(initialResponse.ok()).toBe(true);
    const initialPayload = await initialResponse.json() as { smartLinks?: LinkSnapshot[] };
    const initialLandingPage = initialPayload.smartLinks?.find(
      (smartLink) => smartLink.type === "LANDING_PAGE",
    );
    expect(initialLandingPage).toBeTruthy();

    const secondResponse = await page.request.post(`${origin}/api/smart-links`, {
      headers: { origin },
      data: {
        type: "LANDING_PAGE",
        title: "Second Landing Page",
        slug: `${customer.slug}-second`,
      },
    });
    expect(secondResponse.status()).toBe(201);
    const secondPayload = await secondResponse.json() as { smartLink?: LinkSnapshot };
    expect(secondPayload.smartLink?.type).toBe("LANDING_PAGE");

    const secondLandingPage = secondPayload.smartLink!;
    const remove = (smartLink: LinkSnapshot) =>
      page.request.delete(`${origin}/api/smart-links/${smartLink.id}`, {
        headers: { origin },
        data: { revision: smartLink.revision },
      });

    const responses = await Promise.all([
      remove(initialLandingPage!),
      remove(secondLandingPage),
    ]);
    expect(responses.map((response) => response.status()).sort()).toEqual([204, 403]);

    const rejected = responses.find((response) => response.status() === 403);
    expect(rejected).toBeTruthy();
    const rejectedPayload = await rejected!.json() as { code?: string };
    expect(rejectedPayload.code).toBe("LAST_LANDING_PAGE");

    await expect.poll(() => readDeletionState(customer.username)).toEqual({
      landingPages: 1,
      deletionAudits: 1,
    });
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function readDeletionState(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{
      landingPages: number;
      deletionAudits: number;
    }>(
      `SELECT
         (
           SELECT COUNT(*)::int
           FROM "SmartLink" AS link
           WHERE link."userId" = app_user."id"
             AND link."type" = 'LANDING_PAGE'
         ) AS "landingPages",
         (
           SELECT COUNT(*)::int
           FROM "AuditLog" AS audit
           WHERE audit."targetUserId" = app_user."id"
             AND audit."action" = 'SMART_LINK_DELETED'
         ) AS "deletionAudits"
       FROM "User" AS app_user
       WHERE app_user."username" = $1`,
      [username],
    );

    return result.rows[0] ?? { landingPages: 0, deletionAudits: 0 };
  } finally {
    await database.end();
  }
}
