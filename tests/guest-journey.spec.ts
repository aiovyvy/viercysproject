import {
  test,
  expect,
  devices,
  type Browser,
  type Page,
} from "@playwright/test";
import { propertyToday, addDays } from "../src/lib/policy";

// Milestone 4: the classmate journey end to end on phones, plus the
// conditions a live classroom demo creates: slow networks, double taps and
// two people reaching for the same room at once.

const query = (search: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(search).map(([key, value]) => [key, String(value)]),
  ).toString();

async function invite(browser: Browser) {
  const staff = await browser.newContext();
  await staff.request.post("/api/admin/login", {
    data: { username: "manager", password: "Test-only-password-2026!" },
  });
  const response = await staff.request.post("/api/admin/invites", {
    data: { count: 1, label: "M4 journey" },
  });
  const [created] = (await response.json()).created as { url: string }[];
  await staff.close();
  return new URL(created.url).pathname;
}

async function phone(browser: Browser, skipGuide = true) {
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  if (skipGuide)
    await context.addInitScript(() =>
      window.localStorage.setItem("viercys-booking-guide-v1", "done"),
    );
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

const noSideways = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test("classmate on a phone: redeem, book, reopen elsewhere, extend, cancel", async ({
  browser,
}) => {
  const link = await invite(browser);
  const arrival = addDays(propertyToday(), 70);
  const { context, page, errors } = await phone(browser, false);

  // 1. Invitation, with the honest disclosure.
  await page.goto(link);
  await expect(page.getByText("not a real travel prize")).toBeVisible();
  await page.getByRole("button", { name: "Claim your stay" }).click();
  await expect(page).toHaveURL("/book");

  // 2. The optional guide can be skipped.
  await page
    .getByRole("region", { name: "Booking guide" })
    .getByRole("button", { name: "Skip guide" })
    .click();

  // 3. Dates and live availability.
  await page.getByLabel("Check-in", { exact: true }).fill(arrival);
  await page.getByLabel("Check-out", { exact: true }).fill(addDays(arrival, 3));
  await page.getByRole("button", { name: "See available rooms" }).click();
  await expect(page.getByText("Fully covered by your voucher")).toBeVisible();
  expect(await noSideways(page)).toBe(true);
  await page.getByRole("button", { name: "Select Essential Room" }).click();

  // 4. Review: the voucher covers the stay and payment is clearly simulated.
  await expect(page.locator(".book-price-total")).toContainText("€0.00");
  await expect(
    page.getByText("no accommodation or payment is provided", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Full name").fill("Jordan Classmate");
  await page.getByLabel("Email address").fill("jordan@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  await page.getByRole("button", { name: /Confirm reservation/ }).click();
  await expect(
    page.getByRole("heading", { name: "You're booked." }),
  ).toBeVisible();
  const reference = (await page.locator(".stay-ref").innerText()).trim();
  expect(await noSideways(page)).toBe(true);
  await context.close();

  // 5. Reopen the booking on a different phone with reference + email.
  const other = await phone(browser);
  await other.page.goto("/lookup");
  await other.page.getByLabel("Booking reference").fill(reference);
  await other.page
    .getByLabel("Email used for the booking")
    .fill("jordan@example.test");
  await other.page.getByRole("button", { name: "Find my booking" }).click();
  await expect(other.page).toHaveURL("/booking/" + reference);

  // 6. Extend (the panel suggests two nights; one more makes three):
  // previewed first, then confirmed.
  await other.page.getByRole("button", { name: "Extend stay" }).click();
  await other.page.getByRole("button", { name: "Add one night" }).click();
  await other.page
    .getByRole("button", { name: "Check price and availability" })
    .click();
  await expect(
    other.page.getByRole("heading", { name: "Review the change" }),
  ).toBeVisible();
  await other.page.getByRole("button", { name: "Confirm change" }).click();
  await expect(
    other.page.getByText("Your stay has been updated"),
  ).toBeVisible();
  await expect(other.page.locator(".book-stay dd").first()).toContainText(
    "6 nights",
  );

  // 7. Cancel, with a clear way forward afterwards.
  await other.page.getByText("Cancel reservation", { exact: true }).click();
  await other.page.getByRole("checkbox", { name: /I want to cancel/ }).check();
  await other.page
    .getByRole("button", { name: "Confirm cancellation" })
    .click();
  await expect(
    other.page.getByRole("heading", { name: "Reservation cancelled." }),
  ).toBeVisible();
  await expect(
    other.page.getByRole("link", { name: "Book a new stay" }),
  ).toBeVisible();
  expect(await noSideways(other.page)).toBe(true);
  expect([...errors, ...other.errors]).toEqual([]);
  await other.context.close();
});

test("two phones reach for the same room: one books, the other is guided on", async ({
  browser,
}) => {
  const arrival = addDays(propertyToday(), 170);
  const search = {
    arrival,
    departure: addDays(arrival, 2),
    adults: 2,
    children: 0,
    rooms: 1,
  };
  const phones = await Promise.all(
    ["Avery", "Blake"].map(async (name) => {
      const guest = await phone(browser);
      await guest.page.goto(
        "/book/details?" + query(search) + "&roomIds=S-105",
      );
      await guest.page.getByLabel("Full name").fill(name + " Racer");
      await guest.page
        .getByLabel("Email address")
        .fill(name.toLowerCase() + "@example.test");
      await guest.page
        .getByRole("checkbox", { name: /simulated booking/ })
        .check();
      return guest;
    }),
  );
  await Promise.all(
    phones.map(({ page }) =>
      page.getByRole("button", { name: /Confirm reservation/ }).click(),
    ),
  );
  await expect
    .poll(
      () =>
        phones.filter(({ page }) => page.url().includes("/booking/")).length,
    )
    .toBe(1);
  const loser = phones.find(({ page }) => !page.url().includes("/booking/"))!;
  const alert = loser.page.locator(".book-error[role=alert]");
  await expect(alert).toContainText("just reserved");
  await expect(alert).toContainText("Nothing has been booked or charged.");
  await alert.getByRole("link", { name: "Choose another room" }).click();
  await expect(loser.page).toHaveURL(/\/book\/rooms\?arrival=/);
  await expect(
    loser.page.getByRole("button", { name: "Select Essential Room" }),
  ).toBeVisible();
  for (const { context } of phones) await context.close();
});

test("slow phone network: content first, clear loading, no double booking", async ({
  browser,
}) => {
  const { context, page } = await phone(browser);
  // Roughly a weak 3G connection.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (750 * 1024) / 8,
    uploadThroughput: (250 * 1024) / 8,
  });
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Quick booking" }).getByRole("link"),
  ).toHaveAttribute("href", "/book");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });

  // A slow availability answer shows a status instead of an empty page.
  await page.route("**/api/availability**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });
  const arrival = addDays(propertyToday(), 210);
  const search = {
    arrival,
    departure: addDays(arrival, 3),
    adults: 2,
    children: 0,
    rooms: 1,
  };
  await page.goto("/book/rooms?" + query(search));
  await expect(page.getByRole("status")).toContainText("Preparing your stay");
  await expect(
    page.getByRole("button", { name: "Select Essential Room" }),
  ).toBeVisible({ timeout: 15000 });

  // A slow confirmation cannot be submitted twice.
  let posts = 0;
  await page.route("**/api/bookings", async (route) => {
    if (route.request().method() === "POST") {
      posts++;
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    await route.continue();
  });
  await page.goto("/book/details?" + query(search) + "&roomIds=S-106");
  await page.getByLabel("Full name").fill("Slow Network");
  await page.getByLabel("Email address").fill("slow@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  const confirm = page.getByRole("button", { name: /Confirm reservation/ });
  await confirm.click();
  await confirm.click({ force: true, timeout: 2000 }).catch(() => {});
  await expect(
    page.getByRole("heading", { name: "You're booked." }),
  ).toBeVisible({ timeout: 15000 });
  expect(posts).toBe(1);
  await context.close();
});
