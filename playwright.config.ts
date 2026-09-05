import { defineConfig, devices } from "@playwright/test";

import { requireIsolatedE2EDatabaseUrl } from "./e2e/environment";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const target = new URL(baseURL);
const externalServer = process.env.E2E_EXTERNAL_SERVER === "1";
const e2eDatabaseUrl = externalServer ? null : requireIsolatedE2EDatabaseUrl();
const webServer = externalServer
  ? undefined
  : {
      command:
        process.env.E2E_WEB_SERVER_COMMAND ??
        `npm run dev:e2e -- --hostname ${target.hostname} --port ${target.port || "3000"}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      // Keep DATABASE_URL pointing at the normal app database here.
      // scripts/start-e2e-server.ts validates isolation first, then replaces
      // DATABASE_URL only for the Prisma/Next child processes.
      env: {
        E2E_DATABASE_URL: e2eDatabaseUrl!,
      },
    };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [["line"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
  },
  projects: [
    {
      name: "desktop-1440",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "mobile-390",
      testIgnore: /critical-flow\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer,
});
