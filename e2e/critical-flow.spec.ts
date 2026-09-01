import "dotenv/config";

import { expect, test } from "@playwright/test";
import { Client } from "pg";

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

test("admin provisions a customer who publishes a profile and records analytics", async ({
  page,
}) => {
  const suffix = Date.now().toString(36);
  const username = `e2e${suffix}`.slice(0, 36);
  const slug = `e2e-${suffix}`.slice(0, 40);
  const email = `${username}@example.test`;
  const displayName = `E2E Customer ${suffix}`;
  const temporaryPassword = "E2eTemporary!2026";
  const permanentPassword = "E2ePermanent!2026";
  createdUsername = username;

  await login(page, adminUsername, adminPassword);
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/users/new", { waitUntil: "networkidle" });
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Login username").fill(username);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Public slug").fill(slug);
  await page.getByLabel("Temporary password").fill(temporaryPassword);
  await page.getByRole("button", { name: /Premium Plus/ }).click();
  await page.getByRole("button", { name: "Create customer" }).click();
  await expect(page).toHaveURL(/\/admin\/users\/[a-f0-9-]+$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, username, temporaryPassword);
  await expect(page).toHaveURL(/\/change-password$/);
  await page.getByLabel("Current password").fill(temporaryPassword);
  await page.getByLabel("New password", { exact: true }).fill(permanentPassword);
  await page.getByLabel("Confirm new password").fill(permanentPassword);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign in again" }).click();

  await login(page, username, permanentPassword);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/links", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add link" }).click();
  await expect(page.getByRole("heading", { name: "Create link" })).toBeVisible();
  await page.getByLabel("Title").fill("E2E verified link");
  await page.getByLabel("Default URL").fill("https://example.com/e2e");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("1 / 100", { exact: true })).toBeVisible();

  await page.goto("/dashboard/profile", { waitUntil: "networkidle" });
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Bio").fill("Verified through the Linkzzz critical E2E flow.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish profile" }).click();
  await expect(page.getByText("Your profile is live", { exact: true })).toBeVisible();

  const analyticsResponse = page.waitForResponse((response) => {
    if (!response.url().endsWith("/api/analytics/events")) return false;
    return response.request().postData()?.includes('"type":"PAGE_VIEW"') ?? false;
  });

  await page.goto(`/${slug}`, { waitUntil: "networkidle" });
  await expect(page.getByText(displayName, { exact: true }).first()).toBeVisible();
  expect((await analyticsResponse).status()).toBe(202);
});

async function login(
  page: import("@playwright/test").Page,
  identifier: string,
  password: string,
) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Username or email").fill(identifier);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  expect((await loginResponse).ok()).toBe(true);
}

async function removeTestCustomer(username: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

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
