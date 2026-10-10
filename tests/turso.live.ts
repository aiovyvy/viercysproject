import { spawn } from "node:child_process";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID, randomInt } from "node:crypto";
import { propertyToday, addDays } from "../src/lib/policy";
import { writeFileSync } from "node:fs";

const references: string[] = [];
const arrival = addDays(propertyToday(), randomInt(500, 650));
const search = {
  arrival,
  departure: addDays(arrival, 2),
  adults: 2,
  children: 0,
  rooms: 1,
};
const input = (room: string) => ({
  ...search,
  roomIds: [room],
  extras: [],
  guest: {
    name: "Turso Verification Guest",
    email: "turso-verification@example.test",
  },
  consent: true,
  idempotencyKey: randomUUID(),
});
async function staff(request: APIRequestContext) {
  const response = await request.post("/api/admin/login", {
    data: { username: "manager", password: process.env.VIERCYS_ADMIN_PASSWORD },
  });
  expect(response.status()).toBe(200);
}
test.afterAll(() => {
  writeFileSync(
    "test-results/turso-verification.json",
    JSON.stringify(
      {
        arrival,
        references,
        notes:
          "Synthetic verification reservations retained; no real confirmation emails were sent.",
      },
      null,
      2,
    ),
  );
});
test("Turso browser booking is saved without email; duplicate checkout, staff and deferred email remain secure", async ({
  page,
  request,
  browser,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("viercys-booking-guide-v1", "done"),
  );
  await page.goto("/book");
  await expect(page.getByLabel("Check-in", { exact: true })).toBeEditable();
  // Wait for hydration via the interactive guide control before changing dates.
  await page.getByRole("button", { name: "Show booking guide" }).click();
  await page.getByRole("button", { name: "Skip guide" }).click();
  await page.getByLabel("Check-in", { exact: true }).fill(arrival);
  await page.getByLabel("Check-out", { exact: true }).fill(search.departure);
  await page.getByRole("button", { name: "See available rooms" }).click();
  await page.getByRole("button", { name: "Select Essential Room" }).click();
  await page.getByLabel("Full name").fill("Turso Verification Guest");
  await page
    .getByLabel("Email address")
    .fill("turso-verification@example.test");
  await page.getByRole("checkbox", { name: /simulated booking/ }).check();
  const pending = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/bookings") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Confirm reservation/ }).click();
  const response = await pending;
  expect(response.status()).toBe(200);
  const saved = await response.json();
  references.push(saved.booking.reference);
  await expect(
    page.getByRole("heading", { name: "Your Stay Is Confirmed" }),
  ).toBeVisible();
  await expect(page.locator(".stay-ref")).toHaveText(saved.booking.reference);
  expect(saved.email[0].status).toBe("demo-preview");
  const duplicate = await page.request.post("/api/bookings", {
    data: response.request().postDataJSON(),
  });
  expect((await duplicate.json()).booking.reference).toBe(
    saved.booking.reference,
  );
  const stranger = await browser.newContext();
  expect(
    (
      await stranger.request.get("/api/bookings/" + saved.booking.reference)
    ).status(),
  ).toBe(403);
  expect(
    (
      await stranger.request.post("/api/admin/confirmation-email", {
        data: {
          reference: saved.booking.reference,
          confirmReference: saved.booking.reference,
        },
      })
    ).status(),
  ).toBe(401);
  await stranger.close();
  await staff(request);
  const persisted = await request.get(
    "/api/bookings/" + saved.booking.reference,
  );
  expect((await persisted.json()).booking.reference).toBe(
    saved.booking.reference,
  );
  const deferred = await request.post("/api/admin/confirmation-email", {
    data: {
      reference: saved.booking.reference,
      confirmReference: saved.booking.reference,
    },
  });
  expect(deferred.status()).toBe(400);
  expect((await deferred.json()).error).toContain("not configured");
});
test("Turso competing room bookings and invitation redemption commit once", async ({
  browser,
  request,
}) => {
  await staff(request);
  const roomSearch = {
    ...search,
    arrival: addDays(arrival, 5),
    departure: addDays(arrival, 7),
  };
  const rooms = (
    await (await request.post("/api/availability", { data: roomSearch })).json()
  ).rooms as { id: string; category: string }[];
  const essential = rooms.filter((room) => room.category === "essential");
  expect(essential.length).toBeGreaterThan(2);
  const a = await browser.newContext(),
    b = await browser.newContext();
  const races = await Promise.all(
    [a, b].map((context) =>
      context.request.post("/api/bookings", {
        data: { ...input(essential[0].id), ...roomSearch },
      }),
    ),
  );
  expect(races.map((response) => response.status()).sort()).toEqual([200, 400]);
  for (const response of races)
    if (response.ok())
      references.push((await response.json()).booking.reference);
  const invitations = await request.post("/api/admin/invites", {
    data: { count: 1, label: "Turso concurrency verification" },
  });
  const { created } = await invitations.json();
  const token = new URL(created[0].url).pathname.split("/").pop();
  for (const context of [a, b])
    expect(
      (
        await context.request.post("/api/invite/claim", { data: { token } })
      ).status(),
    ).toBe(200);
  const redemptions = await Promise.all(
    [a, b].map((context, index) =>
      context.request.post("/api/bookings", {
        data: {
          ...input(essential[index + 1].id),
          ...roomSearch,
          useVoucher: true,
        },
      }),
    ),
  );
  expect(redemptions.map((response) => response.status()).sort()).toEqual([
    200, 409,
  ]);
  for (const response of redemptions)
    if (response.ok()) {
      const body = await response.json();
      references.push(body.booking.reference);
      expect(body.booking.pricing.total).toBe(0);
    }
  const invited = await request.get("/api/admin/invites");
  expect(
    (await invited.json()).invites.find(
      (invite: { id: string }) => invite.id === created[0].id,
    ).reference,
  ).toBeTruthy();
  await a.close();
  await b.close();
});

