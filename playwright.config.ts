import { defineConfig } from "@playwright/test";
import { randomUUID } from "node:crypto";
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      RESEND_API_KEY: "",
      RESEND_FROM: "",
      OPENAI_API_KEY: "",
      VIERCYS_DB_PATH: "data/e2e-" + randomUUID() + ".sqlite",
      VIERCYS_DEMO_MODE: "true",
      VIERCYS_ADMIN_PASSWORD: "Test-only-password-2026!",
      RESEND_WEBHOOK_SECRET:
        "whsec_" +
        Buffer.from("viercys-webhook-test-only-secret!").toString("base64"),
      APP_URL: "http://localhost:3100",
      // Test-only: unsendable access emails are written here, never served.
      VIERCYS_DEV_OUTBOX: "test-results/dev-outbox.jsonl",
    },
  },
});
