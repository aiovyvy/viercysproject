import { test, expect, devices } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { propertyToday, addDays, formatDate } from "../src/lib/policy";
const query = (search: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(search).map(([key, value]) => [key, String(value)]),
  ).toString();
test.use({ ...devices["iPhone 13"] });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("viercys-booking-guide-v1", "done"),
  );
});

test("prices say taxes are included everywhere; no stale 13% tax copy", async ({
  page,
}) => {
  for (const path of ["/santorini", "/rooms/signature", "/compare", "/faq"]) {
    await page.goto(path);
    const text = await page.locator("main").innerText();
    expect(text, path).not.toMatch(/13%|before tax|plus the displayed tax/i);
  }
  await page.goto("/santorini");
  await expect(
    page.getByText("€180.00 per night, taxes included"),
  ).toBeVisible();
});

test("checkout shows the real cancellation date, and warns on short notice", async ({
  page,
}) => {
  const arrival = addDays(propertyToday(), 30);
  await page.goto(
    "/book/details?" +
      query({
        arrival,
        departure: addDays(arrival, 3),
        adults: 2,
        children: 0,
        rooms: 1,
      }) +
      "&roomIds=S-107",
  );
  await expect(
    page.getByText(
      "Free online cancellation until " + formatDate(addDays(arrival, -2)),
    ),
  ).toBeVisible();

  const soon = addDays(propertyToday(), 1);
  await page.goto(
    "/book/details?" +
      query({
        arrival: soon,
        departure: addDays(soon, 2),
        adults: 2,
        children: 0,
        rooms: 1,
      }) +
      "&roomIds=S-205",
  );
  const warning = page.locator(".book-short-notice");
  await expect(warning).toContainText("online cancellation is not available");
  await page.getByLabel("Full name").fill("Short Notice");
  await page.getByLabel("Email address").fill("short@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  await page.getByRole("button", { name: /Confirm demo reservation/ }).click();
  await expect(
    page.getByRole("heading", { name: "You're booked." }),
  ).toBeVisible();
  await page.getByText("Cancel reservation", { exact: true }).click();
  await expect(
    page.getByText(/To cancel now, ask the front desk/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm cancellation" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Contact" }).first().click();
  await expect(page).toHaveURL("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact.");
});

test("server cancellation refusal names the date and points to the front desk", async ({
  request,
}) => {
  const soon = addDays(propertyToday(), 1);
  const created = await request.post("/api/bookings", {
    data: {
      arrival: soon,
      departure: addDays(soon, 2),
      adults: 1,
      children: 0,
      rooms: 1,
      roomIds: ["S-206"],
      extras: [],
      guest: { name: "Server Cutoff", email: "cutoff@example.test" },
      consent: true,
      idempotencyKey: randomUUID(),
    },
  });
  const createdBody = await created.json();
  expect(created.status(), JSON.stringify(createdBody)).toBe(200);
  const { booking } = createdBody;
  const refused = await request.post(
    "/api/bookings/" + booking.reference + "/cancel",
    { data: { confirm: true } },
  );
  expect(refused.status()).toBe(400);
  const { error } = await refused.json();
  expect(error).toContain(formatDate(addDays(soon, -2)));
  expect(error).toContain("front desk");
});

test("concierge answers the questions students ask, with useful links", async ({
  page,
}) => {
  await page.goto("/concierge");
  await page.getByRole("button", { name: "How do I use my voucher?" }).click();
  const answer = page.locator(".concierge-answer");
  await expect(answer).toContainText("3 nights in an Essential Room");
  await expect(answer.getByRole("link", { name: "FAQ" })).toBeVisible();
  await page
    .getByRole("button", { name: "How do I contact the hotel?" })
    .click();
  await expect(answer).toContainText("presenter acts as the front desk");
  await answer.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL("/contact");
  await page.goto("/faq");
  await page.getByText("What does the voucher cover?").click();
  await expect(
    page.getByText(/Up to 3 nights in an Essential Room/),
  ).toBeVisible();
});
