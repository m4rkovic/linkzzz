import { expect, test } from "./test";
import { loginAsCustomer, openAppearanceEditor } from "./helpers";

const HYDRATION_PATTERNS = [
  "hydration failed",
  "hydration mismatch",
  "a tree hydrated but some attributes",
  "server rendered html didn't match",
  "server-rendered html didn't match",
  "text content does not match server-rendered html",
];

function watchHydrationProblems(page: Parameters<typeof loginAsCustomer>[0]) {
  const problems: string[] = [];

  const recordIfHydrationProblem = (source: string, message: string) => {
    const normalized = message.toLowerCase();
    if (HYDRATION_PATTERNS.some((pattern) => normalized.includes(pattern))) {
      problems.push(`${source}: ${message}`);
    }
  };

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      recordIfHydrationProblem(`console.${message.type()}`, message.text());
    }
  });

  page.on("pageerror", (error) => {
    recordIfHydrationProblem("pageerror", error.message);
  });

  return async function assertHydrationClean() {
    await page.waitForLoadState("load");
    await expect(page.locator('[data-hydrated="false"]')).toHaveCount(0);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });

    expect(
      problems,
      problems.length
        ? `React hydration problems were reported:\n${problems.join("\n\n")}`
        : "No React hydration problems should be reported.",
    ).toEqual([]);
  };
}

test.describe("critical route hydration cleanliness", () => {
  test("login hydrates without React mismatch warnings", async ({ page, context }) => {
    const assertHydrationClean = watchHydrationProblems(page);
    await context.clearCookies();
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in to Linkzzz" })).toBeVisible();
    await assertHydrationClean();
  });

  test("dashboard hydrates cleanly", async ({ page }) => {
    const assertHydrationClean = watchHydrationProblems(page);
    await loginAsCustomer(page, "/dashboard");
    await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
    await assertHydrationClean();
  });

  test("Smart Links list hydrates cleanly", async ({ page }) => {
    const assertHydrationClean = watchHydrationProblems(page);
    await loginAsCustomer(page, "/dashboard/links");
    await expect(page.getByRole("heading", { name: "Smart Links", exact: true })).toBeVisible();
    await assertHydrationClean();
  });

  test("Appearance editor hydrates cleanly", async ({ page }) => {
    const assertHydrationClean = watchHydrationProblems(page);
    await loginAsCustomer(page, "/dashboard/links");
    await openAppearanceEditor(page);
    await expect(page.getByRole("navigation", { name: "Appearance settings" })).toBeVisible();
    await assertHydrationClean();
  });
});
