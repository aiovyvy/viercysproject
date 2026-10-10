import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
const directory = mkdtempSync(join(tmpdir(), "viercys-class-"));
process.env.VIERCYS_DB_PATH = join(directory, "class.sqlite");
process.env.VIERCYS_DEMO_MODE = "true";
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
const { db } = await import("../src/lib/db");
const {
  createCampaign,
  registerClass,
  listCampaigns,
  pauseCampaign,
  findCampaign,
} = await import("../src/lib/class-invites");
const { createBooking, emailStatuses, cancel, modify } =
  await import("../src/lib/booking");
const { propertyToday, addDays } = await import("../src/lib/policy");
after(() => {
  db().close();
  rmSync(directory, { recursive: true, force: true });
});
const campaign = (limit = 30, roster = "") =>
  createCampaign({
    name: "HCI Verification",
    limit,
    expires: new Date(Date.now() + 86400000).toISOString(),
    active: true,
    roster,
  });
const register = (token: string, identifier: string, credential = "") =>
  registerClass({
    token,
    identifier,
    credential,
    name: "Classroom Guest",
    email: "",
  });
function booking(token: string, room: string, day: number, changes = {}) {
  const arrival = addDays(propertyToday(), day);
  return {
    arrival,
    departure: addDays(arrival, 3),
    rooms: 1,
    adults: 2,
    children: 0,
    roomIds: [room],
    guest: { name: "Classroom Guest", email: "" },
    consent: true,
    idempotencyKey: randomUUID(),
    inviteToken: token,
    ...changes,
  };
}
test("visits and registrations do not consume campaign places; blank email works with existing confirmation", async () => {
  const c = await campaign();
  for (let i = 0; i < 4; i++) assert.ok(await findCampaign(c.token));
  const claim = await register(c.token, "STUDENT-001");
  assert.equal((await findCampaign(c.token))!.redemptions, 0);
  const input = booking(claim.token, "S-101", 200);
  const saved = await createBooking(input);
  assert.equal(saved.pricing.total, 0);
  assert.equal((await emailStatuses(saved.reference)).length, 0);
  assert.equal((await createBooking(input)).reference, saved.reference);
  assert.equal(
    (await createBooking({ ...input, inviteToken: "" })).reference,
    saved.reference,
  );
  assert.equal((await findCampaign(c.token))!.redemptions, 1);
});
test("simultaneous last-place submissions never exceed the limit and failed claims roll back", async () => {
  const c = await campaign(1);
  const a = await register(c.token, "LAST-A"),
    b = await register(c.token, "LAST-B");
  const results = await Promise.allSettled([
    createBooking(booking(a.token, "S-102", 210)),
    createBooking(booking(b.token, "S-103", 210)),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await findCampaign(c.token))!.redemptions, 1);
  const count = await db()
    .prepare("SELECT COUNT(*) AS n FROM bookings WHERE arrival=?")
    .get(addDays(propertyToday(), 210));
  assert.equal(Number(count!.n), 1);
  await assert.rejects(register(c.token, "LAST-C"), /All invitations/);
});
test("normalized student identifiers cannot redeem twice, even from two independently registered vouchers", async () => {
  const c = await campaign();
  const a = await register(c.token, "  student-002 "),
    b = await register(c.token, "STUDENT-002");
  const results = await Promise.allSettled([
    createBooking(booking(a.token, "S-104", 220)),
    createBooking(booking(b.token, "S-105", 220)),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await findCampaign(c.token))!.redemptions, 1);
  await assert.rejects(register(c.token, "student-002"), /already claimed/);
});
test("overlapping physical rooms produce one booking and consume only one place; failed participant can retry", async () => {
  const c = await campaign();
  const a = await register(c.token, "ROOM-A"),
    b = await register(c.token, "ROOM-B");
  const inputs = [
    booking(a.token, "S-106", 230),
    booking(b.token, "S-106", 230),
  ];
  const results = await Promise.allSettled(
    inputs.map((input) => createBooking(input)),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await findCampaign(c.token))!.redemptions, 1);
  const lost = results.findIndex((r) => r.status === "rejected");
  await createBooking({ ...inputs[lost], roomIds: ["S-107"] });
  assert.equal((await findCampaign(c.token))!.redemptions, 2);
});
test("paused and expired campaigns reject pending registrations and confirmed checkouts", async () => {
  const c = await campaign();
  const claim = await register(c.token, "PAUSED-A");
  await pauseCampaign(c.id, false);
  await assert.rejects(register(c.token, "PAUSED-B"), /paused/);
  await assert.rejects(
    createBooking(booking(claim.token, "S-108", 240)),
    /paused, expired or fully/,
  );
  await pauseCampaign(c.id, true);
  await db()
    .prepare("UPDATE class_campaigns SET expires_at=? WHERE id=?")
    .run(Date.now() - 1000, c.id);
  await assert.rejects(register(c.token, "EXPIRED-A"), /expired/);
  await assert.rejects(
    createBooking(booking(claim.token, "S-108", 240)),
    /paused, expired or fully/,
  );
  assert.equal((await findCampaign(c.token))!.redemptions, 0);
});
test("roster requires matching private code; guests cannot use another identifier's code", async () => {
  const c = await campaign(30, "ROSTER-A\nROSTER-B");
  await assert.rejects(register(c.token, "ROSTER-A"), /private claim code/);
  await assert.rejects(
    register(c.token, "OUTSIDER", c.credentials[0].code),
    /private claim code/,
  );
  await assert.rejects(
    register(c.token, "ROSTER-B", c.credentials[0].code),
    /private claim code/,
  );
  assert.ok(await register(c.token, "roster-a", c.credentials[0].code));
  const row = await db()
    .prepare("SELECT * FROM class_roster WHERE campaign_id=? LIMIT 1")
    .get(c.id);
  assert.ok(!JSON.stringify(row).includes(c.credentials[0].code));
  assert.ok(!JSON.stringify(await listCampaigns()).includes(c.token));
});
test("class vouchers enforce exactly three nights, one room, and retain one-use policy after cancellation", async () => {
  const c = await campaign();
  const claim = await register(c.token, "RULES-A");
  const input = booking(claim.token, "S-109", 250);
  await assert.rejects(
    createBooking({ ...input, departure: addDays(input.arrival, 4) }),
    /exactly three nights/,
  );
  await assert.rejects(
    createBooking({ ...input, rooms: 2, roomIds: ["S-109", "S-110"] }),
    /exactly three nights/,
  );
  assert.equal((await findCampaign(c.token))!.redemptions, 0);
  const saved = await createBooking(input);
  const auth = {
    kind: "admin",
    subject: "manager",
    verified: 1,
    role: "manager",
  } as const;
  await assert.rejects(
    modify(
      saved.reference,
      { ...input, departure: addDays(input.arrival, 4) },
      auth,
    ),
    /remain exactly/,
  );
  await cancel(saved.reference, auth, true);
  await assert.rejects(register(c.token, "RULES-A"), /already claimed/);
  assert.equal((await findCampaign(c.token))!.redemptions, 1);
});
test("database itself rejects duplicate students and full campaigns", async () => {
  const c = await campaign(1);
  const claim = await register(c.token, "DB-A");
  await createBooking(booking(claim.token, "S-110", 260));
  const redemption = await db()
    .prepare("SELECT * FROM class_redemptions WHERE campaign_id=?")
    .get(c.id);
  await assert.rejects(
    db()
      .prepare(
        "INSERT INTO class_redemptions(campaign_id,student_hash,invite_id,reference) VALUES(?,?,?,?)",
      )
      .run(
        c.id,
        redemption!.student_hash,
        redemption!.invite_id,
        redemption!.reference,
      ),
  );
  assert.equal((await findCampaign(c.token))!.redemptions, 1);
});
