import { test, expect, devices, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { propertyToday, addDays } from "../src/lib/policy";
const axeSource = readFileSync(
  createRequire(import.meta.url).resolve("axe-core/axe.min.js"),
  "utf8",
);
const query = (search: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(search).map(([key, value]) => [key, String(value)]),
  ).toString();
const arrival = addDays(propertyToday(), 200);
const search = {
  arrival,
  departure: addDays(arrival, 3),
  adults: 2,
  children: 0,
  rooms: 1,
};
const INFO = [
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/accessibility",
];
const RAW =
  /demo-paid|demo-refunded|not-arrived|demo-preview|checked-in|\b1 rooms\b|Persistent local demo/;
test.use({ ...devices["iPhone 13"] });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("viercys-booking-guide-v1", "done"),
  );
});
async function guestBooking(page: Page, room: string) {
  const response = await page.request.post("/api/bookings", {
    data: {
      ...search,
      roomIds: [room],
      extras: [],
      guest: { name: "Site Check", email: "site@example.test" },
      consent: true,
      idempotencyKey: randomUUID(),
    },
  });
  return (await response.json()).booking.reference as string;
}

test("footer reaches every standard page, each with header, heading and footer", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("navigation", { name: "Footer" });
  for (const [name, path] of [
    ["About", "/about"],
    ["FAQ", "/faq"],
    ["Contact", "/contact"],
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
    ["Accessibility", "/accessibility"],
    ["Find my booking", "/lookup"],
    ["Destinations", "/destinations"],
  ]) {
    await footer.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "VIERCYS home" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Footer" }),
    ).toBeVisible();
  }
});

test("guest pages use plain language: no demo banner, no raw status codes", async ({
  page,
}) => {
  const reference = await guestBooking(page, "S-301");
  for (const path of [
    "/my-stay",
    "/booking/" + reference,
    "/booking/" + reference + "/receipt",
    "/booking/" + reference + "/email-preview",
    "/itinerary/" + reference,
    "/rooms/essential",
    "/compare",
    "/concierge",
    "/lookup",
    ...INFO,
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const text = await page.locator("main").innerText();
    expect(text, path).not.toMatch(RAW);
    // Simulated payment is still disclosed on every page.
    expect(text, path).toMatch(/fictional hotel/i);
  }
  await page.goto("/my-stay");
  await expect(
    page.getByText("Confirmed · simulated payment, no real charge"),
  ).toBeVisible();
});

test("no sideways scrolling at 320px and 44px tap targets on key pages", async ({
  page,
}) => {
  const reference = await guestBooking(page, "S-302");
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of [
    "/",
    "/book",
    "/book/rooms?" + query(search),
    "/book/details?" +
      query({
        ...search,
        arrival: addDays(arrival, 10),
        departure: addDays(arrival, 13),
      }) +
      "&roomIds=S-202",
    "/booking/" + reference,
    "/my-stay",
    "/lookup",
    "/concierge",
    "/rooms/essential",
    "/rooms/grand",
    "/rooms",
    "/philosophy",
    "/experiences",
    "/destinations",
    "/santorini",
    "/credits",
    ...INFO,
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      path,
    ).toBe(true);
    if (path === "/") continue; // editorial homepage is checked separately
    const small = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          "main a, main button, main summary, main input:not([type=hidden]), main select, footer a",
        ),
      ]
        .filter((el) => {
          const box = el.getBoundingClientRect();
          if (!box.width || !box.height) return false;
          const style = getComputedStyle(el);
          // Links inside running text are exempt (WCAG 2.5.8).
          if (
            el.tagName === "A" &&
            style.display === "inline" &&
            el.closest("p, li, dd")
          )
            return false;
          if ((el as HTMLInputElement).type === "checkbox") return false; // label is the target
          return box.height < 44;
        })
        .map(
          (el) =>
            `${el.tagName} "${(el as HTMLElement).innerText?.slice(0, 30)}"`,
        ),
    );
    expect(small, path).toEqual([]);
  }
});

test("no serious or critical accessibility violations on any page", async ({
  page,
}) => {
  const reference = await guestBooking(page, "S-303");
  const paths = [
    "/",
    "/book",
    "/book/rooms?" + query(search),
    "/book/details?" +
      query({
        ...search,
        arrival: addDays(arrival, 20),
        departure: addDays(arrival, 23),
      }) +
      "&roomIds=S-203",
    "/booking/" + reference,
    "/booking/" + reference + "/receipt",
    "/my-stay",
    "/lookup",
    "/concierge",
    "/compare",
    "/rooms/signature",
    "/santorini",
    "/destinations",
    "/destinations/bali",
    "/rooms",
    "/philosophy",
    "/experiences",
    "/credits",
    "/admin",
    ...INFO,
  ];
  const failures: string[] = [];
  for (const path of paths) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => {
      const axe = (
        window as unknown as {
          axe: {
            run: (
              ctx: Document,
              options: object,
            ) => Promise<{
              violations: {
                id: string;
                impact: string;
                nodes: { target: string[] }[];
              }[];
            }>;
          };
        }
      ).axe;
      const result = await axe.run(document, {
        runOnly: ["wcag2a", "wcag2aa"],
      });
      return result.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(" | ")}`,
        );
    });
    failures.push(...violations.map((v) => path + " → " + v));
  }
  expect(failures).toEqual([]);
});

test("a booking can be completed with the keyboard alone", async ({ page }) => {
  await page.goto(
    "/book/rooms?" +
      query({
        ...search,
        arrival: addDays(arrival, 30),
        departure: addDays(arrival, 33),
      }),
  );
  await page.getByRole("button", { name: "Select Essential Room" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/book\/details/);
  await page.getByLabel("Full name").focus();
  await page.keyboard.type("Keyboard Guest");
  await page.keyboard.press("Tab");
  await page.keyboard.type("keys@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: /Confirm reservation/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Your Stay Is Confirmed" }),
  ).toBeVisible();
});
