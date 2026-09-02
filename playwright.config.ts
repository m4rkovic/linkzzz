import "dotenv/config";

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const target = new URL(baseURL);
const webServer = process.env.E2E_EXTERNAL_SERVER === "1"
  ? undefined
  : {
      command:
        process.env.E2E_WEB_SERVER_COMMAND ??
        `npm run dev:e2e -- --hostname ${target.hostname} --port ${target.port || "3000"}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      // E2E browsers are acting behind the local Playwright test proxy.
      // Give each browser project its own forwarded client IP so repeated
      // authentication flows exercise rate limiting without sharing one
      // synthetic "unknown" bucket. Production trust remains opt-in.
      env: {
        ...process.env,
        LINKZZZ_TRUST_PROXY_HEADERS: "1",
      },
    };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["line"], ["html", { open: "never" }]],
  timeout: 120_000,
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
        extraHTTPHeaders: {
          "x-forwarded-for": "198.18.0.10",
        },
      },
    },
    {
      name: "mobile-390",
      testIgnore: /critical-flow\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        extraHTTPHeaders: {
          "x-forwarded-for": "198.18.0.20",
        },
      },
    },
  ],
  webServer,
});
