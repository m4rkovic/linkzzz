import type { Page } from "@playwright/test";

import { getPlanDefinition } from "../src/features/plans/plan-catalog";

import {
  countSmartLinkViews,
  createCustomerViaAdminApi,
  createUniqueCustomer,
  loginAsAdmin,
  loginViaApi,
  removeTestCustomer,
} from "./helpers";
import { expect, test } from "./test";

test("admin creates a Pro customer from the real form", async ({ page }) => {
  const customer = createUniqueCustomer("admin ui", { plan: "PRO" });

  try {
    await loginAsAdmin(page);
    await page.goto("/admin/users/new");

    await expect(page.getByLabel("Display name")).toBeEnabled();
    await page.getByLabel("Display name").fill(customer.displayName);
    await page.getByLabel("Login username").fill(customer.username);
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByLabel("Public slug").fill(customer.slug);
    await page.getByLabel("Temporary password").fill(customer.password);
    await page.getByRole("button", { name: /^Pro\b/ }).click();

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/users") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create customer" }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
    await expect(page).toHaveURL(/\/admin\/users\/[^/?]+$/);
    await expect(page.getByText(`@${customer.username}`, { exact: true })).toBeVisible();
  } finally {
    await removeTestCustomer(customer.username);
  }
});

test("customer replaces a required temporary password", async ({ page, context }) => {
  const customer = createUniqueCustomer("password", { mustChangePassword: true });
  const permanentPassword = "PermanentE2E!2026";

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await context.clearCookies();

    await loginFromUi(page, customer.username, customer.password);
    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByLabel("Current password")).toBeEnabled();
    await page.getByLabel("Current password").fill(customer.password);
    await page.getByLabel("New password", { exact: true }).fill(permanentPassword);
    await page.getByLabel("Confirm new password").fill(permanentPassword);

    const passwordResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/change-password") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Change password" }).click();
    const passwordResponse = await passwordResponsePromise;
    expect(passwordResponse.ok()).toBe(true);

    await expect(page).toHaveURL(/\/login\?passwordChanged=1$/);
    await expect(
      page.getByText("Password changed. Sign in again with your new password.", {
        exact: true,
      }),
    ).toBeVisible();

    await loginFromUi(page, customer.username, permanentPassword);
    await expect(page).toHaveURL(/\/dashboard$/);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

test("customer publishes a Landing Page that records a public view", async ({
  page,
  context,
}) => {
  const customer = createUniqueCustomer("publish");

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await context.clearCookies();
    await loginViaApi(page, customer.username, customer.password, "CUSTOMER");

    await page.goto("/dashboard/links");
    const landingPage = page
      .getByRole("article")
      .filter({
        has: page.getByRole("heading", {
          name: customer.displayName,
          exact: true,
        }),
      });
    await expect(landingPage).toBeVisible();
    await landingPage.getByRole("link", { name: /Edit/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/links\/[^/?]+$/);

    const editorNavigation = page.locator('nav[data-editor-navigation="sidebar"]');
    await expect(editorNavigation).toBeVisible();
    await editorNavigation.getByRole("button", { name: "Page", exact: true }).click();
    await page.getByRole("button", { name: "Cards", exact: true }).click();
    await page.getByRole("button", { name: "Add link", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Create link" })).toBeVisible();
    await page.getByLabel("Title").fill("E2E verified link");
    await page.getByLabel("Destination URL").fill("https://example.com/e2e");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByText(`1 / ${getPlanDefinition(customer.plan).pageLinkLimit}`, { exact: true }),
    ).toBeVisible();

    await page.goto("/dashboard/profile");
    await expect(page).toHaveURL(/\/dashboard\/links\/[^/?]+\?section=Page&page=Profile$/);
    await expect(page.getByLabel("Display name")).toBeEnabled();
    await page.getByLabel("Display name").fill(customer.displayName);
    await page.getByLabel("Bio").fill("Verified through the Linkzzz E2E flow.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();

    const publish = page.getByRole("button", { name: "Publish", exact: true });
    await expect(publish).toBeEnabled();
    await publish.click();
    await expect(page.getByText("Smart Link published", { exact: true })).toBeVisible();

    await page.goto(`/${customer.slug}`);
    await expect(page.getByText(customer.displayName, { exact: true }).first()).toBeVisible();
    await expect
      .poll(() => countSmartLinkViews(customer.slug), { timeout: 10_000 })
      .toBeGreaterThan(0);
  } finally {
    await removeTestCustomer(customer.username);
  }
});

test("mobile publish is blocked while Landing Page edits are unsaved", async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Mobile-only regression coverage.");
  const customer = createUniqueCustomer("mobile publish");

  try {
    await loginAsAdmin(page);
    await createCustomerViaAdminApi(page, customer);
    await context.clearCookies();
    await loginViaApi(page, customer.username, customer.password, "CUSTOMER");

    await page.goto("/dashboard/links");
    const landingPage = page
      .getByRole("article")
      .filter({
        has: page.getByRole("heading", {
          name: customer.displayName,
          exact: true,
        }),
      });
    await landingPage.getByRole("link", { name: /Edit/ }).click();

    const editorNavigation = page.locator('nav[data-editor-navigation="compact"]');
    await expect(editorNavigation).toBeVisible();
    await editorNavigation.getByRole("button", { name: "Page", exact: true }).click();
    await page.getByLabel("Display name").fill(`${customer.displayName} edited`);
    await expect(
      page.getByText("Page content has unsaved changes. Save them inside the Page section before publishing."),
    ).toBeVisible();

    await editorNavigation.getByRole("button", { name: "Smart Link", exact: true }).click();
    await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeDisabled();
  } finally {
    await removeTestCustomer(customer.username);
  }
});

async function loginFromUi(page: Page, identifier: string, password: string) {
  await page.goto("/login");
  await expect(page.getByLabel("Username or email")).toBeEnabled();
  await page.getByLabel("Username or email").fill(identifier);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
}
