import { test, expect } from "@playwright/test";

test("architectural reveals and room chapters execute with a parked pointer", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.mouse.move(0, 0);
  await expect(page.locator(".pin-spacer").first()).toBeAttached();
  for (const scene of ["courtyard", "horizon", "sunset"]) {
    const element = page.locator(`[data-scene="${scene}"]`);
    const top = await element.evaluate(
      (el) => el.getBoundingClientRect().top + scrollY,
    );
    const clips: string[] = [];
    for (const [index, offset] of [760, 450, 100].entries()) {
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        top - offset,
      );
      await page.waitForTimeout(250);
      clips.push(await element.evaluate((el) => getComputedStyle(el).clipPath));
      await page.screenshot({
        path: testInfo.outputPath(`${scene}-${index}.png`),
      });
    }
    expect(new Set(clips).size).toBeGreaterThan(1);
  }
  const rooms = page.locator('[data-scene="rooms"]');
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  const top = await rooms.evaluate(
    (el) => el.getBoundingClientRect().top + scrollY,
  );
  const photoSize = await rooms.locator("[data-room-visual]").boundingBox();
  for (const [index, offset] of [50, 600, 1150].entries()) {
    await page.evaluate(
      (y) => scrollTo({ top: y, behavior: "instant" }),
      top - 110 + offset,
    );
    await expect(rooms.getByRole("tab").nth(index)).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.waitForTimeout(1200); // Capture the settled crossfade.
    await expect(
      rooms.locator('[data-room-photo][data-active="true"]'),
    ).toHaveCSS("opacity", "1");
    const currentSize = await rooms.locator("[data-room-visual]").boundingBox();
    // ScrollTrigger may round the pinned container by a fraction of a pixel.
    expect(Math.abs(currentSize!.width - photoSize!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(currentSize!.height - photoSize!.height)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`room-${index}.png`) });
  }
  const experiences = page.locator('[data-scene="experiences"]');
  for (const index of [0, 1, 2]) {
    await experiences.locator("li").nth(index).scrollIntoViewIfNeeded();
    await expect(experiences).toHaveAttribute(
      "data-chapter",
      String(index + 1),
    );
    await page.screenshot({
      path: testInfo.outputPath(`experience-${index}.png`),
    });
  }
});

for (const width of [390, 320])
  test(`mobile ${width} keeps room chapters and booking accessible`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.mouse.move(0, 0);
    const mobile = page.locator('[class*="mobileRooms"]');
    for (const item of await mobile.locator("li").all()) {
      await item.scrollIntoViewIfNeeded();
      await expect(item.getByRole("link")).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(
          `mobile-${await item.locator("h3").textContent()}.png`,
        ),
      });
    }
    await page.locator("#closing").scrollIntoViewIfNeeded();
    await expect(
      page
        .locator("#closing")
        .getByRole("link", { name: "Explore rooms & suites" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
