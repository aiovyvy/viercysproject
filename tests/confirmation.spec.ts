import { test, expect, devices } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { propertyToday, addDays } from "../src/lib/policy";

test("individual invitation PDF uses authorized saved data; mobile sharing and copy never expose private access", async ({
  browser,
}) => {
  const staff = await browser.newContext();
  await staff.request.post("/api/admin/login", {
    data: { username: "manager", password: "Test-only-password-2026!" },
  });
  const { created } = await (
    await staff.request.post("/api/admin/invites", { data: { count: 1 } })
  ).json();
  const token = new URL(created[0].url).pathname.split("/").pop();
  const guest = await browser.newContext({ ...devices["iPhone 13"] });
  expect(
    (await guest.request.post("/api/invite/claim", { data: { token } })).ok(),
  ).toBeTruthy();
  const arrival = addDays(propertyToday(), 620);
  const response = await guest.request.post("/api/bookings", {
    data: {
      arrival,
      departure: addDays(arrival, 3),
      adults: 2,
      children: 0,
      rooms: 1,
      roomIds: ["S-109"],
      guest: { name: "PDF Private Guest", email: "pdf-private@example.test" },
      consent: true,
      useVoucher: true,
      idempotencyKey: randomUUID(),
    },
  });
  expect(response.ok()).toBeTruthy();
  const { booking } = await response.json();
  expect(booking.pricing.total).toBe(0);
  const endpoint = `/api/bookings/${booking.reference}/confirmation.pdf`;
  const result = await guest.request.get(
    endpoint + "?name=FORGED&total=999999",
  );
  expect(result.status()).toBe(200);
  expect(result.headers()["content-type"]).toBe("application/pdf");
  expect(result.headers()["cache-control"]).toContain("no-store");
  expect(result.headers()["content-disposition"]).toContain(
    `VIERCYS-Confirmation-${booking.reference}.pdf`,
  );
  const task = getDocument({
    data: new Uint8Array(await result.body()),
    useSystemFonts: false,
  });
  const pdf = await task.promise;
  const text = (await (await pdf.getPage(1)).getTextContent()).items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ");
  expect(text).toContain("PDF Private Guest");
  expect(text).toContain("₱0.00");
  expect(text).not.toContain("FORGED");
  await task.destroy();
  const stranger = await browser.newContext();
  expect((await stranger.request.get(endpoint)).status()).toBe(403);
  expect(
    (
      await stranger.request.get(endpoint + "?email=pdf-private@example.test")
    ).status(),
  ).toBe(403);
  const other = await stranger.request.post("/api/bookings", {
    data: {
      arrival,
      departure: addDays(arrival, 3),
      adults: 2,
      children: 0,
      rooms: 1,
      roomIds: ["S-108"],
      guest: { name: "Another Guest", email: "another-pdf@example.test" },
      consent: true,
      idempotencyKey: randomUUID(),
    },
  });
  expect(other.ok()).toBeTruthy();
  expect((await stranger.request.get(endpoint)).status()).toBe(403);
  expect((await staff.request.get(endpoint)).status()).toBe(200);
  expect(
    (await guest.request.post(endpoint, { data: { name: "FORGED" } })).status(),
  ).toBe(405);
  const page = await guest.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        (window as unknown as { shared: ShareData }).shared = data;
      },
    });
  });
  await page.goto("/booking/" + booking.reference);
  await expect(
    page.getByRole("heading", { name: "Your Stay Is Confirmed" }),
  ).toBeVisible();
  await expect(page.locator(".confirmation-total")).toContainText("₱0.00");
  await page.screenshot({ path: "test-results/confirmation-phone-top.png" });
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PDF Confirmation" }).click();
  await (await download).saveAs("test-results/confirmation-preview.pdf");
  expect((await download).suggestedFilename()).toBe(
    `VIERCYS-Confirmation-${booking.reference}.pdf`,
  );
  await page
    .getByRole("button", { name: "Share Confirmation", exact: true })
    .click();
  const shared = await page.evaluate(
    () => (window as unknown as { shared: ShareData }).shared,
  );
  expect(shared.url).toBe("http://localhost:3100/");
  expect(shared.text).toContain(booking.reference);
  for (const value of [
    booking.name,
    booking.email,
    "S-109",
    "Room 109",
    "token=",
    "/booking/",
  ])
    expect(JSON.stringify(shared)).not.toContain(value);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new DOMException("Cancelled", "AbortError");
      },
    }),
  );
  await page
    .getByRole("button", { name: "Share Confirmation", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Sharing cancelled" }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    });
  });
  await page
    .getByRole("button", { name: "Share Confirmation", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toContain(booking.reference);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    }),
  );
  await page
    .getByRole("button", { name: "Copy Confirmation Details", exact: true })
    .click();
  await expect(page.getByLabel("Confirmation details to copy")).toHaveValue(
    /Fictional HCI/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/confirmation-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/confirmation-desktop.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.goto("/my-stay");
  await expect(
    page.getByRole("link", { name: "Download PDF Confirmation" }),
  ).toBeVisible();
  await guest.close();
  await stranger.close();
  await staff.close();
});
