// Viewport screenshots down the homepage. Usage: node scripts/shoot-home.mjs <prefix>
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
const prefix = process.argv[2] || "shot";
const base = process.argv[3] || "http://localhost:3000";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [label, viewport, mobile] of [
  ["desktop", { width: 1440, height: 900 }, false],
  ["mobile", { width: 390, height: 844 }, true],
]) {
  const page = await browser.newPage({ viewport, hasTouch: mobile, isMobile: mobile });
  await page.addInitScript(() => localStorage.setItem("viercys-booking-guide-v1", "done"));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  let n = 0;
  for (let y = 0; y < height; y += viewport.height) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `docs/ux/m2/${prefix}-home-${label}-${String(n++).padStart(2, "0")}.jpg`, type: "jpeg", quality: 60 });
  }
  console.log(label, "frames", n, "height", height);
  await page.close();
}
await browser.close();
console.log("commit", execSync("git rev-parse --short HEAD").toString().trim());
