import { defineConfig } from "@playwright/test";
if (
  !process.env.TURSO_DATABASE_URL ||
  !process.env.TURSO_AUTH_TOKEN ||
  (process.env.VIERCYS_ADMIN_PASSWORD?.length || 0) < 16
)
  throw new Error(
    "Live Turso tests require database credentials and a private 16+ character manager password in .env.local.",
  );
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results/turso-live",
  testMatch: "turso.live.ts",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 20000 },
  use: {
    baseURL: "http://localhost:3200",
    browserName: "chromium",
    headless: true,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: {
    command: "npm run start -- --port 3200",
    url: "http://localhost:3200",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      VIERCYS_DEMO_MODE: "false",
      APP_URL: "http://localhost:3200",
      VIERCYS_DEV_OUTBOX: "",
      RESEND_API_KEY: "",
      RESEND_FROM: "",
      RESEND_TEST_RECIPIENT: "",
      OPENAI_API_KEY: "",
    },
  },
});
