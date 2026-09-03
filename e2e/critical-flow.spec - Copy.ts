import "dotenv/config";

import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { requireDatabaseConnectionString } from "../src/server/config/postgres-connection-string";

const adminUsername = process.env.E2E_ADMIN_USERNAME ?? "admin";
const adminPassword =
  process.env.E2E_ADMIN_PASSWORD ??
  process.env.DEV_ADMIN_PASSWORD ??
  "LinkzzzAdmin!2026";

let createdUsername: string | undefined;

test.afterEach(async () => {
  if (createdUsername) await removeTestCustomer(createdUsername);
  createdUsername = undefined;
});

test("admin provisions a customer who publishes a Smart Link and records analytics", async ({
  page,
}) => {
  const suffix = Date.now().toString(36);
  const username = `e2e${suffix}`.slice(0, 36);
  const slug = `e2e-${suffix}`.slice(0, 40);
  const email = `${username}@example.test`;
  const displayName = `E2E Customer ${suffix}`;
  const temporaryPassword = "E2eTemporary!2026";
  const permanentPassword = "LinkzzzE2E!2026";
  createdUsername = username;

  await login(page, adminUsername, adminPassword);
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/users/new", { waitUntil: "domcontentloaded" });
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
  const displayNameInput = page.getByLabel("Display name");
  await displayNameInput.fill(displayName);
  await page.getByLabel("Login username").fill(username);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Public slug").fill(slug);
  await page.getByLabel("Temporary password").fill(temporaryPassword);
  await page.getByRole("button", { name: /Pro/ }).click();
  await page.getByRole("button", { name: "Create customer" }).click();
  await expect(page).toHaveURL(/\/admin\/users\/[a-f0-9-]+$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, username, temporaryPassword);
  await expect(page).toHaveURL(/\/change-password$/);
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
  await page.getByLabel("Current password").fill(temporaryPassword);
  await page.getByLabel("New password", { exact: true }).fill(permanentPassword);
  await page.getByLabel("Confirm new password").fill(permanentPassword);
  const changePasswordButton = page.getByRole("button", { name: "Change password" });
  await expect(changePasswordButton).toBeEnabled();
  const passwordChangeResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/change-password") &&
      response.request().method() === "POST",
  );
  await changePasswordButton.click();
  const passwordChangeResponse = await passwordChangeResponsePromise;
  const passwordChangePayload = await passwordChangeResponse.json().catch(() => ({}));
  if (!passwordChangeResponse.ok()) {
    throw new Error(
      `Password change failed (${passwordChangeResponse.status()}): ${passwordChangePayload.error ?? "Unknown error"}`,
    );
  }
  await expect(page).toHaveURL(/\/login\?passwordChanged=1$/);
  await expect(
    page.getByText("Password changed. Sign in again with your new password.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);

  await login(page, username, permanentPassword);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/links", { waitUntil: "domcontentloaded" });
  const provisionedSmartLink = page.getByRole("article").first();
  await expect(provisionedSmartLink).toBeVisible();
  await provisionedSmartLink.getByRole("link", { name: /Edit/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/links\/[^/]+$/);

  const editorNavigation = page.locator('nav[data-editor-navigation="sidebar"]');
  await expect(editorNavigation).toBeVisible();
  await editorNavigation.getByRole("button", { name: "Page", exact: true }).click();
  await page.getByRole("button", { name: "Cards", exact: true }).click();
  await page.getByRole("button", { name: "Add link", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create link", exact: true })).toBeVisible();
  await page.getByLabel("Title").fill("E2E verified link");
  await page.getByLabel("Destination URL", { exact: true }).fill("https://example.com/e2e");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("1 / 30", { exact: true })).toBeVisible();

  await page.goto("/dashboard/profile", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Bio").fill("Verified through the Linkzzz critical E2E flow.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish profile" }).click();
  await expect(page.getByText("Your profile is live", { exact: true })).toBeVisible();

  await page.goto(`/${slug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(displayName, { exact: true }).first()).toBeVisible();
  await expect.poll(() => countSmartLinkViews(slug), { timeout: 10_000 }).toBeGreaterThan(0);
});

async function login(
  page: import("@playwright/test").Page,
  identifier: string,
  password: string,
) {
  const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
  const origin = new URL(baseURL).origin;
  const response = await page.request.post(`${origin}/api/auth/login`, {
    headers: { origin },
    data: {
      identifier,
      password,
      rememberMe: true,
    },
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

  const destination = payload.mustChangePassword
    ? "/change-password"
    : payload.role === "ADMIN"
      ? "/admin"
      : "/dashboard";

  await page.goto(destination, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(
    payload.mustChangePassword
      ? /\/change-password(?:\/|$)/
      : payload.role === "ADMIN"
        ? /\/admin(?:\/|$)/
        : /\/dashboard(?:\/|$)/,
  );
}

async function removeTestCustomer(username: string) {
  if (!process.env.DATABASE_URL?.trim()) return;
  const connectionString = requireDatabaseConnectionString();

  const database = new Client({ connectionString });

  try {
    await database.connect();
    await database.query("BEGIN");
    const result = await database.query<{ id: string }>(
      'SELECT "id" FROM "User" WHERE "username" = $1',
      [username],
    );
    const userId = result.rows[0]?.id;

    if (userId) {
      await database.query(
        'DELETE FROM "AuditLog" WHERE "actorUserId" = $1 OR "targetUserId" = $1',
        [userId],
      );
      await database.query('DELETE FROM "User" WHERE "id" = $1', [userId]);
    }
    await database.query("COMMIT");
  } catch (error) {
    await database.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await database.end();
  }
}

async function countSmartLinkViews(slug: string) {
  if (!process.env.DATABASE_URL?.trim()) return 0;
  const connectionString = requireDatabaseConnectionString();

  const database = new Client({ connectionString });
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
