import { defineConfig } from "@playwright/test";

/**
 * Browser end-to-end tests against a running stack (web on :3000 forwarding to
 * the API, Mailpit receiving email). Uses the installed Google Chrome rather
 * than downloading browsers.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  // The journeys share Mailpit and per-address rate limits; run them one at a time.
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
});
