import { rmSync } from "node:fs";
import { resolve } from "node:path";
// Classroom reset: removes the demo database (and its WAL/SHM files), then
// recreates the 20 rooms and a fresh manager password. Stop the server first.
const path = resolve(process.env.VIERCYS_DB_PATH || "data/viercys.sqlite");
for (const suffix of ["", "-wal", "-shm"])
  rmSync(path + suffix, { force: true });
const { db, listRooms } = await import("../src/lib/db");
console.log(
  `Reset complete: ${listRooms().length} rooms, no bookings or invitations. DB: ${path}`,
);
console.log(
  process.env.VIERCYS_ADMIN_PASSWORD
    ? "Staff password: VIERCYS_ADMIN_PASSWORD from your environment."
    : `New staff password written to ${path.endsWith("viercys.sqlite") ? "data/demo-staff.json" : path.replace(/\.sqlite$/, "-staff.json")}. Keep it private.`,
);
db().close();
