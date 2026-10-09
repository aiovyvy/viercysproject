import { test, expect, devices } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { propertyToday, addDays } from "../src/lib/policy";

test("desktop shows links without a stray Menu button; mid-width uses the menu", async ({
  browser,
}) => {
  const wide = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await wide.goto("/santorini");
  await expect(
    wide.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(
    wide.getByRole("button", { name: "Open navigation" }),
  ).toBeHidden();
  await wide.close();
  const mid = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await mid.goto("/santorini");
  await expect(
    mid.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await mid.close();
});

test("mobile menu closes with Escape or an outside tap and links to real pages", async ({
  browser,
}) => {
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  await page.goto("/santorini");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  await expect(
    page.getByRole("button", { name: "Close navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  // Tap below the open menu panel.
  const panel = await page
    .getByRole("navigation", { name: "Main navigation" })
    .boundingBox();
  await page.mouse.click(20, panel!.y + panel!.height + 40);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Destinations" })
    .click();
  await expect(page).toHaveURL("/destinations");
  // The sticky booking button sits inside a labelled landmark.
  await expect(
    page.getByRole("navigation", { name: "Quick booking" }).getByRole("link"),
  ).toHaveText("Book a stay");
  await context.close();
});

test("homepage calls to action use one consistent vocabulary", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".closing-cta")).toHaveText("Book a stay");
  await expect(page.locator(".closing-cta")).toHaveAttribute("href", "/book");
  await expect(
    page.getByRole("link", { name: /See rooms and prices/ }),
  ).toBeVisible();
  await expect(page.getByText("Begin your escape")).toHaveCount(0);
  await expect(page.getByText("Check availability")).toHaveCount(0);
  const hint = await page.locator(".gallery-hint").boundingBox();
  expect(hint!.height).toBeGreaterThanOrEqual(44);
});

test("the booking link in the confirmation email works more than once", async ({
  browser,
  request,
}) => {
  const arrival = addDays(propertyToday(), 210);
  const created = await request.post("/api/bookings", {
    data: {
      arrival,
      departure: addDays(arrival, 2),
      adults: 2,
      children: 0,
      rooms: 1,
      roomIds: ["S-304"],
      extras: [],
      guest: { name: "Email Link", email: "emaillink@example.test" },
      consent: true,
      idempotencyKey: randomUUID(),
    },
  });
  const { booking } = await created.json();
  const html = await (
    await request.get("/api/bookings/" + booking.reference + "/email-preview")
  ).text();
  const link = html.match(/href="([^"]*lookup\?token=[^"]+)"/)![1];
  expect(link).toMatch(/^http:\/\/localhost:3100\/lookup\?token=/);
  expect(html).not.toMatch(/demo-paid|works once/);
  for (let attempt = 0; attempt < 2; attempt++) {
    const device = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await device.newPage();
    await page.goto(new URL(link).pathname + new URL(link).search);
    await page.getByRole("button", { name: "Open my booking" }).click();
    await expect(page).toHaveURL("/my-stay");
    await expect(
      page.getByRole("heading", { name: booking.reference }),
    ).toBeVisible();
    await device.close();
  }
});
