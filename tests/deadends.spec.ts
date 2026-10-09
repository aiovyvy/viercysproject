import { test, expect, devices, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { propertyToday, addDays } from "../src/lib/policy";
const query = (search: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(search).map(([key, value]) => [key, String(value)]),
  ).toString();
const stay = (offset: number, length = 3) => ({
  arrival: addDays(propertyToday(), offset),
  departure: addDays(propertyToday(), offset + length),
  adults: 2,
  children: 0,
  rooms: 1,
});
test.use({ ...devices["iPhone 13"] });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("viercys-booking-guide-v1", "done"),
  );
});
async function bookInUi(page: Page, search: object, room: string) {
  await page.goto(
    "/book/details?" + query(search as never) + "&roomIds=" + room,
  );
  await page.getByLabel("Full name").fill("Dead End Tester");
  await page.getByLabel("Email address").fill("deadend@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  await page.getByRole("button", { name: /Confirm demo reservation/ }).click();
  await expect(
    page.getByRole("heading", { name: "You're booked." }),
  ).toBeVisible();
  return (await page.locator(".stay-ref").innerText()).trim();
}
async function apiBook(page: Page, search: object, room: string) {
  const response = await page.request.post("/api/bookings", {
    data: {
      ...search,
      roomIds: [room],
      extras: [],
      guest: { name: "Blocker", email: "blocker@example.test" },
      consent: true,
      idempotencyKey: randomUUID(),
    },
  });
  expect(response.ok()).toBeTruthy();
}

test("extending into a booked night offers fewer nights or another room", async ({
  page,
}) => {
  const search = stay(160);
  await bookInUi(page, search, "S-104");
  // Someone else has room 104 from one night after our checkout.
  await apiBook(page, stay(164, 2), "S-104");
  await page.getByRole("button", { name: "Extend stay" }).click();
  await page.getByRole("button", { name: "Add one night" }).click(); // 3 nights
  await page
    .getByRole("button", { name: "Check price and availability" })
    .click();
  const conflict = page.locator(".stay-conflict");
  await expect(conflict).toContainText("Your current booking is unchanged");
  await expect(conflict).not.toContainText("search again");
  await conflict
    .getByRole("button", { name: "Extend by 1 night instead" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review the change" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm change" }).click();
  await expect(page.getByText("Your stay has been updated")).toBeVisible();
  await expect(page.locator(".book-stay dd").first()).toContainText("4 nights");

  // One more night (the picker keeps 1): room 104 is taken, a same-type room is offered.
  await page.getByRole("button", { name: "Extend stay" }).click();
  await page
    .getByRole("button", { name: "Check price and availability" })
    .click();
  const move = conflict.getByRole("button", {
    name: /^Move to room \d+ for the whole stay$/,
  });
  await expect(move).toBeVisible();
  await move.click();
  await expect(
    page.getByRole("heading", { name: "Review the change" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm change" }).click();
  await expect(page.getByText("Your stay has been updated")).toBeVisible();
  await expect(page.locator(".book-stay dd").first()).toContainText("5 nights");
  await expect(page.locator(".book-stay")).not.toContainText("no. 104");
});

test("a cancelled booking offers a new booking, not trip planning", async ({
  page,
}) => {
  await bookInUi(page, stay(170), "S-110");
  await page.getByText("Cancel reservation", { exact: true }).click();
  await page.getByRole("checkbox", { name: /I want to cancel/ }).check();
  await page.getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(
    page.getByRole("heading", { name: "Reservation cancelled." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Book a new stay" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plan your visit" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "Extend stay" })).toHaveCount(
    0,
  );
});

test("pressing Back after confirming points to the booking instead of an error", async ({
  page,
}) => {
  const reference = await bookInUi(page, stay(175), "S-109");
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "You’ve already booked this stay." }),
  ).toBeVisible();
  await expect(page.getByText(/no longer available/)).toHaveCount(0);
  await page.getByRole("link", { name: "View your booking" }).click();
  await expect(page).toHaveURL("/booking/" + reference);
});

test("the review step without a room explains and links back", async ({
  page,
}) => {
  await page.goto("/book/details?" + query(stay(180)));
  await expect(
    page.getByRole("heading", { name: "Choose a room first." }),
  ).toBeVisible();
  await expect(
    page.getByText(/requested number of different rooms/),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Choose a room" }).click();
  await expect(page).toHaveURL(/\/book\/rooms\?/);
});

test("voucher holders are told when the free Essential rooms are sold out", async ({
  page,
  browser,
}) => {
  const search = stay(185);
  for (let n = 1; n <= 10; n++) await apiBook(page, search, "S-" + (100 + n));
  const staff = await browser.newContext();
  await staff.request.post("/api/admin/login", {
    data: { username: "manager", password: "Test-only-password-2026!" },
  });
  const [invite] = (
    await (
      await staff.request.post("/api/admin/invites", { data: { count: 1 } })
    ).json()
  ).created;
  await staff.close();
  await page.goto(new URL(invite.url).pathname);
  await page.getByRole("button", { name: "Claim your stay" }).click();
  await page.goto("/book/rooms?" + query(search));
  await expect(
    page.getByText(
      /Essential Rooms, which your voucher fully covers, are sold out/,
    ),
  ).toBeVisible();
  const essential = page.locator(".book-room").filter({
    has: page.getByRole("heading", { name: "Essential Room" }),
  });
  await expect(essential).toContainText("Sold out for these dates");
  await expect(essential).not.toContainText("Fully covered");
  await expect(
    page
      .locator(".book-room")
      .filter({ has: page.getByRole("heading", { name: "Signature Suite" }) }),
  ).toContainText("You pay €420.00");
});
