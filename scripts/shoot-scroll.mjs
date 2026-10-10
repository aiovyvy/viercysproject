// Viewport screenshots while scrolling a page, as a visitor sees it.
// Usage: node scripts/shoot-scroll.mjs <outDir> <prefix> <path> [desktop|mobile|both]
import { chromium } from "@playwright/test";
const [outDir, prefix, path, which = "both"] = process.argv.slice(2);
const base = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch();
const modes = [
  ["desktop", { width: 1440, height: 900 }, false],
  ["mobile", { width: 390, height: 844 }, true],
].filter(([label]) => which === "both" || which === label);
for (const [label, viewport, mobile] of modes) {
  const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
  await page.addInitScript(() => localStorage.setItem("viercys-booking-guide-v1", "done"));
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  let n = 0;
  for (let y = 0; y < height; y += Math.round(viewport.height * 0.9)) {
    await page.mouse.wheel(0, 0);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${outDir}/${prefix}-${label}-${String(n++).padStart(2, "0")}.jpg`, type: "jpeg", quality: 55 });
  }
  console.log(label, n, "frames");
  await page.close();
}
await browser.close();
