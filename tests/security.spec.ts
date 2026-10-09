import { test, expect, devices, type Browser } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { propertyToday, addDays } from "../src/lib/policy";
const PASSWORD = "Test-only-password-2026!";
const query = (search: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(search).map(([key, value]) => [key, String(value)]),
  ).toString();
async function staffInvites(browser: Browser, count = 1) {
  const staff = await browser.newContext();
  await staff.request.post("/api/admin/login", {
    data: { username: "manager", password: PASSWORD },
  });
  const created = (
    await (
      await staff.request.post("/api/admin/invites", { data: { count } })
    ).json()
  ).created as { url: string }[];
  await staff.close();
  return created.map((item) => new URL(item.url).pathname);
}

test("a booking can only be opened with its reference and matching email", async ({
  browser,
  request,
}) => {
  const arrival = addDays(propertyToday(), 140);
  const booked = await request.post("/api/bookings", {
    data: {
      arrival,
      departure: addDays(arrival, 3),
      adults: 2,
      children: 0,
      rooms: 1,
      roomIds: ["S-103"],
      extras: [],
      guest: { name: "Private Guest", email: "private@example.test" },
      consent: true,
      idempotencyKey: randomUUID(),
    },
  });
  const { booking } = await booked.json();
  const stranger = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await stranger.newPage();

  // Opening someone else's link explains how to get in instead of a dead end.
  await page.goto("/booking/" + booking.reference);
  await expect(page.getByText(/reference and the email/)).toBeVisible();
  await page.locator("main").getByRole("link", { name: "Find my booking" }).click();
  await expect(page.getByLabel("Booking reference")).toHaveValue(
    booking.reference,
  );

  // Wrong email: generic message, no details leaked.
  await page
    .getByLabel("Email used for the booking")
    .fill("guess@example.test");
  await page.getByRole("button", { name: "Find my booking" }).click();
  await expect(page.locator(".book-error")).toContainText(
    "couldn't find a booking with that reference and email",
  );
  expect(
    (await stranger.request.get("/api/bookings/" + booking.reference)).status(),
  ).toBe(403);

  // Correct pair: opens exactly that booking.
  await page
    .getByLabel("Email used for the booking")
    .fill("PRIVATE@example.test");
  await page.getByRole("button", { name: "Find my booking" }).click();
  await expect(page).toHaveURL("/booking/" + booking.reference);
  await expect(page.locator(".stay-ref")).toHaveText(booking.reference);
  await stranger.close();
});

test("throttling is per device: one device's failures do not lock out the class", async ({
  browser,
}) => {
  // One device mistyping the staff password is slowed down...
  const noisy = await browser.newContext();
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++)
    statuses.push(
      (
        await noisy.request.post("/api/admin/login", {
          data: { username: "manager", password: "wrong" },
        })
      ).status(),
    );
  expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
  expect(statuses[5]).toBe(429);
  await noisy.close();
  // ...and twelve more devices failing on the same campus IP still leave the
  // presenter able to sign in from their own device.
  for (let i = 0; i < 12; i++) {
    const other = await browser.newContext();
    await other.request.post("/api/admin/login", {
      data: { username: "manager", password: "wrong" + i },
    });
    await other.close();
  }
  const presenter = await browser.newContext();
  expect(
    (
      await presenter.request.post("/api/admin/login", {
        data: { username: "manager", password: PASSWORD },
      })
    ).status(),
  ).toBe(200);
  // Successful sign-ins never count toward any limit.
  for (let i = 0; i < 12; i++)
    expect(
      (
        await presenter.request.post("/api/admin/login", {
          data: { username: "manager", password: PASSWORD },
        })
      ).status(),
    ).toBe(200);
  await presenter.close();
});

test("a class of 70 students can all claim their invitations", async ({
  browser,
}) => {
  const links = await staffInvites(browser, 60);
  const extra = await staffInvites(browser, 10);
  for (const link of [...links, ...extra]) {
    const student = await browser.newContext();
    const token = link.split("/").pop();
    expect(
      (
        await student.request.post("/api/invite/claim", { data: { token } })
      ).status(),
    ).toBe(200);
    await student.close();
  }
  // Guessing tokens from one device is throttled.
  const guesser = await browser.newContext();
  const results: number[] = [];
  for (let i = 0; i < 21; i++)
    results.push(
      (
        await guesser.request.post("/api/invite/claim", {
          data: { token: "guess-" + i + "-aaaaaaaaaaaaaaaaaaaaaa" },
        })
      ).status(),
    );
  expect(results.slice(0, 20).every((status) => status === 400)).toBe(true);
  expect(results[20]).toBe(429);
  await guesser.close();
});

test("losing a voucher race re-prices at the standard rate and never charges silently", async ({
  browser,
}) => {
  const [link] = await staffInvites(browser);
  const arrival = addDays(propertyToday(), 150);
  const search = {
    arrival,
    departure: addDays(arrival, 3),
    adults: 2,
    children: 0,
    rooms: 1,
  };
  const phones = await Promise.all(
    ["S-101", "S-102"].map(async (room) => {
      const ctx = await browser.newContext({ ...devices["iPhone 13"] });
      await ctx.addInitScript(() =>
        window.localStorage.setItem("viercys-booking-guide-v1", "done"),
      );
      const page = await ctx.newPage();
      await page.goto(link);
      await page.getByRole("button", { name: "Claim your stay" }).click();
      await expect(page).toHaveURL("/book");
      await page.goto("/book/details?" + query(search) + "&roomIds=" + room);
      await expect(page.locator(".book-price-total")).toContainText("€0.00");
      await page.getByLabel("Full name").fill("Race " + room);
      await page.getByLabel("Email address").fill(room + "@example.test");
      await page.getByRole("checkbox", { name: /simulated booking/ }).check();
      return { ctx, page };
    }),
  );
  await Promise.all(
    phones.map(({ page }) =>
      page.getByRole("button", { name: /Confirm demo reservation/ }).click(),
    ),
  );
  await expect
    .poll(async () => {
      const won = await Promise.all(
        phones.map(({ page }) => page.url().includes("/booking/")),
      );
      return won.filter(Boolean).length;
    })
    .toBe(1);
  const loser = phones.find(
    ({ page }) => !page.url().includes("/booking/"),
  )!.page;
  await expect(
    loser.getByText("Your voucher couldn’t be applied."),
  ).toBeVisible();
  await expect(
    loser.getByText("Nothing has been booked or charged."),
  ).toBeVisible();
  await expect(loser.locator(".book-price-total")).toContainText("€540.00");
  await expect(loser.getByText("Demo voucher applied.")).toHaveCount(0);
  // The loser is not booked until they explicitly confirm the new price.
  expect(loser.url()).toContain("/book/details");
  await loser
    .getByRole("button", { name: "Confirm demo reservation · €540.00" })
    .click();
  await expect(
    loser.getByRole("heading", { name: "You're booked." }),
  ).toBeVisible();
  for (const { ctx } of phones) await ctx.close();
});
