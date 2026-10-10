import { Webhook } from "svix";
import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { propertyToday, addDays } from "../src/lib/policy";
// Reads the test-only server outbox (VIERCYS_DEV_OUTBOX); never served over HTTP.
async function outboxLink(email: string) {
  let link: string | undefined;
  await expect
    .poll(() => {
      try {
        const lines = readFileSync("test-results/dev-outbox.jsonl", "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line) as { to: string; link: string });
        link = lines.filter((line) => line.to === email).pop()?.link;
        return !!link;
      } catch {
        return false;
      }
    })
    .toBe(true);
  return link!;
}
const skipGuide = () =>
  window.localStorage.setItem("viercys-booking-guide-v1", "done");
const query = (search: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(search).map(([key, value]) => [key, String(value)]),
  ).toString();
const stay = (offset = 30) => ({
  arrival: addDays(propertyToday(), offset),
  departure: addDays(propertyToday(), offset + 3),
  adults: 2,
  children: 0,
  rooms: 1,
});
test("romantic booking, post-booking itinerary, email preview and staff visibility", async ({
  page,
  browser,
}) => {
  const search = stay();
  await page.addInitScript(skipGuide);
  await page.goto("/book/rooms?" + query(search));
  await page.getByRole("button", { name: "Select Signature Suite" }).click();
  await page.getByText("Add optional experiences").click();
  await page.getByRole("button", { name: "Add one romantic dinner" }).click();
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "Add one breakfast" }).click();
  // 3 x 320 + 6 x 22 breakfast; dinner is a request, excluded from the total.
  await expect(page.locator(".book-price-total")).toContainText("€1,092.00");
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Alex Mediterranean");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("alex.workflow@example.test");
  await page.getByLabel(/Phone/).fill("+30 000 0000");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  await page.getByRole("button", { name: "Confirm reservation" }).click();
  await expect(page).toHaveURL(/booking\/VRC-/);
  await expect(
    page.getByRole("heading", { name: "You're booked." }),
  ).toBeVisible();
  await expect(
    page.getByText("Email delivery is not configured", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Simulated payment, no real charge"),
  ).toBeVisible();
  const reference = new URL(page.url()).pathname.split("/").pop()!;
  await page
    .getByRole("link", { name: "Plan your visit", exact: true })
    .click();
  await page.getByRole("button", { name: "Generate my journey" }).click();
  await expect(page.getByText(/Suggested island itinerary/)).toBeVisible();
  await page
    .getByLabel("Morning — suggestions")
    .first()
    .fill("Our own quiet breakfast and village walk.");
  await page.getByRole("button", { name: "Save itinerary edits" }).click();
  await expect(page.getByText("Itinerary saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Morning — suggestions").first()).toHaveValue(
    "Our own quiet breakfast and village walk.",
  );
  await page.goto("/booking/" + reference + "/email-preview");
  await page.route("**/images/**", (route) => route.abort());
  await expect(
    page.frameLocator("iframe").getByText(reference, { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/email-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.frameLocator("iframe").getByText("Reservation total", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/email-mobile.png",
    fullPage: true,
  });
  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await staff.goto("/admin");
  await staff.getByLabel("Staff username").fill("manager");
  await staff.getByLabel("Staff password").fill("Test-only-password-2026!");
  await staff.getByRole("button", { name: "Sign in to staff portal" }).click();
  await expect(
    staff.getByRole("heading", { name: "Staff dashboard." }),
  ).toBeVisible();
  await expect(
    staff.getByRole("link", { name: reference, exact: true }),
  ).toBeVisible();
  await staff.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(staff.locator("tbody tr")).toHaveCount(20);
  await staff.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(staff.getByText(/possible room-nights/)).toBeVisible();
  await staffContext.close();
  await page.goto("/booking/" + reference);
  await page.getByText("Cancel reservation", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "I want to cancel " + reference + "." })
    .check();
  await page
    .getByRole("button", { name: "Confirm cancellation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reservation cancelled." }),
  ).toBeVisible();
});
test("concurrent requests, duplicate retries and secure guest lookup", async ({
  request,
  browser,
}) => {
  const email = `concurrency-${randomUUID()}@example.test`;
  const search = stay(90);
  const base = {
    ...search,
    roomIds: ["S-110"],
    guest: { name: "Concurrency Guest", email: email },
    extras: [],
    consent: true,
    idempotencyKey: randomUUID(),
  };
  const clients = await Promise.all([
    request.post("/api/bookings", { data: base }),
    request.post("/api/bookings", {
      data: { ...base, idempotencyKey: randomUUID() },
    }),
  ]);
  expect(clients.filter((response) => response.ok())).toHaveLength(1);
  const good = clients.find((response) => response.ok())!;
  const booking = (await good.json()).booking;
  const retry = await request.post("/api/bookings", { data: base });
  if (good === clients[0])
    expect((await retry.json()).booking.reference).toBe(booking.reference);
  const stranger = await browser.newContext();
  const page = await stranger.newPage();
  expect((await stranger.request.get("/api/admin/dashboard")).status()).toBe(
    401,
  );
  expect(
    (await stranger.request.get("/api/bookings/" + booking.reference)).status(),
  ).toBe(403);
  // Asking for a link never reveals it, and the answer is identical for
  // known and unknown emails.
  const known = await (
    await stranger.request.post("/api/lookup", {
      data: { email: email },
    })
  ).json();
  const unknown = await (
    await stranger.request.post("/api/lookup", {
      data: { email: "nobody-booked-this@example.test" },
    })
  ).json();
  expect(known).toEqual(unknown);
  expect(JSON.stringify(known)).not.toMatch(/token|lookup\?/);
  await page.goto("/lookup");
  await page.getByText("Forgot your reference? Email me a link").click();
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a private link" }).click();
  await expect(page.getByRole("status")).toContainText("Email is not set up");
  await expect(page.locator("a[href*='token=']")).toHaveCount(0);
  // The link reaches only the (test) mailbox, then works once.
  const token = new URL(await outboxLink(email)).searchParams.get("token")!;
  await page.goto("/lookup?token=" + token);
  await page.getByRole("button", { name: "Open my booking" }).click();
  await expect(page).toHaveURL("/my-stay");
  await expect(
    page.getByRole("heading", { name: booking.reference, exact: true }),
  ).toBeVisible();
  expect(
    (await stranger.request.post("/api/verify", { data: { token } })).status(),
  ).toBe(400);
  await stranger.close();
});
test("server rejects hostile dates and cross-site actions; mobile checkout works", async ({
  page,
  request,
}) => {
  for (const dates of [
    { arrival: "222222-01-01", departure: "222222-01-04" },
    { arrival: "2027-02-30", departure: "2027-03-04" },
  ])
    expect(
      (
        await request.post("/api/availability", {
          data: { ...stay(), ...dates },
        })
      ).status(),
    ).toBe(400);
  expect(
    (
      await request.post("/api/bookings", {
        headers: { Origin: "https://malicious.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(skipGuide);
  const search = stay(120);
  // Old links redirect into the new flow.
  await page.goto("/availability?" + query(search));
  await expect(page).toHaveURL(/\/book\/rooms\?/);
  await page.getByRole("button", { name: "Select Essential Room" }).click();
  await expect(page.locator(".book-price-total")).toContainText("€540.00");
  await page.getByLabel("Full name", { exact: true }).fill("Mobile Guest");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("mobile@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  await page.getByRole("button", { name: "Confirm reservation" }).click();
  await expect(page).toHaveURL(/booking\/VRC-/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("room change is previewed before persistence and reflected in staff inventory", async ({
  page,
}) => {
  const search = stay(180);
  const response = await page.request.post("/api/bookings", {
    data: {
      ...search,
      roomIds: ["S-105"],
      extras: [],
      guest: { name: "Room Change Guest", email: "modify@example.test" },
      consent: true,
      idempotencyKey: randomUUID(),
    },
  });
  expect(response.ok()).toBeTruthy();
  const { booking } = await response.json();
  await page.goto("/booking/" + booking.reference);
  await page.getByText("Change guests or rooms", { exact: true }).click();
  await page.getByLabel(/Room 106 · Essential/).check();
  await page.getByLabel("Adults", { exact: true }).fill("3");
  await page
    .getByRole("button", { name: "Check price and availability" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review the change" }),
  ).toBeVisible();
  expect(
    (
      await (
        await page.request.get("/api/bookings/" + booking.reference)
      ).json()
    ).booking.rooms,
  ).toBe(1);
  await page.getByRole("button", { name: "Confirm change" }).click();
  await expect(page.getByText("Your stay has been updated")).toBeVisible();
  await expect(page.locator(".book-stay")).toContainText("3 adults");
  expect(
    (
      await (
        await page.request.get("/api/bookings/" + booking.reference)
      ).json()
    ).booking.rooms,
  ).toBe(2);
});
test("webhooks require a valid signature and accept replay safely", async ({
  request,
}) => {
  const body = JSON.stringify({
    type: "email.delivered",
    data: { email_id: "unknown-provider-id" },
  });
  expect(
    (
      await request.post("/api/email-webhook", {
        data: body,
        headers: { "Content-Type": "application/json" },
      })
    ).status(),
  ).toBe(400);
  const secret =
    "whsec_" +
    Buffer.from("viercys-webhook-test-only-secret!").toString("base64");
  const id = "msg_" + randomUUID();
  const now = new Date();
  const signature = new Webhook(secret).sign(id, now, body);
  const headers = {
    "Content-Type": "application/json",
    "svix-id": id,
    "svix-timestamp": String(Math.floor(now.getTime() / 1000)),
    "svix-signature": signature,
  };
  expect(
    (await request.post("/api/email-webhook", { data: body, headers })).ok(),
  ).toBeTruthy();
  expect(
    (await request.post("/api/email-webhook", { data: body, headers })).ok(),
  ).toBeTruthy();
});

test("verified profile and staff blocks, calendar, housekeeping and arrival operations persist", async ({
  page,
}) => {
  const search = stay(240);
  const reservation = await page.request.post("/api/bookings", {
    data: {
      ...search,
      roomIds: ["S-109"],
      extras: [],
      guest: {
        name: "Operations Guest",
        email: `operations-${randomUUID()}@example.test`,
      },
      consent: true,
      idempotencyKey: randomUUID(),
    },
  });
  expect(reservation.ok()).toBeTruthy();
  const { booking } = await reservation.json();
  await page.request.post("/api/lookup", { data: { email: booking.email } });
  const token = new URL(await outboxLink(booking.email)).searchParams.get(
    "token",
  );
  expect(
    (await page.request.post("/api/verify", { data: { token } })).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.post("/api/profile", {
        data: { name: "Updated Profile", phone: "+30 123" },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (await (await page.request.get("/api/profile")).json()).profile.name,
  ).toBe("Updated Profile");
  expect(
    (
      await page.request.post("/api/admin/login", {
        data: { username: "manager", password: "Test-only-password-2026!" },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.post("/api/admin/block", {
        data: { ...search, roomId: "S-109", reason: "Conflicting maintenance" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post("/api/admin/block", {
        data: { ...search, roomId: "S-110", reason: "Test maintenance" },
      })
    ).ok(),
  ).toBeTruthy();
  const available = await (
    await page.request.post("/api/availability", { data: search })
  ).json();
  expect(
    available.rooms.some((r: { id: string }) => r.id === "S-110"),
  ).toBeFalsy();
  let dashboard = await (await page.request.get("/api/admin/dashboard")).json();
  const block = dashboard.blocks.find(
    (b: { room_id: string }) => b.room_id === "S-110",
  );
  expect(
    (
      await page.request.post("/api/admin/remove-block", {
        data: { id: block.id },
      })
    ).ok(),
  ).toBeTruthy();
  for (const status of ["checked-in", "checked-out"]) {
    expect(
      (
        await page.request.post("/api/admin/reservation", {
          data: { reference: booking.reference, status },
        })
      ).ok(),
    ).toBeTruthy();
  }
  dashboard = await (await page.request.get("/api/admin/dashboard")).json();
  expect(
    dashboard.rooms.find((r: { id: string }) => r.id === "S-109").operational,
  ).toBe("cleaning");
  await page.goto("/admin");
  await page.getByRole("button", { name: "Calendar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "14-day reservation calendar" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guests", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Guest directory" }),
  ).toBeVisible();
});
