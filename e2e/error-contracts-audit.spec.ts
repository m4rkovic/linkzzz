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
    if (!customDomainId) throw new Error("E2E custom domain ID is missing.");

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

test("admin DTO and customer edit audits use explicit Smart Link terminology", async ({ page, context }) => {
  const customer = createUniqueCustomer("smartlink terms", { plan: "PRO" });
  const origin = new URL(
    process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
  ).origin;

  try {
    await loginAsAdmin(page);
    const created = await createCustomerViaAdminApi(page, customer);
    const customerId = created.id!;
    const smartLinkId = await findLandingPageId(customer.username);

    const adminResponse = await page.request.get(
      `${origin}/api/admin/users/${customerId}`,
    );
    expect(adminResponse.status()).toBe(200);
    const adminPayload = await adminResponse.json() as {
      user?: Record<string, unknown>;
    };
    expect(adminPayload.user?.smartLinksUsed).toBe(1);
    expect(
      Object.prototype.hasOwnProperty.call(adminPayload.user ?? {}, "linksUsed"),
    ).toBe(false);

    await context.clearCookies();
    await loginViaApi(
      page,
      customer.username,
      customer.password,
      "CUSTOMER",
    );

    const readResponse = await page.request.get(
      `${origin}/api/smart-links/${smartLinkId}`,
    );
    expect(readResponse.status()).toBe(200);
    const readPayload = await readResponse.json() as {
      smartLink: {
        title: string;
        slug: string;
        revision: number;
        primaryDestination?: unknown;
        deeplink: unknown;
        geo: unknown;
        shield: unknown;
        tracking: unknown;
      };
    };
    const source = readPayload.smartLink;
    const nextSlug = `${source.slug}-audit`;

    const updateResponse = await page.request.patch(
      `${origin}/api/smart-links/${smartLinkId}`,
      {
        headers: { origin },
        data: {
          revision: source.revision,
          smartLink: {
            title: `${source.title} updated`,
            slug: nextSlug,
            status: "PUBLISHED",
            primaryDestination: source.primaryDestination,
            deeplink: source.deeplink,
            geo: source.geo,
            shield: source.shield,
            tracking: source.tracking,
          },
        },
      },
    );
    expect(updateResponse.status()).toBe(200);

    const audits = await readSmartLinkEditAudits(customerId, smartLinkId);
    expect(audits).toEqual([
      {
        action: "SMART_LINK_SLUG_CHANGED",
        resourceType: "SMART_LINK",
        resourceId: smartLinkId,
      },
      {
        action: "SMART_LINK_PUBLISHED",
        resourceType: "SMART_LINK",
        resourceId: smartLinkId,
      },
      {
        action: "SMART_LINK_UPDATED",
        resourceType: "SMART_LINK",
        resourceId: smartLinkId,
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
       ORDER BY CASE "action"
         WHEN 'CUSTOM_DOMAIN_ADDED' THEN 1
         WHEN 'CUSTOM_DOMAIN_REMOVED' THEN 2
         ELSE 3
       END`,
      [userId, domain],
    );
    return result.rows;
  } finally {
    await database.end();
  }
}

async function readSmartLinkEditAudits(userId: string, smartLinkId: string) {
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
         AND "resourceId" = $2
         AND "action" IN (
           'SMART_LINK_SLUG_CHANGED',
           'SMART_LINK_PUBLISHED',
           'SMART_LINK_UPDATED'
         )
       ORDER BY CASE "action"
         WHEN 'SMART_LINK_SLUG_CHANGED' THEN 1
         WHEN 'SMART_LINK_PUBLISHED' THEN 2
         WHEN 'SMART_LINK_UPDATED' THEN 3
         ELSE 4
       END`,
      [userId, smartLinkId],
    );
    return result.rows;
  } finally {
    await database.end();
  }
}
