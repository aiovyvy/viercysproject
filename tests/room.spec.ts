import { test, expect, devices } from "@playwright/test";
import { propertyToday, addDays } from "../src/lib/policy";

test.use({ ...devices["iPhone 13"] });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("viercys-booking-guide-v1", "done"),
  );
});

test("room gallery lightbox: buttons, keys, swipe and escape", async ({
  page,
}) => {
  await page.goto("/rooms/signature");
  await page.getByRole("button", { name: /View all 5 photographs/ }).click();
  const dialog = page.getByRole("dialog", {
    name: /Signature Suite photographs/,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("1 / 5")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByText("2 / 5")).toBeVisible();
  await dialog.getByRole("button", { name: "Previous photograph" }).click();
  await expect(dialog.getByText("1 / 5")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.getByText("5 / 5")).toBeVisible();
  // A leftward swipe moves forward.
  const stage = dialog.locator("figure");
  const box = (await stage.boundingBox())!;
  const y = box.y + box.height / 2;
  await stage.dispatchEvent("touchstart", {
    touches: [{ identifier: 1, clientX: box.x + 300, clientY: y }],
  });
  await stage.dispatchEvent("touchend", {
    changedTouches: [{ identifier: 1, clientX: box.x + 60, clientY: y }],
  });
  await expect(dialog.getByText("1 / 5")).toBeVisible();
  await expect(dialog.getByText(/not the VIERCYS property/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("room page books real free rooms and explains when they do not fit", async ({
  page,
}) => {
  const arrival = addDays(propertyToday(), 40);
  const departure = addDays(arrival, 3);
  await page.goto(
    `/rooms/essential?arrival=${arrival}&departure=${departure}&adults=2&children=0&rooms=1`,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Essential Room",
  );
  await expect(page.getByText(/Available · \d+ of 10 free/)).toBeVisible();
  await expect(page.getByText("€540.00 total")).toBeVisible();
  const reserve = page.locator("#reserve");
  await reserve.getByRole("link", { name: "Book a Stay" }).click();
  await expect(page).toHaveURL(/\/book\/details\?.*roomIds=S-\d+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Three guests do not fit an Essential Room: offer every room instead.
  await page.goto(
    `/rooms/essential?arrival=${arrival}&departure=${departure}&adults=3&children=0&rooms=1`,
  );
  await expect(page.getByText(/sleeps up to 2/)).toBeVisible();
  await reserve
    .getByRole("link", { name: "See all rooms for these dates" })
    .click();
  await expect(page).toHaveURL(/\/book\/rooms\?/);
});

test("room date form checks availability on the same room", async ({
  page,
}) => {
  await page.goto("/rooms/grand");
  const arrival = addDays(propertyToday(), 50);
  await page.locator("#reserve input[name=arrival]").fill(arrival);
  await page
    .locator("#reserve input[name=departure]")
    .fill(addDays(arrival, 2));
  await page.locator("#reserve select[name=adults]").selectOption("4");
  await page.getByRole("button", { name: "Check these dates" }).click();
  await expect(page).toHaveURL(new RegExp(`/rooms/grand\\?arrival=${arrival}`));
  await expect(page.getByText("€1,040.00 total")).toBeVisible();
});
