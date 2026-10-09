import { test, expect } from "@playwright/test";
import { propertyToday, addDays } from "../src/lib/policy";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("viercys-booking-guide-v1", "done"),
  );
});

test("hero copy is visible and the hero date search opens room choice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // Regression: the scroll fade must not lock the headline invisible.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          getComputedStyle(document.querySelector("[data-hero-copy]")!)
            .opacity,
      ),
    )
    .toBe("1");
  const arrival = addDays(propertyToday(), 21);
  const hero = page.getByRole("form", { name: "Find a room for your dates" }).first();
  await hero.getByLabel("Check-in").fill(arrival);
  await hero.getByLabel("Check-out").fill(addDays(arrival, 4));
  await hero.getByRole("button", { name: "See rooms and prices" }).click();
  await expect(page).toHaveURL(new RegExp(`/book/rooms\\?arrival=${arrival}`));
  await expect(
    page.getByRole("heading", { name: "Choose your room." }),
  ).toBeVisible();
});

test("homepage tells the whole story and ends with a booking invitation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const name of [
    "Three steps to the Aegean.",
    "Some places are visited. Others are felt.",
    "Find your kind of quiet.",
    "Santorini, where the sea fills a volcano.",
    "The island, at your pace.",
    "Make room for something beautiful.",
  ])
    await expect(page.getByRole("heading", { name, level: 2 })).toBeAttached();
  // Future destinations are never presented as bookable.
  await expect(
    page.locator("#destinations li").filter({ hasText: /Coming\s+soon/ }),
  ).toHaveCount(3);
  const closing = page.locator("#closing");
  await closing.scrollIntoViewIfNeeded();
  await expect(
    closing.getByRole("link", { name: "Explore rooms & suites" }),
  ).toBeVisible();
  await expect(closing).toContainText("fictional hotel");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 700 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("reduced motion keeps the homepage fully readable and static", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const finale = await page
    .locator("#closing")
    .evaluate((el) => el.getBoundingClientRect().height);
  // No tall scroll runway for the finale when motion is reduced.
  expect(finale).toBeLessThan(1400);
  await page.getByRole("tab", { name: "Grand Sanctuary", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("€520.00");
  await context.close();
});
