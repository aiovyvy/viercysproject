import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { CATEGORIES, EXTRAS, type Room } from "./catalog";
let singleton: DatabaseSync | undefined;
export const demoEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.VIERCYS_DEMO_MODE === "true";
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function db() {
  if (singleton) return singleton;
  const path = resolve(
    /*turbopackIgnore: true*/ process.env.VIERCYS_DB_PATH ||
      "data/viercys.sqlite",
  );
  mkdirSync(dirname(path), { recursive: true });
  const connection = new DatabaseSync(path);
  connection.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
  connection.exec(readFileSync(resolve("database/sqlite.sql"), "utf8"));
  for (const category of CATEGORIES)
    connection
      .prepare("INSERT OR IGNORE INTO categories VALUES(?,?,?,?,?,?,?,?,?,?,?)")
      .run(
        category.id,
        category.name,
        category.tier,
        category.capacity,
        category.inventory,
        category.rate,
        category.size,
        category.view,
        category.description,
        category.photo,
        JSON.stringify(category.amenities),
      );
  for (const extra of EXTRAS)
    connection
      .prepare("INSERT OR IGNORE INTO extras VALUES(?,?,?,?,?)")
      .run(extra.id, extra.name, extra.price, extra.status, extra.unit);
  const insert = connection.prepare(
    "INSERT OR IGNORE INTO rooms(id,number,category,capacity,rate) VALUES(?,?,?,?,?)",
  );
  CATEGORIES.forEach((cat, index) => {
    for (let n = 1; n <= cat.inventory; n++) {
      const number = String((index + 1) * 100 + n);
      insert.run("S-" + number, number, cat.id, cat.capacity, cat.rate);
    }
  });
  const addColumn = (table: string, column: string, definition: string) => {
    if (
      !connection
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .some((row) => row.name === column)
    )
      connection.exec(
        `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
      );
  };
  addColumn("email_attempts", "claimed_at", "INTEGER NOT NULL DEFAULT 0");
  addColumn("bookings", "invite_id", "TEXT REFERENCES invites(id)");
  singleton = connection;
  const password = process.env.VIERCYS_ADMIN_PASSWORD;
  if (password && password.length >= 12)
    seedStaff("manager", password, "manager");
  else if (
    demoEnabled() &&
    !connection.prepare("SELECT username FROM staff LIMIT 1").get()
  ) {
    const generated = randomBytes(18).toString("base64url");
    seedStaff("manager", generated, "manager");
    // A fresh database always gets a fresh password, so the file is rewritten
    // on every generation; otherwise a reset left a stale, unusable password.
    // Non-default databases get their own file so they never clobber it.
    const base = basename(path).replace(/\.sqlite$/, "");
    const credentials = resolve(
      dirname(path),
      base === "viercys" ? "demo-staff.json" : `${base}-staff.json`,
    );
    writeFileSync(
      credentials,
      JSON.stringify(
        {
          username: "manager",
          password: generated,
          note: "Local demo only; keep private. Production requires VIERCYS_ADMIN_PASSWORD (12+ chars).",
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
  }
  return connection;
}
export function seedStaff(
  username: string,
  password: string,
  role: "staff" | "manager",
) {
  const salt = randomBytes(16).toString("hex");
  db()
    .prepare("INSERT OR REPLACE INTO staff VALUES(?,?,?,?)")
    .run(username, salt, scryptSync(password, salt, 64).toString("hex"), role);
}
export function checkPassword(username: string, password: string) {
  const row = db()
    .prepare("SELECT * FROM staff WHERE username=?")
    .get(username) as
    { salt: string; password_hash: string; role: string } | undefined;
  const salt = row?.salt || "unrecognized-account";
  const actual = scryptSync(password.slice(0, 300), salt, 64);
  return row && timingSafeEqual(actual, Buffer.from(row.password_hash, "hex"))
    ? row.role
    : null;
}
export function transaction<T>(fn: () => T) {
  const connection = db();
  connection.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    connection.exec("COMMIT");
    return result;
  } catch (error) {
    connection.exec("ROLLBACK");
    throw error;
  }
}
export function listRooms() {
  return db()
    .prepare("SELECT * FROM rooms ORDER BY number")
    .all() as unknown as Room[];
}
export type Session = {
  kind: "guest" | "admin";
  subject: string;
  verified: number;
  role?: string;
};
export function createSession(
  kind: Session["kind"],
  subject: string,
  verified = false,
  role?: string,
) {
  const token = randomBytes(32).toString("base64url");
  db()
    .prepare("INSERT INTO sessions VALUES(?,?,?,?,?,?)")
    .run(
      hash(token),
      kind,
      subject,
      verified ? 1 : 0,
      role || null,
      Date.now() + 14 * 86400000,
    );
  return token;
}
export function session(token: string | undefined): Session | null {
  if (!token) return null;
  return (
    (db()
      .prepare("SELECT * FROM sessions WHERE hash=? AND expires>?")
      .get(hash(token), Date.now()) as Session | undefined) ?? null
  );
}
// Failure-only throttling. A classroom shares one campus IP and often no
// proxy header, so the primary key is an anonymous per-device cookie; IP and
// per-account buckets are generous backstops. Successful requests never count.
export const THROTTLE_WINDOW_MS = 15 * 60000;
export type Bucket = [key: string, limit: number];
export function throttled(buckets: Bucket[]) {
  const now = Date.now();
  const read = db().prepare("SELECT count,reset FROM rate_limits WHERE key=?");
  return buckets.some(([key, limit]) => {
    const row = read.get(key) as { count: number; reset: number } | undefined;
    return !!row && row.reset > now && row.count >= limit;
  });
}
export function recordFailure(buckets: Bucket[]) {
  const now = Date.now();
  for (const [key] of buckets) {
    const row = db()
      .prepare("SELECT reset FROM rate_limits WHERE key=?")
      .get(key) as { reset: number } | undefined;
    if (!row || row.reset <= now)
      db()
        .prepare("INSERT OR REPLACE INTO rate_limits VALUES(?,?,?)")
        .run(key, 1, now + THROTTLE_WINDOW_MS);
    else
      db().prepare("UPDATE rate_limits SET count=count+1 WHERE key=?").run(key);
  }
}
export function clearFailures(key: string) {
  db().prepare("DELETE FROM rate_limits WHERE key=?").run(key);
}
export const THROTTLE_MESSAGE =
  "Too many unsuccessful attempts from this device. Please wait 15 minutes and try again.";
