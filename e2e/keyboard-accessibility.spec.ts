import type { Locator, Page } from "@playwright/test";

import { loginAsCustomer, openAppearanceEditor } from "./helpers";
import { expect, test } from "./test";

// These tests are read-only (dialogs are cancelled, appearance reset is not confirmed),
// so they can safely run in parallel browser contexts.
test.describe.configure({ mode: "parallel" });

function skipMobileKeyboard(testInfo: { project: { name: string } }) {
  test.skip(
    testInfo.project.name === "mobile-390",
    "Keyboard traversal is covered by the desktop browser project; mobile uses touch-focused coverage.",
  );
}

async function tabTo(page: Page, target: Locator, maxTabs = 8) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }

  await expect(target).toBeFocused();
}

test.describe("R1.4 keyboard and focus checks", () => {
  test("login can be completed without a pointer", async ({ page, context }, testInfo) => {
    skipMobileKeyboard(testInfo);
    await context.clearCookies();
    await page.goto("/login");
    await expect(page.getByLabel("Username or email")).toBeEnabled();

    const identifier = page.getByLabel("Username or email");
    await tabTo(page, identifier);
    await page.keyboard.type(process.env.E2E_CUSTOMER_IDENTIFIER ?? "skyhook");

    const password = page.getByLabel("Password", { exact: true });
    await tabTo(page, password, 2);
    await page.keyboard.type(process.env.E2E_CUSTOMER_PASSWORD ?? "LinkzzzSky!2026");

    const signIn = page.getByRole("button", { name: "Sign in" });
    await tabTo(page, signIn);
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
  });

  test("create-link dialog receives keyboard focus and closes with Escape", async ({ page }, testInfo) => {
    skipMobileKeyboard(testInfo);
    await loginAsCustomer(page);
    await page.goto("/dashboard/links");

    const newLink = page.getByRole("button", { name: "New Smart Link" });
    await newLink.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "New Smart Link" });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Name", { exact: true })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("appearance categories work by keyboard and expose selection", async ({ page }, testInfo) => {
    skipMobileKeyboard(testInfo);
    await loginAsCustomer(page);
    await openAppearanceEditor(page);

    const background = page.getByRole("button", { name: "Background", exact: true });
    await background.focus();
    await page.keyboard.press("Enter");

    await expect(background).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Page background" })).toBeVisible();

    const spacing = page.getByRole("button", { name: "Spacing", exact: true });
    await spacing.focus();
    await page.keyboard.press("Enter");

    await expect(spacing).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Page spacing" })).toBeVisible();
  });

  test("focus-visible fallback is present on editor controls", async ({ page }, testInfo) => {
    skipMobileKeyboard(testInfo);
    await loginAsCustomer(page);
    await openAppearanceEditor(page);

    // Focus the Page-level Appearance tab, then advance with a real keyboard Tab.
    // Programmatic focus on a button does not have to match :focus-visible.
    const appearanceTab = page.getByRole("button", { name: "Appearance", exact: true });
    await appearanceTab.focus();

    const layout = page.getByRole("button", { name: "Layout", exact: true });
    await tabTo(page, layout);

    const focusStyle = await layout.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        focusVisible: element.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        boxShadow: style.boxShadow,
      };
    });

    expect(focusStyle.focusVisible).toBe(true);
    expect(
      (focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth >= 2) ||
        focusStyle.boxShadow !== "none",
    ).toBe(true);
  });
});

test("analytics period tabs expose keyboard selection", async ({ page }, testInfo) => {
  skipMobileKeyboard(testInfo);
  await loginAsCustomer(page);
  await page.goto("/dashboard/analytics");

  const sevenDays = page.getByRole("tab", { name: "7 days" });
  await sevenDays.focus();
  await page.keyboard.press("Enter");

  await expect(sevenDays).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
});

test("appearance reset uses an accessible confirmation dialog", async ({ page }, testInfo) => {
  skipMobileKeyboard(testInfo);
  await loginAsCustomer(page);
  await openAppearanceEditor(page);

  await page.getByRole("button", { name: "Reset", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Reset appearance?" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("mobile Landing Page editor switches between edit and preview", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Mobile-only interaction");
  await loginAsCustomer(page);
  await openAppearanceEditor(page);

  const preview = page.getByRole("button", { name: "Show inline preview", exact: true });
  await expect(preview).toBeVisible();
  await preview.click();
  await expect(page.getByText("Page preview", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Show editor", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Appearance settings" })).toBeVisible();
});
