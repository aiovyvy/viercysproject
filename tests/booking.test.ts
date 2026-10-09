import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
const directory = mkdtempSync(join(tmpdir(), "viercys-"));
process.env.VIERCYS_DB_PATH = join(directory, "test.sqlite");
process.env.VIERCYS_DEMO_MODE = "true";
const { db, listRooms, session, createSession } = await import("../src/lib/db");
const {
  createBooking,
  available,
  allocation,
  pricing,
  modify,
  cancel,
  authorize,
  emailStatuses,
} = await import("../src/lib/booking");
const { validateSearch, propertyToday, addDays, dayNumber } =
  await import("../src/lib/policy");
const { sendEmails, emailHtml } = await import("../src/lib/email");
const { createInvites, findInvite, listInvites } =
  await import("../src/lib/invites");
const input = {
  arrival: addDays(propertyToday(), 20),
  departure: addDays(propertyToday(), 23),
  adults: 2,
  children: 0,
  rooms: 1,
};
const make = (changes: Record<string, unknown> = {}) => ({
  ...input,
  roomIds: ["S-101"],
  guest: { name: "Alex Guest", email: "alex@example.test" },
  consent: true,
  idempotencyKey: randomUUID(),
  ...changes,
});
after(() => {
  db().close();
  rmSync(directory, { recursive: true, force: true });
});
test("strict dates, leap days, years, bounds and property calendar", () => {
  for (const [arrival, departure] of [
    ["222222-01-01", "222222-01-04"],
    ["2027-02-30", "2027-03-04"],
    ["2027-02-29", "2027-03-02"],
    ["2026-01-01", "2026-01-04"],
  ])
    assert.ok(validateSearch({ ...input, arrival, departure }, "2026-10-09"));
  assert.ok(Number.isFinite(dayNumber("2028-02-29")));
  assert.equal(
    validateSearch(
      { ...input, arrival: "2028-02-28", departure: "2028-03-02" },
      "2026-10-09",
    ),
    null,
  );
  assert.ok(validateSearch({ ...input, departure: input.arrival }));
  assert.ok(
    validateSearch({ ...input, departure: addDays(input.arrival, 31) }),
  );
  assert.ok(
    validateSearch({
      ...input,
      arrival: addDays(propertyToday(), 731),
      departure: addDays(propertyToday(), 734),
    }),
  );
  assert.equal(propertyToday(new Date("2026-10-08T22:30:00Z")), "2026-10-09");
  assert.ok(validateSearch({ ...input, adults: 11 }));
  assert.ok(validateSearch({ ...input, children: 9 }));
  assert.ok(validateSearch({ ...input, adults: 6, rooms: 1 }));
  assert.equal(validateSearch({ ...input, adults: 6, rooms: 3 }), null);
});
test("20 rooms, capacities and transparent price", () => {
  const rooms = listRooms();
  assert.equal(rooms.length, 20);
  assert.equal(
    Number(
      db().prepare("SELECT count(*) AS total FROM categories").get()!.total,
    ),
    3,
  );
  assert.equal(
    Number(db().prepare("SELECT count(*) AS total FROM extras").get()!.total),
    5,
  );
  assert.equal(
    rooms.filter((room) => room.category === "essential").length,
    10,
  );
  assert.equal(rooms.filter((room) => room.category === "signature").length, 6);
  assert.equal(rooms.filter((room) => room.category === "grand").length, 4);
  assert.throws(() =>
    allocation({ ...input, adults: 6, rooms: 2 }, rooms.slice(0, 2)),
  );
  assert.deepEqual(
    allocation(
      { ...input, adults: 3, children: 1, rooms: 2 },
      rooms.slice(0, 2),
    ).map((slot) => slot.adults + slot.children),
    [2, 2],
  );
  const total = pricing(
    input,
    [rooms[0]],
    [
      { id: "dinner", quantity: 1 },
      { id: "breakfast", quantity: 6 },
    ],
  );
  assert.equal(total.roomSubtotal, 54000);
  assert.equal(total.extrasSubtotal, 13200);
  assert.equal(total.tax, 0);
  assert.equal(total.voucher, null);
  assert.equal(total.total, 67200);
  assert.equal(total.pendingApprovalTotal, 14000);
});
test("atomic overlap, adjacent interval and idempotent retries", () => {
  const request = make();
  const booking = createBooking(request);
  assert.equal(createBooking(request).reference, booking.reference);
  assert.throws(() =>
    createBooking({
      ...request,
      guest: { name: "Other", email: "other@example.test" },
    }),
  );
  assert.throws(() => createBooking(make()));
  assert.equal(available(input).length, 19);
  assert.doesNotThrow(() =>
    createBooking(
      make({
        arrival: input.departure,
        departure: addDays(input.departure, 3),
      }),
    ),
  );
  assert.equal(getCount(), 2);
  function getCount() {
    return Number(
      db().prepare("SELECT COUNT(*) AS count FROM bookings").get()!.count,
    );
  }
});
test("multi-room persistence, guest authorization, modification conflicts and cancellation", () => {
  const booking = createBooking(
    make({ roomIds: ["S-102", "S-201"], adults: 4, children: 1, rooms: 2 }),
  );
  assert.equal(
    booking.allocations.reduce(
      (total, slot) => total + slot.adults + slot.children,
      0,
    ),
    5,
  );
  assert.throws(() => authorize(booking.reference, null));
  const guest = session(createSession("guest", booking.reference));
  assert.equal(
    authorize(booking.reference, guest).reference,
    booking.reference,
  );
  assert.throws(() =>
    authorize(booking.reference, session(createSession("guest", "different"))),
  );
  const blocker = createBooking(
    make({
      roomIds: ["S-102"],
      arrival: addDays(input.arrival, 4),
      departure: addDays(input.arrival, 7),
    }),
  );
  assert.ok(blocker.reference);
  assert.throws(() =>
    modify(
      booking.reference,
      {
        ...input,
        arrival: addDays(input.arrival, 4),
        departure: addDays(input.arrival, 7),
        adults: 4,
        children: 1,
        rooms: 2,
      },
      guest,
    ),
  );
  assert.throws(() => cancel(booking.reference, guest, false));
  assert.equal(cancel(booking.reference, guest, true).status, "cancelled");
  assert.ok(available(input).some((room) => room.id === "S-102"));
});
test("full sold-out inventory returns none", () => {
  const sold = {
    ...input,
    arrival: addDays(propertyToday(), 100),
    departure: addDays(propertyToday(), 103),
  };
  for (const room of listRooms())
    createBooking(make({ ...sold, roomIds: [room.id] }));
  assert.equal(available(sold).length, 0);
  assert.throws(() => createBooking(make({ ...sold, roomIds: ["S-301"] })));
});
test("email fallback persists preview, escapes guest text and remains readable without images", async () => {
  const booking = createBooking(
    make({
      roomIds: ["S-103"],
      guest: { name: "Alex <script>", email: "preview@example.test" },
    }),
  );
  await sendEmails(booking.reference);
  assert.equal(emailStatuses(booking.reference)[0].status, "demo-preview");
  const html = await emailHtml(
    booking,
    "confirmation",
    "https://example.test/manage",
  );
  assert.ok(html.includes("Alex &lt;script&gt;"));
  assert.ok(html.includes(booking.reference));
  assert.ok(html.includes("Simulated amount due"));
  assert.ok(html.includes("No real charge"));
  assert.ok(!html.includes("<script>"));
  await sendEmails(booking.reference);
  assert.equal(Number(emailStatuses(booking.reference)[0].attempts), 1);
});

