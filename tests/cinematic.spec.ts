import { test, expect } from "@playwright/test";
test("architectural journey scrubs forward and reverses without hiding booking", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const journey = page.locator('[data-cinematic="architectural-journey"]');
  await expect(journey).toBeAttached();
  await expect(journey).toHaveAttribute("data-render-mode", "3d", {
    timeout: 30000,
  });
  await expect(journey.locator("canvas")).toBeVisible();
  const top = await journey.evaluate(
    (el) => el.getBoundingClientRect().top + window.scrollY,
  );
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    top + 950,
  );
  await expect
    .poll(async () =>
      Number(await journey.getAttribute("data-scroll-progress")),
    )
    .toBeGreaterThan(0.2);
  await page.screenshot({ path: "test-results/architecture-3d.png" });
  const forward = Number(await journey.getAttribute("data-scroll-progress"));
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    top + 100,
  );
  await expect
    .poll(async () =>
      Number(await journey.getAttribute("data-scroll-progress")),
    )
    .toBeLessThan(forward - 0.15);
  await journey.getByRole("link", { name: "Skip to booking" }).click();
  await expect(page.locator("#reservation")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("phone scrubs the layered arch passage without WebGL", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  const journey = page.locator('[data-cinematic="architectural-journey"]');
  await expect(journey).toHaveAttribute("data-render-mode", "2d");
  await expect(journey.locator("canvas")).toHaveCount(0);
  const top = await journey.evaluate(
    (el) => el.getBoundingClientRect().top + window.scrollY,
  );
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    top + 700,
  );
  await expect
    .poll(async () =>
      Number(await journey.getAttribute("data-scroll-progress")),
    )
    .toBeGreaterThan(0.3);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    top + 1700,
  );
  await expect(
    journey.getByRole("link", { name: "View rooms & availability" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await context.close();
});
test("reduced motion keeps a static narrative with no pinning or WebGL", async ({
  browser,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
  ]) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("/");
    const journey = page.locator('[data-cinematic="architectural-journey"]');
    await expect(journey).toHaveAttribute("data-render-mode", "2d");
    await expect(journey.locator("canvas")).toHaveCount(0);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    const link = journey.getByRole("link", {
      name: "View rooms & availability",
    });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await context.close();
  }
});
