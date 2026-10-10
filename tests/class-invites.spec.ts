import { test, expect, devices, type Browser } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { propertyToday, addDays } from "../src/lib/policy";
async function host(browser: Browser) {
  const staff = await browser.newContext();
  expect(
    (
      await staff.request.post("/api/admin/login", {
        data: { username: "manager", password: "Test-only-password-2026!" },
      })
    ).ok(),
  ).toBe(true);
  return staff;
}
const settings = (changes = {}) => ({
  name: "HCI Shared Browser Test",
  limit: 30,
  expires: new Date(Date.now() + 86400000).toISOString(),
  active: true,
  roster: "",
  ...changes,
});
test("manager creates one shared link; two phone guests independently book without email and staff sees both", async ({
  browser,
}) => {
  const staff = await host(browser);
  const admin = await staff.newPage();
  await admin.goto("/admin");
  await admin.getByRole("button", { name: "Invitations", exact: true }).click();
  const manager = admin.getByRole("region", {
    name: "Shared Class Invitations",
  });
  await manager.getByLabel("Campaign name").fill("HCI Class Browser Journey");
  await manager
    .getByLabel("Expiration (your local time)")
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  await manager
    .getByRole("button", { name: "Create shared invitation", exact: true })
    .click();
  const link = manager.getByLabel("New shared invitation URL");
  await expect(link).toBeVisible();
  const shared = new URL(await link.inputValue()).pathname;
  await expect(
    manager.getByRole("button", { name: "Copy Shared Link" }),
  ).toBeVisible();
  const references: string[] = [];
  for (let i = 0; i < 2; i++) {
    const phone = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await phone.newPage();
    await page.addInitScript(() =>
      localStorage.setItem("viercys-booking-guide-v1", "done"),
    );
    await page.goto(shared);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Your Santorini Escape Awaits" }),
    ).toBeVisible();
    await expect(
      page.getByText("No real accommodation, travel or payment is provided.", {
        exact: false,
      }),
    ).toBeVisible();
    expect((await phone.request.get("/api/admin/class-invites")).status()).toBe(
      401,
    );
    if (i === 0)
      await page.screenshot({
        path: "test-results/class-invitation-mobile.png",
        fullPage: true,
      });
    await page
      .getByLabel("Full name", { exact: true })
      .fill(`Shared Student ${i + 1}`);
    await page
      .getByLabel("Student identifier", { exact: true })
      .fill(`BROWSER-STUDENT-${i + 1}`);
    await page
      .getByRole("button", { name: "Claim Your Stay", exact: true })
      .click();
    await expect(page).toHaveURL("/book");
    await expect(
      page.getByRole("button", { name: "4 nights", exact: true }),
    ).toHaveCount(0);
    await page
      .getByLabel("Check-in", { exact: true })
      .fill(addDays(propertyToday(), 370 + i * 5));
    await page.getByRole("button", { name: "See available rooms" }).click();
    await page.getByRole("button", { name: "Select Essential Room" }).click();
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
      `Shared Student ${i + 1}`,
    );
    await expect(
      page.getByLabel("Email address (optional)"),
    ).not.toHaveAttribute("required", "");
    await page.getByRole("checkbox", { name: /simulated booking/ }).check();
    await page.getByRole("button", { name: "Confirm reservation" }).click();
    await expect(
      page.getByRole("heading", { name: "Your Stay Is Confirmed" }),
    ).toBeVisible();
    const reference = (await page.locator(".stay-ref").innerText()).trim();
    references.push(reference);
    const confirmation = await phone.request.get(
      `/api/bookings/${reference}/confirmation.pdf`,
    );
    expect(confirmation.status()).toBe(200);
    expect(confirmation.headers()["content-type"]).toBe("application/pdf");
    await expect(
      page.getByRole("link", { name: "Download PDF Confirmation" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Share Confirmation", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".confirmation-total")).toContainText("₱0.00");
    await expect(
      page.getByText("No email address was provided.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View the email", exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.reload();
    await expect(page.locator(".stay-ref")).toContainText(reference);
    await phone.close();
  }
  expect(references[0]).not.toBe(references[1]);
  await admin.reload();
  await admin.getByRole("button", { name: "Invitations", exact: true }).click();
  await expect(manager).toContainText("2/30 claimed");
  for (const reference of references)
    await expect(manager.getByRole("link", { name: reference })).toBeVisible();
  await expect(manager.getByLabel("New shared invitation URL")).toHaveCount(0);
  await manager
    .getByRole("button", { name: "Pause campaign", exact: true })
    .click();
  const guest = await browser.newContext();
  const landing = await guest.newPage();
  await landing.goto(shared);
  await expect(
    landing.getByRole("heading", { name: "A moment of pause" }),
  ).toBeVisible();
  await guest.close();
  await staff.close();
});
test("roster claim codes stay private; campaign and duplicate races preserve one place", async ({
  browser,
}) => {
  const staff = await host(browser);
  const response = await staff.request.post("/api/admin/class-invites", {
    data: settings({
      name: "Roster API Test",
      limit: 1,
      roster: "ROSTER-ONE\nROSTER-TWO",
    }),
  });
  expect(response.ok()).toBe(true);
  const created = await response.json();
  const token = new URL(created.url).pathname.split("/").pop();
  const a = await browser.newContext(),
    b = await browser.newContext();
  const registration = {
    token,
    name: "Roster Guest",
    identifier: "ROSTER-ONE",
    email: "",
  };
  expect(
    (
      await a.request.post("/api/invite/class/register", { data: registration })
    ).status(),
  ).toBe(400);
  for (const context of [a, b])
    expect(
      (
        await context.request.post("/api/invite/class/register", {
          data: { ...registration, credential: created.credentials[0].code },
        })
      ).ok(),
    ).toBe(true);
  const publicPage = await a.newPage();
  await publicPage.goto(new URL(created.url).pathname);
  expect(await publicPage.content()).not.toContain(created.credentials[0].code);
  expect(await publicPage.content()).not.toContain("ROSTER-TWO");
  const arrival = addDays(propertyToday(), 390);
  const body = {
    arrival,
    departure: addDays(arrival, 3),
    adults: 2,
    children: 0,
    rooms: 1,
    roomIds: ["S-101"],
    guest: { name: "Roster Guest", email: "" },
    consent: true,
    useVoucher: true,
  };
  const results = await Promise.all([
    a.request.post("/api/bookings", {
      data: { ...body, idempotencyKey: randomUUID() },
    }),
    b.request.post("/api/bookings", {
      data: { ...body, roomIds: ["S-102"], idempotencyKey: randomUUID() },
    }),
  ]);
  expect(results.filter((result) => result.ok())).toHaveLength(1);
  const saved = await (
    await staff.request.get("/api/admin/class-invites")
  ).json();
  expect(
    saved.campaigns.find((item: { id: string }) => item.id === created.id)
      .redemptions,
  ).toBe(1);
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", {
      name: "All invitations have been claimed",
    }),
  ).toBeVisible();
  await a.close();
  await b.close();
  await staff.close();
});
test("staff-only controls reject guests and roster submissions do not expose booking details", async ({
  browser,
}) => {
  const guest = await browser.newContext();
  for (const method of ["get", "post"] as const)
    expect(
      (
        await guest.request[method]("/api/admin/class-invites", {
          data: settings(),
        })
      ).status(),
    ).toBe(401);
  const staff = await host(browser);
  const created = await (
    await staff.request.post("/api/admin/class-invites", {
      data: settings({ active: false }),
    })
  ).json();
  const token = new URL(created.url).pathname.split("/").pop();
  const failed = await guest.request.post("/api/invite/class/register", {
    data: { token, name: "Guest Student", identifier: "NO-CLAIM" },
  });
  expect(failed.status()).toBe(400);
  expect(await failed.text()).not.toContain("VRC-");
  await guest.close();
  await staff.close();
});
