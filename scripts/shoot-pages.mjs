// Full-page and first-screen captures for a list of routes.
// Usage: node scripts/shoot-pages.mjs <outDir> <prefix> <path> [path...]
import { chromium } from "@playwright/test";
const [outDir, prefix, ...paths] = process.argv.slice(2);
const base = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch();
for (const path of paths) {
  const name = path === "/" ? "home" : path.slice(1).replace(/[/?=&]/g, "-");
  for (const [label, viewport, mobile] of [
    ["desktop", { width: 1440, height: 900 }, false],
    ["mobile", { width: 390, height: 844 }, true],
  ]) {
    const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
    await page.addInitScript(() => localStorage.setItem("viercys-booking-guide-v1", "done"));
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 70));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outDir}/${prefix}-${name}-${label}.jpg`, fullPage: true, type: "jpeg", quality: 55 });
    await page.screenshot({ path: `${outDir}/${prefix}-${name}-${label}-fold.jpg`, type: "jpeg", quality: 70 });
    if (path === "/about") {
      // Navigation, open.
      const toggle = page.getByRole("button", { name: /Open navigation|Menu/ });
      if (mobile && (await toggle.count())) {
        await toggle.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${outDir}/${prefix}-nav-${label}.jpg`, type: "jpeg", quality: 70 });
      } else if (!mobile) {
        const more = page.getByRole("button", { name: /More|Explore/ });
        if (await more.count()) {
          await more.first().click();
          await page.waitForTimeout(400);
        }
        await page.screenshot({ path: `${outDir}/${prefix}-nav-${label}.jpg`, type: "jpeg", quality: 70, clip: { x: 0, y: 0, width: 1440, height: 520 } });
      }
    }
    await page.close();
  }
}
await browser.close();
