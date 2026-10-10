import { test, expect } from "@playwright/test";
const future = (offset: number) => {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const date = new Date(iso + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
// The booking guide auto-opens once per browser; most tests skip it.
const skipGuide = () =>
  window.localStorage.setItem("viercys-booking-guide-v1", "done");

test("homepage has one clear booking entry that works before scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Book a stay" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Where Earth",
  );
  await page.locator(".hero-book").click();
  await expect(page).toHaveURL("/book");
  await expect(
    page.getByRole("heading", { name: "Choose your dates." }),
  ).toBeVisible();
});

test("dates step: three-night default, quick lengths, counters keep dates", async ({
  page,
}) => {
  await page.addInitScript(skipGuide);
  await page.goto("/book");
  const arrival = page.getByLabel("Check-in", { exact: true });
  const departure = page.getByLabel("Check-out", { exact: true });
  await expect(page.getByRole("button", { name: "3 nights" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await arrival.fill(future(10));
  await expect(departure).toHaveValue(future(13));
  await page.getByRole("button", { name: "5 nights" }).click();
  await expect(departure).toHaveValue(future(15));
  await page.getByRole("button", { name: "Add one adult" }).click();
  await page.getByRole("button", { name: "Add one child" }).click();
  await expect(arrival).toHaveValue(future(10));
  await expect(page.getByRole("group", { name: "Adults" })).toContainText("3");
  await page.getByRole("button", { name: "Add one room" }).click();
  await page.getByRole("button", { name: "See available rooms" }).click();
  await expect(page).toHaveURL(
    /\/book\/rooms\?.*adults=3.*children=1.*rooms=2/,
  );
});

test("invalid dates and the 222222 year are rejected with a clear message", async ({
  page,
}) => {
  await page.addInitScript(skipGuide);
  await page.goto("/book");
  await page.getByLabel("Check-in", { exact: true }).fill(future(13));
  await page.getByLabel("Check-out", { exact: true }).fill(future(10));
  await page.getByRole("button", { name: "See available rooms" }).click();
  await expect(page.locator(".book-error, .notice")).toContainText(
    "Check-out must be after check-in",
  );
  await expect(page).toHaveURL("/book");
  // Typed into the URL, the server-side page validates too.
  await page.goto("/book/rooms?arrival=222222-01-01&departure=222222-01-04");
  await expect(page.locator(".book-error, .notice")).toContainText(
    "four-digit year",
  );
  await expect(
    page.getByRole("link", { name: "Change dates or guests" }),
  ).toBeVisible();
});

test("a party larger than four is guided to more rooms", async ({ page }) => {
  await page.addInitScript(skipGuide);
  await page.goto("/book");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Add one adult" }).click();
  await expect(
    page.getByText("A party of 6 needs at least 2 rooms"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use 2 rooms" }).click();
  await expect(page.getByRole("group", { name: "Rooms" })).toContainText("2");
  await page.getByRole("button", { name: "See available rooms" }).click();
  await expect(
    page.getByText("Choose 2 rooms with space for all 6"),
  ).toBeVisible();
  const cont = page.getByRole("button", { name: "Continue" });
  await expect(cont).toBeDisabled();
  await page
    .getByRole("button", { name: "Add one grand sanctuary room" })
    .click();
  await page
    .getByRole("button", { name: "Add one signature suite room" })
    .click();
  await expect(cont).toBeEnabled();
  await cont.click();
  await expect(page).toHaveURL(/\/book\/details\?.*roomIds=S-\d+,S-\d+/);
  await expect(page.getByText("Simulated amount due")).toBeVisible();
});

test("mobile and tablet navigation have no overflow and companion access", async ({
  page,
}) => {
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "My VIERCYS" })
      .click();
    await expect(page).toHaveURL("/my-stay");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".mobile-book-action")).toBeVisible();
  await page.screenshot({ path: "test-results/home-mobile.png" });
  await page.goto("/book");
  await expect(page.locator(".mobile-book-action")).toHaveCount(0);
  await page.goto("/destinations");
  await expect(
    page.getByText("Future destination · Reservations unavailable"),
  ).toHaveCount(3);
});

test("no-JavaScript homepage keeps the booking link and destination content", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".hero-book")).toHaveAttribute("href", "/book");
  await page.goto("/destinations");
  await expect(
    page.getByRole("heading", { name: "Bali", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("calendar, guide and suite tabs work from the keyboard", async ({
  page,
}) => {
  await page.goto("/book");
  const guide = page.getByRole("region", { name: "Booking guide" });
  await expect(guide).toContainText("step 1 of 3");
  await guide.getByRole("button", { name: "Next" }).focus();
  await page.keyboard.press("Enter");
  await expect(guide).toContainText("step 2 of 3");
  await guide.getByRole("button", { name: "Back" }).click();
  await expect(guide).toContainText("step 1 of 3");
  await guide.getByRole("button", { name: "Skip guide" }).click();
  await expect(guide).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Booking guide" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Show booking guide" }).click();
  await expect(
    page.getByRole("region", { name: "Booking guide" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Choose check-in from calendar" })
    .click();
  const dates = page
    .getByRole("dialog")
    .locator(".calendar-days button:not([disabled])");
  await dates.first().focus();
  const before = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label"),
  );
  await page.keyboard.press("ArrowRight");
  // Focus moves on the next animation frame, after the month re-renders.
  await expect
    .poll(() =>
      page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    )
    .not.toBe(before);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();

  await page.goto("/");
  await page.getByRole("tab", { name: "Essential Room", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Signature Suite", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});
