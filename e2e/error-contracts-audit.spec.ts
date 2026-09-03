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

test("admin and custom-domain APIs expose stable errors while domain lifecycle audits the domain resource", async ({ page }) => {
  const customer = createUniqueCustomer("error contract", { plan: "PRO" });
  const domain = `e2e-${randomUUID().slice(0, 12)}.example.test`;
  const origin = new URL(
    process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
  ).origin;

  try {
    await loginAsAdmin(page);
    const created = await createCustomerViaAdminApi(page, customer);
    const customerId = created.id!;

    const duplicateCustomer = await page.request.post(`${origin}/api/admin/users`, {
      headers: { origin },
      data: customer,
    });
    expect(duplicateCustomer.status()).toBe(409);
    expect(await duplicateCustomer.json()).toMatchObject({
      code: "CUSTOMER_CONFLICT",
    });

    const missingCustomerAction = await page.request.post(
      `${origin}/api/admin/users/${randomUUID()}/actions`,
      {
        headers: { origin },
        data: { type: "SUSPEND", reason: "E2E missing customer" },
      },
    );
    expect(missingCustomerAction.status()).toBe(404);
    expect(await missingCustomerAction.json()).toEqual({
      error: "Customer not found.",
      code: "CUSTOMER_NOT_FOUND",
    });

    const smartLinkId = await findLandingPageId(customer.username);
    await loginViaApi(
      page,
      customer.username,
      customer.password,
      "CUSTOMER",
    );

    const addResponse = await page.request.post(`${origin}/api/custom-domains`, {
      headers: { origin },
      data: { smartLinkId, domain },
    });
    expect(addResponse.status()).toBe(201);
    const addPayload = await addResponse.json() as {
      domain?: { id?: string; domain?: string };
    };
    expect(addPayload.domain?.domain).toBe(domain);
    const customDomainId = addPayload.domain?.id;
    expect(customDomainId).toBeTruthy();

    const duplicateDomain = await page.request.post(`${origin}/api/custom-domains`, {
      headers: { origin },
      data: { smartLinkId, domain },
    });
    expect(duplicateDomain.status()).toBe(409);
    expect(await duplicateDomain.json()).toEqual({
      error: "This domain is already connected to a Smart Link.",
      code: "DOMAIN_ALREADY_CONNECTED",
    });

    const removeResponse = await page.request.delete(`${origin}/api/custom-domains`, {
      headers: { origin },
      data: { smartLinkId, domain },
    });
    expect(removeResponse.status()).toBe(204);

    const audits = await readDomainAudits(customerId, domain);
    expect(audits).toEqual([
      {
        action: "CUSTOM_DOMAIN_ADDED",
        resourceType: "CUSTOM_DOMAIN",
        resourceId: customDomainId,
      },
      {
        action: "CUSTOM_DOMAIN_REMOVED",
        resourceType: "CUSTOM_DOMAIN",
        resourceId: customDomainId,
      },
    ]);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function findLandingPageId(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{ id: string }>(
      `SELECT link."id"
       FROM "SmartLink" AS link
       INNER JOIN "User" AS owner ON owner."id" = link."userId"
       WHERE owner."username" = $1
         AND link."type" = 'LANDING_PAGE'::"SmartLinkType"
       ORDER BY link."createdAt" ASC
       LIMIT 1`,
      [username],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new Error("E2E Landing Page was not created.");
    return id;
  } finally {
    await database.end();
  }
}

async function readDomainAudits(userId: string, domain: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{
      action: string;
      resourceType: string;
      resourceId: string | null;
    }>(
      `SELECT "action", "resourceType", "resourceId"
       FROM "AuditLog"
       WHERE "targetUserId" = $1
         AND "action" IN ('CUSTOM_DOMAIN_ADDED', 'CUSTOM_DOMAIN_REMOVED')
         AND "metadata" ->> 'domain' = $2
       ORDER BY "createdAt" ASC`,
      [userId, domain],
    );
    return result.rows;
  } finally {
    await database.end();
  }
}
