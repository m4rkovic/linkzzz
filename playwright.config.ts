import "dotenv/config";

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const target = new URL(baseURL);
const webServer = process.env.E2E_EXTERNAL_SERVER === "1"
  ? undefined
  : {
      command:
        process.env.E2E_WEB_SERVER_COMMAND ??
        `npm run dev -- --hostname ${target.hostname} --port ${target.port || "3000"}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
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
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer,
});