async function independentBooking(
  payload: ReturnType<typeof input> & { inviteToken?: string },
) {
  return new Promise<{ saved: boolean; reference?: string }>(
    (resolve, reject) => {
      const worker = spawn(
        process.execPath,
        ["--import", "tsx", "tests/turso-worker.ts"],
        { env: process.env, stdio: ["pipe", "pipe", "ignore"] },
      );
      let output = "";
      worker.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });
      worker.on("error", () =>
        reject(new Error("Independent booking worker could not start.")),
      );
      worker.on("exit", () => {
        try {
          resolve(JSON.parse(output));
        } catch {
          reject(
            new Error("Independent booking worker did not return a result."),
          );
        }
      });
      worker.stdin.end(JSON.stringify(payload));
    },
  );
}
test("independent server processes cannot double-book a Turso room", async ({
  request,
}) => {
  const future = {
    ...search,
    arrival: addDays(arrival, 10),
    departure: addDays(arrival, 12),
  };
  const rooms = (
    await (await request.post("/api/availability", { data: future })).json()
  ).rooms as { id: string }[];
  const results = await Promise.all(
    [0, 1].map(() => independentBooking({ ...input(rooms[0].id), ...future })),
  );
  expect(results.filter((result) => result.saved)).toHaveLength(1);
  for (const result of results)
    if (result.reference) references.push(result.reference);
  await staff(request);
  expect(
    (
      await request.get(
        "/api/bookings/" + results.find((result) => result.saved)!.reference,
      )
    ).status(),
  ).toBe(200);
});

test("shared class limits and duplicate students hold across independent Turso processes", async ({
  browser,
  request,
}) => {
  await staff(request);
  for (const duplicate of [false, true]) {
    const campaign = await (
      await request.post("/api/admin/class-invites", {
        data: {
          name: "Turso shared invitation verification",
          limit: duplicate ? 30 : 1,
          expires: new Date(Date.now() + 86400000).toISOString(),
          active: true,
          roster: "",
        },
      })
    ).json();
    const token = new URL(campaign.url).pathname.split("/").pop();
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
    ]);
    const claimTokens: string[] = [];
    for (const [index, context] of contexts.entries()) {
      const response = await context.request.post(
        "/api/invite/class/register",
        {
          data: {
            token,
            name: "Turso Verification Guest",
            identifier: duplicate
              ? "TURSO-SAME-STUDENT"
              : `TURSO-STUDENT-${index}`,
            email: "",
          },
        },
      );
      expect(response.ok()).toBe(true);
      claimTokens.push(
        (await context.cookies()).find(
          (cookie) => cookie.name === "viercys_invite",
        )!.value,
      );
    }
    const day = addDays(arrival, duplicate ? 28 : 23);
    const future = { ...search, arrival: day, departure: addDays(day, 3) };
    const rooms = (
      await (await request.post("/api/availability", { data: future })).json()
    ).rooms as { id: string }[];
    const results = await Promise.all(
      claimTokens.map((inviteToken, index) =>
        independentBooking({
          ...input(rooms[index].id),
          ...future,
          guest: { name: "Turso Verification Guest", email: "" },
          inviteToken,
        }),
      ),
    );
    expect(results.filter((result) => result.saved)).toHaveLength(1);
    for (const result of results)
      if (result.reference) references.push(result.reference);
    const saved = await (await request.get("/api/admin/class-invites")).json();
    expect(
      saved.campaigns.find((item: { id: string }) => item.id === campaign.id)
        .redemptions,
    ).toBe(1);
    await request.post("/api/admin/class-invites", {
      data: { action: "status", id: campaign.id, active: false },
    });
    await Promise.all(contexts.map((context) => context.close()));
  }
});
