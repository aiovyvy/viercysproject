// Detail screenshots of the room page sections, lightbox and phone dock.
// Usage: node scripts/shoot-detail.mjs <room> [baseURL]
import { chromium } from "@playwright/test";
const room = process.argv[2] || "signature";
const base = process.argv[3] || "http://localhost:3000";
const out = `docs/ux/m1/detail-${room}-`;
const browser = await chromium.launch();
async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await page.waitForTimeout(600);
}
for (const [label, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${base}/rooms/${room}`, { waitUntil: "networkidle" });
  await settle(page);
  for (const [name, selector] of [
    ["overview", "main > div:nth-of-type(1)"],
    ["gallery", "#gallery"],
    ["compare", "section[aria-labelledby=compare-title]"],
  ]) {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await el.screenshot({ path: `${out}${label}-${name}.jpg`, type: "jpeg", quality: 70 });
  }
  // Story: viewport capture mid-section so the pinned photo is visible.
  await page.locator("section[aria-labelledby=story-title] li").nth(1).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}${label}-story.jpg`, type: "jpeg", quality: 70 });
  if (label === "mobile") {
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}${label}-dock.jpg`, type: "jpeg", quality: 70 });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: /View all/ }).click();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}${label}-lightbox.jpg`, type: "jpeg", quality: 70 });
  const counter = await page.locator("dialog[open] [aria-live]").innerText();
  await page.keyboard.press("Escape");
  const closed = await page.locator("dialog[open]").count();
  console.log(label, "lightbox counter after ArrowRight:", counter, "| open after Escape:", closed);
  await page.close();
}
await browser.close();
