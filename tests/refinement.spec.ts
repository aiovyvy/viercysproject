import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { propertyToday, addDays } from "../src/lib/policy";

test("future horizons stagger vertically without masking their labels", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.mouse.move(0, 0);
  const section = page.locator("[data-horizons]");
  const photos = page.locator("[data-horizon-photo]");
  const top = await section.evaluate(
    (el) => el.getBoundingClientRect().top + scrollY,
  );
  const phases: string[][] = [];
  for (const [index, offset] of [760, 500, 200].entries()) {
    await page.evaluate(
      (y) => scrollTo({ top: y, behavior: "instant" }),
      top - offset,
    );
    await page.waitForTimeout(350);
    phases.push(
      await photos.evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).clipPath),
      ),
    );
    await expect(section.locator("li p")).toHaveCount(3);
    for (const label of await section.locator("li p").all())
      await expect(label).toContainText(/Coming\s+soon/);
    await page.screenshot({ path: info.outputPath(`horizons-${index}.png`) });
  }
  expect(phases[0]).not.toEqual(phases[2]);
  expect(new Set(phases[1]).size).toBeGreaterThan(1);
});

test("yacht chapter count is outside the architectural photo mask", async ({
  page,
}, info) => {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.mouse.move(0, 0);
    const section = page.locator('[data-scene="experiences"]');
    const yacht = section.locator("li").filter({ hasText: "Sunset sailing" });
    await yacht.scrollIntoViewIfNeeded();
    await expect(yacht).toHaveAttribute("data-active", "true");
    const progress = section.locator("[data-experience-progress]");
    if (width > 860) {
      await expect(progress).toContainText("Sunset sailing");
      const image = section.locator('[aria-hidden="true"]').first();
      expect(
        await progress.evaluate((el) => el.closest('[aria-hidden="true"]')),
      ).toBeNull();
      const photoBox = (await image.boundingBox())!;
      const countBox = (await progress.boundingBox())!;
      expect(countBox.y).toBeGreaterThanOrEqual(photoBox.y + photoBox.height);
    } else await expect(progress).toBeHidden();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: info.outputPath(`yacht-${width}.png`) });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("saved confirmation is honest, private and idempotent without provider credentials", async ({
  page,
  browser,
}) => {
  const arrival = addDays(propertyToday(), 265);
  const body = {
    arrival,
    departure: addDays(arrival, 3),
    adults: 2,
    children: 0,
    rooms: 1,
    roomIds: ["S-101"],
    guest: { name: "Email Flow Guest", email: "flow@example.test" },
    consent: true,
    idempotencyKey: randomUUID(),
  };
  const response = await page.request.post("/api/bookings", { data: body });
  expect(response.ok()).toBe(true);
  const saved = await response.json();
  const duplicate = await (
    await page.request.post("/api/bookings", { data: body })
  ).json();
  expect(duplicate.booking.reference).toBe(saved.booking.reference);
  expect(duplicate.email).toHaveLength(1);
  expect(duplicate.email[0].status).toBe("demo-preview");
  await page.goto(`/booking/${saved.booking.reference}?success=1`);
  await expect(
    page.getByRole("heading", { name: "Confirmation email" }),
  ).toBeVisible();
  await expect(
    page.getByText("Email delivery is not configured", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try sending again" }).click();
  await expect(
    page.getByText("Email delivery is not configured", { exact: false }),
  ).toBeVisible();
  const html = await (
    await page.request.get(
      `/api/bookings/${saved.booking.reference}/email-preview`,
    )
  ).text();
  for (const text of [
    "Email Flow Guest",
    saved.booking.reference,
    "Essential Room",
    "HCI classroom simulation",
    "no actual accommodation or payment",
  ])
    expect(html).toContain(text);
  const stranger = await browser.newContext();
  expect(
    (
      await stranger.request.post(
        `/api/bookings/${saved.booking.reference}/email-retry`,
        { data: {} },
      )
    ).ok(),
  ).toBe(false);
  await stranger.close();
  expect(
    (
      await page.request.post("/api/bookings", {
        data: {
          ...body,
          idempotencyKey: randomUUID(),
          guest: { name: "Invalid Guest", email: "invalid" },
        },
      })
    ).ok(),
  ).toBe(false);
});