test("room modifications reprice and record adjustment; cancellation is idempotent", () => {
  const booking = createBooking(make({ roomIds: ["S-105"] }));
  const guest = session(createSession("guest", booking.reference));
  const updated = modify(
    booking.reference,
    { ...input, rooms: 2, adults: 3, roomIds: ["S-105", "S-106"] },
    guest,
  );
  assert.equal(updated.rooms, 2);
  assert.ok(updated.pricing.total > booking.pricing.total);
  const adjustment = db()
    .prepare(
      "SELECT amount FROM payment_records WHERE reference=? AND status='demo-adjustment'",
    )
    .get(booking.reference);
  assert.equal(
    Number(adjustment!.amount),
    updated.pricing.total - booking.pricing.total,
  );
  const cancelled = cancel(booking.reference, guest, true);
  assert.equal(
    cancel(booking.reference, guest, true).version,
    cancelled.version,
  );
  assert.throws(() => modify(booking.reference, input, guest));
});
test("Resend errors persist; retries reuse the same provider key and HTML; accepted is not delivered", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM;
  process.env.RESEND_API_KEY = "mock-key";
  process.env.RESEND_FROM = "VIERCYS <sender@example.test>";
  const booking = createBooking(make({ roomIds: ["S-107"] }));
  const calls: { headers: Record<string, string>; body: string }[] = [];
  try {
    globalThis.fetch = async (_url, options) => {
      calls.push({
        headers: options?.headers as Record<string, string>,
        body: String(options?.body),
      });
      return new Response(
        JSON.stringify(
          calls.length === 1
            ? { message: "Mock rejection" }
            : { id: "provider-mocked-id" },
        ),
        {
          status: calls.length === 1 ? 429 : 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };
    await sendEmails(booking.reference);
    assert.equal(emailStatuses(booking.reference)[0].status, "failed");
    await sendEmails(booking.reference);
    assert.equal(emailStatuses(booking.reference)[0].status, "accepted");
    assert.equal(
      calls[0].headers["Idempotency-Key"],
      calls[1].headers["Idempotency-Key"],
    );
    assert.equal(calls[0].body, calls[1].body);
    await sendEmails(booking.reference);
    assert.equal(calls.length, 2);
    const html = JSON.parse(calls[0].body).html;
    const token = html.match(/token=([^"&]+)/)[1];
    const { hash } = await import("../src/lib/db");
    assert.equal(
      db()
        .prepare("SELECT email FROM lookup_tokens WHERE hash=?")
        .get(hash(token))!.email,
      "booking:" + booking.reference,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = previousFrom;
  }
});

test("voucher covers up to three Essential nights; upgrades and extra nights are charged", () => {
  const rooms = listRooms();
  const essential = rooms.find((room) => room.category === "essential")!;
  const signature = rooms.find((room) => room.category === "signature")!;
  const stay = (count: number) => ({
    ...input,
    departure: addDays(input.arrival, count),
  });
  const due = (count: number, room = essential) =>
    pricing(stay(count), [room], [], true);
  assert.equal(due(3).total, 0);
  assert.equal(due(3).voucher!.discount, 54000);
  assert.equal(due(4).total, 18000);
  assert.equal(due(5).total, 36000);
  assert.equal(due(5).voucher!.extraNights, 2);
  assert.equal(due(2).total, 0);
  assert.equal(due(2).voucher!.unusedNights, 1);
  assert.equal(due(1).voucher!.coveredNights, 1);
  // Signature: upgrade difference on every night, full rate on extra nights.
  assert.equal(due(3, signature).total, 3 * (32000 - 18000));
  assert.equal(due(3, signature).voucher!.upgradeTotal, 42000);
  assert.equal(due(5, signature).total, 5 * 32000 - 3 * 18000);
  // Voucher applies to one room only; extras are never covered.
  const twoRooms = pricing(
    { ...stay(3), adults: 4, rooms: 2 },
    [essential, rooms.filter((room) => room.category === "essential")[1]],
    [{ id: "breakfast", quantity: 2 }],
    true,
  );
  assert.equal(twoRooms.total, 54000 + 4400);
});
test("invitations are single-use, expire, and survive modification but not cancellation", () => {
  const arrival = addDays(propertyToday(), 200);
  const stay = { ...input, arrival, departure: addDays(arrival, 3) };
  const [invite] = createInvites(1, { label: "Student" });
  assert.equal(findInvite(invite.token).state, "valid");
  assert.equal(findInvite("not-a-real-token-at-all-xx").state, "invalid");
  assert.equal(findInvite(undefined).state, "invalid");
  assert.ok(!JSON.stringify(listInvites()).includes(invite.token));
  const booking = createBooking(
    make({ ...stay, roomIds: ["S-108"], inviteToken: invite.token }),
  );
  assert.equal(booking.pricing.total, 0);
  assert.ok(booking.invite_id);
  // A double-submitted request returns the same booking even once the cookie is gone.
  const [second] = createInvites(1);
  const retry = make({ ...stay, roomIds: ["S-201"], inviteToken: second.token });
  const first = createBooking(retry);
  assert.equal(
    createBooking({ ...retry, inviteToken: "" }).reference,
    first.reference,
  );
  assert.equal(findInvite(invite.token).state, "redeemed");
  assert.throws(
    () =>
      createBooking(
        make({ ...stay, roomIds: ["S-109"], inviteToken: invite.token }),
      ),
    /already been used/,
  );
  const guest = session(createSession("guest", booking.reference));
  const extended = modify(
    booking.reference,
    { ...stay, departure: addDays(arrival, 5) },
    guest,
  );
  assert.equal(extended.pricing.total, 36000);
  assert.equal(extended.pricing.voucher!.extraNights, 2);
  cancel(booking.reference, guest, true);
  assert.equal(findInvite(invite.token).state, "valid");
  const [expired] = createInvites(1, { days: 1 });
  db()
    .prepare("UPDATE invites SET expires_at=? WHERE id=?")
    .run(Date.now() - 1, expired.id);
  assert.equal(findInvite(expired.token).state, "expired");
  assert.throws(
    () =>
      createBooking(
        make({ ...stay, roomIds: ["S-110"], inviteToken: expired.token }),
      ),
    /expired/,
  );
  assert.throws(() => createInvites(0));
  assert.throws(() => createInvites(61));
});
