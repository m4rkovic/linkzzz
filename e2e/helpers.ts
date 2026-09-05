import { Client } from "pg";
import { expect, type Page } from "@playwright/test";

import { formatSubscriptionDateInput } from "../src/server/business/subscription-dates";
import { requireIsolatedE2EDatabaseUrl } from "./environment";

const ADMIN_IDENTIFIER = process.env.E2E_ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ??
  process.env.DEV_ADMIN_PASSWORD ??
  "LinkzzzAdmin!2026";
const CUSTOMER_IDENTIFIER = process.env.E2E_CUSTOMER_IDENTIFIER ?? "skyhook";
const CUSTOMER_PASSWORD =
  process.env.E2E_CUSTOMER_PASSWORD ??
  process.env.DEV_SKYHOOK_PASSWORD ??
  "LinkzzzSky!2026";

export type E2ECustomer = {
  displayName: string;
  username: string;
  email: string;
  slug: string;
  password: string;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  periodStart: string;
  periodEnd: string;
  autoRenew: boolean;
  mustChangePassword: boolean;
};

export function createUniqueCustomer(
  purpose: string,
  options: Partial<Pick<E2ECustomer, "mustChangePassword" | "plan">> = {},
): E2ECustomer {
  const safePurpose = purpose.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 10);
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const username = `e2e_${safePurpose}_${suffix}`.slice(0, 36);
  const start = new Date();
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);

  return {
    displayName: `E2E ${purpose} ${suffix}`,
    username,
    email: `${username}@example.test`,
    slug: username.replaceAll("_", "-").slice(0, 40),
    password: "LinkzzzE2E!2026",
    plan: options.plan ?? "PRO",
    periodStart: formatSubscriptionDateInput(start),
    periodEnd: formatSubscriptionDateInput(end),
    autoRenew: false,
    mustChangePassword: options.mustChangePassword ?? false,
  };
}

export async function loginAsAdmin(page: Page) {
  return loginViaApi(page, ADMIN_IDENTIFIER, ADMIN_PASSWORD, "ADMIN");
}

export async function loginAsCustomer(page: Page) {
  return loginViaApi(page, CUSTOMER_IDENTIFIER, CUSTOMER_PASSWORD, "CUSTOMER");
}

export async function loginViaApi(
  page: Page,
  identifier: string,
  password: string,
  expectedRole?: "ADMIN" | "CUSTOMER",
) {
  const origin = e2eOrigin();
  const response = await page.request.post(`${origin}/api/auth/login`, {
    headers: {
      origin,
      "x-forwarded-for": randomDocumentationIp(),
    },
    data: { identifier, password, rememberMe: true },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    role?: "CUSTOMER" | "ADMIN";
    mustChangePassword?: boolean;
    error?: string;
  };

  if (!response.ok() || !payload.ok || !payload.role) {
    throw new Error(
      `E2E API login failed (${response.status()}): ${payload.error ?? "Unknown login error."}`,
    );
  }
  if (expectedRole && payload.role !== expectedRole) {
    throw new Error(`Expected ${expectedRole} login, received ${payload.role}.`);
  }

  const destination = payload.mustChangePassword
    ? "/change-password"
    : payload.role === "ADMIN"
      ? "/admin"
      : "/dashboard";
  // Wait for the protected destination to finish loading before a test starts
  // another navigation. Returning at DOMContentLoaded allowed the initial
  // dashboard navigation to race with an immediate page.goto() in mobile runs.
  await page.goto(destination, { waitUntil: "load" });
  return payload;
}

export async function createCustomerViaAdminApi(
  page: Page,
  customer: E2ECustomer,
) {
  const origin = e2eOrigin();
  const response = await page.request.post(`${origin}/api/admin/users`, {
    headers: { origin },
    data: customer,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    user?: { id?: string; username?: string };
    error?: string;
  };

  if (!response.ok() || !payload.user?.id) {
    throw new Error(
      `E2E customer setup failed (${response.status()}): ${payload.error ?? "Unknown create-customer error."}`,
    );
  }
  return payload.user;
}

export async function removeTestCustomer(username: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    await database.query("BEGIN");
    const result = await database.query<{ id: string }>(
      `SELECT "id" FROM "User"
       WHERE "username" = $1 AND "role" = 'CUSTOMER' AND LEFT("username", 4) = 'e2e_'`,
      [username],
    );
    const userId = result.rows[0]?.id;
    if (userId) {
      await database.query(
        `DELETE FROM "AuditLog"
         WHERE "actorUserId" = $1 OR "targetUserId" = $1`,
        [userId],
      );
      await database.query(`DELETE FROM "User" WHERE "id" = $1`, [userId]);
    }
    await database.query("COMMIT");
  } catch (error) {
    await database.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await database.end();
  }
}

export async function countSmartLinkViews(slug: string) {
  const database = new Client({ connectionString: requireIsolatedE2EDatabaseUrl() });
  try {
    await database.connect();
    const result = await database.query<{ count: number }>(
      `SELECT COUNT(*)::int AS "count"
       FROM "AnalyticsEvent" AS event
       INNER JOIN "SmartLink" AS link ON link."id" = event."smartLinkId"
       WHERE link."slug" = $1 AND event."type" = 'SMART_LINK_VIEW'`,
      [slug],
    );
    return result.rows[0]?.count ?? 0;
  } finally {
    await database.end();
  }
}

export async function openSeedLandingPageEditor(page: Page) {
  await page.goto("/dashboard/links");
  const skyHookCard = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Sky Hook", exact: true }) });

  await expect(skyHookCard).toBeVisible();
  await skyHookCard.getByRole("link", { name: /Edit/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/links\/[^/]+$/);
}

export async function openAppearanceEditor(page: Page) {
  await openSeedLandingPageEditor(page);
  const viewportWidth = page.viewportSize()?.width ?? 1440;
  const navigationKind = viewportWidth >= 1280 ? "sidebar" : "compact";
  const navigation = page.locator(`nav[data-editor-navigation="${navigationKind}"]`);
  await expect(navigation).toBeVisible();
  await navigation.getByRole("button", { name: "Page", exact: true }).click();
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Appearance settings" })).toBeVisible();
}

function e2eOrigin() {
  return new URL(process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100").origin;
}

function randomDocumentationIp() {
  const third = 1 + Math.floor(Math.random() * 254);
  const fourth = 1 + Math.floor(Math.random() * 254);
  return `198.19.${third}.${fourth}`;
}
