import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/bdd",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:27014",
    trace: "on-first-retry",
    headless: true,
  },
  webServer: {
    command: "bun scripts/test-server.ts",
    url: "http://127.0.0.1:27014/api/live",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
