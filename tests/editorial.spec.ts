import { test, expect, devices } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("viercys-booking-guide-v1", "done"),
  );
});

const PAGES = [
  ["Rooms & Suites", "/rooms"],
  ["Destinations", "/destinations"],
  ["Experiences", "/experiences"],
  ["Our Philosophy", "/philosophy"],
  ["About VIERCYS", "/about"],
  ["Santorini", "/santorini"],
  ["Contact", "/contact"],
  ["FAQ", "/faq"],
  ["Concierge", "/concierge"],
  ["My VIERCYS", "/my-stay"],
  ["Find my booking", "/lookup"],
] as const;

test("desktop header: inline links, More panel by keyboard, every page real", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const main = page.getByRole("navigation", { name: "Main navigation" });
  for (const name of [
    "Rooms & Suites",
    "Destinations",
    "Experiences",
    "Our Philosophy",
  ])
    await expect(main.getByRole("link", { name })).toBeVisible();
  const more = main.getByRole("button", { name: /More/ });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(more).toHaveAttribute("aria-expanded", "true");
  await expect(main.getByRole("link", { name: "About VIERCYS" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(more).toBeFocused();
  for (const [, path] of PAGES) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
  }
});

test("phone menu reaches every page and traps focus while open", async ({
  browser,
}) => {
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  await page.goto("/");
  for (const [name, path] of PAGES) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page).toHaveURL(path);
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  // Tabbing past the last item wraps back inside the menu.
  for (let i = 0; i < 20; i++) await page.keyboard.press("Tab");
  const inside = await page.evaluate(
    () => !!document.activeElement?.closest("header"),
  );
  expect(inside).toBe(true);
  await context.close();
});

test("philosophy: chapter rail jumps and reduced motion shows every word", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/philosophy");
  const rail = page.getByRole("navigation", { name: "Philosophy chapters" });
  await rail.getByRole("link", { name: /Craft/ }).click();
  await expect(page).toHaveURL(/#craft$/);
  await expect(
    page.getByRole("heading", { name: /Four materials/ }),
  ).toBeInViewport();
  const faded = await page.evaluate(() =>
    [...document.querySelectorAll("#slow p span")].filter(
      (word) => Number(getComputedStyle(word).opacity) < 1,
    ).length,
  );
  expect(faded).toBe(0);
  await context.close();
});

test("destinations: only Santorini can be booked", async ({ page }) => {
  await page.goto("/destinations");
  const santorini = page.locator("#santorini");
  await expect(santorini).toContainText("Open for booking");
  await expect(
    santorini.getByRole("link", { name: "Book a stay" }),
  ).toHaveAttribute("href", "/book");
  for (const slug of ["boracay", "amalfi", "bali"]) {
    const panel = page.locator(`#${slug}`);
    await expect(panel).toContainText(
      "Future destination · Reservations unavailable",
    );
    await expect(panel.getByRole("link", { name: "Book a stay" })).toHaveCount(
      0,
    );
  }
  await page.goto("/destinations/bali");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bali");
  await expect(page.getByText("it cannot be booked")).toBeVisible();
  await page.goto("/destinations/santorini");
  await expect(page).toHaveURL("/santorini");
});

test("experiences: real prices, honest confirmation, gallery by button", async ({
  page,
}) => {
  await page.goto("/experiences");
  const sailing = page.locator("#sailing");
  await expect(sailing).toContainText("€90.00");
  await expect(sailing).toContainText("our team confirms");
  await expect(page.locator("#breakfast")).toContainText(
    "Added instantly when you book",
  );
  const gallery = sailing.getByRole("group", { name: "Sunset sailing photos" });
  await expect(gallery.getByText("1 / 2")).toBeVisible();
  await gallery.getByRole("button", { name: "Next photo" }).click();
  await expect(gallery.getByText("2 / 2")).toBeVisible();
});

test("rooms overview and photo credits are complete", async ({ page }) => {
  await page.goto("/rooms");
  for (const name of ["Essential Room", "Signature Suite", "Grand Sanctuary"])
    await expect(
      page.getByRole("link", { name: `Discover the ${name}` }),
    ).toHaveAttribute("href", /\/rooms\//);
  await page.goto("/credits");
  await expect(page.getByRole("cell", { name: "kuhnmi" }).first()).toBeVisible();
  await expect(page.getByText("CC BY 2.0").first()).toBeVisible();
});
