import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const directory = mkdtempSync(join(tmpdir(), "viercys-storage-"));
process.env.VIERCYS_DB_PATH = join(directory, "test.sqlite");
process.env.VIERCYS_DEMO_MODE = "true";
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
const { db, transaction, demoEnabled, staffAccessEnabled } =
  await import("../src/lib/db");
const { createBooking, getBooking } = await import("../src/lib/booking");
const { createInvites, listInvites } = await import("../src/lib/invites");
const { propertyToday, addDays } = await import("../src/lib/policy");
after(() => {
  db().close();
  rmSync(directory, { recursive: true, force: true });
});
test("additive initialization and reopening preserve reservations, invitations and inventory", async () => {
  const arrival = addDays(propertyToday(), 100);
  const booking = await createBooking({
    arrival,
    departure: addDays(arrival, 2),
    adults: 2,
    children: 0,
    rooms: 1,
    roomIds: ["S-101"],
    guest: { name: "Persistence Test", email: "persistence@example.test" },
    consent: true,
    idempotencyKey: randomUUID(),
  });
  await createInvites(1, { label: "Persistence test" });
  db().close();
  assert.equal(
    (await getBooking(booking.reference))?.reference,
    booking.reference,
  );
  assert.equal((await listInvites()).length, 1);
  assert.equal(
    Number(
      (await db().prepare("SELECT COUNT(*) AS count FROM rooms").get())!.count,
    ),
    20,
  );
  assert.equal(
    Number(
      (await db()
        .prepare("SELECT COUNT(*) AS count FROM schema_migrations")
        .get())!.count,
    ),
    1,
  );
});
test("async transaction context rolls back all writes and keeps other requests outside its scope", async () => {
  await assert.rejects(
    transaction(async () => {
      await db()
        .prepare("INSERT INTO guests VALUES(?,?,?)")
        .run("rollback@example.test", "Rollback Test", "");
      await Promise.resolve();
      throw new Error("Intentional rollback");
    }),
  );
  assert.equal(
    await db()
      .prepare("SELECT email FROM guests WHERE email=?")
      .get("rollback@example.test"),
    undefined,
  );
  const count = Number(
    (await db().prepare("SELECT COUNT(*) AS count FROM guests").get())!.count,
  );
  await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      transaction(async () => {
        await db()
          .prepare("INSERT INTO guests VALUES(?,?,?)")
          .run(`scope-${index}@example.test`, "Scope Test", "");
      }),
    ),
  );
  assert.equal(
    Number(
      (await db().prepare("SELECT COUNT(*) AS count FROM guests").get())!.count,
    ),
    count + 8,
  );
});
test("Vercel cannot use development accounts or writable file fallback", async () => {
  db().close();
  const before = readdirSync(directory).sort();
  process.env.VERCEL = "1";
  const password = process.env.VIERCYS_ADMIN_PASSWORD;
  delete process.env.VIERCYS_ADMIN_PASSWORD;
  try {
    assert.equal(demoEnabled(), false);
    assert.equal(staffAccessEnabled(), false);
    await assert.rejects(
      db().prepare("SELECT 1").get(),
      /Vercel requires Turso/,
    );
    assert.deepEqual(readdirSync(directory).sort(), before);
    process.env.VIERCYS_ADMIN_PASSWORD = "short-dev-password".slice(0, 12);
    assert.equal(staffAccessEnabled(), false);
  } finally {
    delete process.env.VERCEL;
    if (password === undefined) delete process.env.VIERCYS_ADMIN_PASSWORD;
    else process.env.VIERCYS_ADMIN_PASSWORD = password;
  }
});
