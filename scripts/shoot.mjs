// Captures visual QA screenshots. Usage: node scripts/shoot.mjs <prefix> [baseURL]
import { chromium } from "@playwright/test";
const prefix = process.argv[2] || "shot";
const base = process.argv[3] || "http://localhost:3000";
const out = "docs/ux/m1/";
const pages = [
  ["room-essential", "/rooms/essential"],
  ["room-signature", "/rooms/signature"],
  ["room-grand", "/rooms/grand"],
];
const browser = await chromium.launch();
for (const [name, path] of pages) {
  for (const [label, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: "no-preference" });
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}${prefix}-${name}-${label}.jpg`, fullPage: true, quality: 60, type: "jpeg" });
    await page.screenshot({ path: `${out}${prefix}-${name}-${label}-fold.jpg`, quality: 70, type: "jpeg" });
    await page.close();
  }
}
await browser.close();
console.log("done", (await import("node:child_process")).execSync("git rev-parse --short HEAD").toString().trim());
