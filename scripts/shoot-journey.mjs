// Walks the classmate journey on a phone against an isolated QA server and
// screenshots every step. Never point this at your real demo database.
// Usage: BASE_URL=http://localhost:3200 QA_PASSWORD=... node scripts/shoot-journey.mjs <outDir> <prefix>
import { chromium, devices } from "@playwright/test";
const [outDir, prefix] = process.argv.slice(2);
const base = process.env.BASE_URL || "http://localhost:3200";
const password = process.env.QA_PASSWORD;
if (!password) throw new Error("Set QA_PASSWORD (the QA server's test-only password).");
const browser = await chromium.launch();
const shot = async (page, name, full = false) =>
  page.screenshot({ path: `${outDir}/${prefix}-${name}.jpg`, type: "jpeg", quality: 60, fullPage: full });

const staff = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 900 } });
await staff.request.post("/api/admin/login", { data: { username: "manager", password } });
const created = await staff.request.post("/api/admin/invites", { data: { count: 1, label: "QA journey" } });
const [invite] = (await created.json()).created;

const phone = await browser.newContext({ ...devices["iPhone 13"], baseURL: base });
const page = await phone.newPage();
await page.goto(new URL(invite.url).pathname);
await page.waitForLoadState("networkidle");
await shot(page, "01-invite", true);
await page.getByRole("button", { name: "Claim your stay" }).click();
await page.waitForURL("**/book");
await page.waitForTimeout(600);
await shot(page, "02-guide");
await page.getByRole("button", { name: "Skip guide" }).click();
await shot(page, "03-dates", true);
await page.getByRole("button", { name: "See available rooms" }).click();
await page.waitForURL("**/book/rooms**");
await page.getByText("Fully covered by your voucher").first().waitFor();
await shot(page, "04-rooms", true);
await page.getByRole("button", { name: "Select Essential Room" }).click();
await page.waitForURL("**/book/details**");
await page.getByRole("region", { name: "Price breakdown" }).waitFor();
await shot(page, "05-review", true);
await page.getByLabel("Full name").fill("Quinn Classmate");
await page.getByLabel("Email address").fill("quinn@example.test");
await page.getByRole("checkbox", { name: /simulated booking/ }).check();
await page.getByRole("button", { name: /Confirm/ }).click();
await page.waitForURL(/\/booking\/VRC-/);
await page.waitForLoadState("networkidle");
await shot(page, "06-confirmation", true);
const reference = (await page.locator(".stay-ref").innerText()).trim();
await page.getByRole("button", { name: "Extend stay" }).click();
await page.waitForTimeout(500);
await shot(page, "07-extend");
for (const [name, path] of [
  ["08-my-stay", "/my-stay"],
  ["09-itinerary", `/itinerary/${reference}`],
  ["10-receipt", `/booking/${reference}/receipt`],
  ["11-email", `/booking/${reference}/email-preview`],
  ["12-lookup", "/lookup"],
  ["13-concierge", "/concierge"],
]) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await shot(page, name, true);
}
await page.goto(new URL(invite.url).pathname);
await page.waitForLoadState("networkidle");
await shot(page, "14-invite-used");

const admin = await staff.newPage();
await admin.goto("/admin");
await admin.waitForLoadState("networkidle");
await shot(admin, "15-staff-dashboard");
const login = await (await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 900 } })).newPage();
await login.goto("/admin");
await login.waitForLoadState("networkidle");
await shot(login, "16-staff-login");
console.log("journey captured for", reference);
await browser.close();
