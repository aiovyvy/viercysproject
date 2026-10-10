import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { type Room } from "./catalog";
import { database, databaseTransaction, remoteDatabase } from "./storage";
export const demoEnabled = () =>
  !process.env.VERCEL &&
  !remoteDatabase() &&
  (process.env.NODE_ENV !== "production" ||
    process.env.VIERCYS_DEMO_MODE === "true");
export const staffAccessEnabled = () =>
  demoEnabled() ||
  (process.env.VIERCYS_ADMIN_PASSWORD?.length || 0) >=
    (remoteDatabase() || process.env.VERCEL ? 16 : 12);
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export const db = database;
export const transaction = databaseTransaction;
export async function seedStaff(
  username: string,
  password: string,
  role: "staff" | "manager",
) {
  const salt = randomBytes(16).toString("hex");
  await db()
    .prepare("INSERT OR REPLACE INTO staff VALUES(?,?,?,?)")
    .run(username, salt, scryptSync(password, salt, 64).toString("hex"), role);
}
export async function checkPassword(username: string, password: string) {
  const row = (await db()
    .prepare("SELECT * FROM staff WHERE username=?")
    .get(username)) as unknown as
    | {
        salt: string;
        password_hash: string;
        role: string;
      }
    | undefined;
  const salt = row?.salt || "unrecognized-account";
  const actual = scryptSync(password.slice(0, 300), salt, 64);
  return row && timingSafeEqual(actual, Buffer.from(row.password_hash, "hex"))
    ? row.role
    : null;
}
export async function listRooms() {
  return (await db()
    .prepare("SELECT * FROM rooms ORDER BY number")
    .all()) as unknown as Room[];
}
export type Session = {
  kind: "guest" | "admin";
  subject: string;
  verified: number;
  role?: string;
};
export async function createSession(
  kind: Session["kind"],
  subject: string,
  verified = false,
  role?: string,
) {
  const token = randomBytes(32).toString("base64url");
  await db()
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
export async function session(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;
  return (
    ((await db()
      .prepare("SELECT * FROM sessions WHERE hash=? AND expires>?")
      .get(hash(token), Date.now())) as unknown as Session | undefined) ?? null
  );
}
// Failure-only throttling. A classroom shares one campus IP and often no
// proxy header, so the primary key is an anonymous per-device cookie; IP and
// per-account buckets are generous backstops. Successful requests never count.
export const THROTTLE_WINDOW_MS = 15 * 60000;
export type Bucket = [key: string, limit: number];
export async function throttled(buckets: Bucket[]) {
  const now = Date.now();
  const rows = await Promise.all(
    buckets.map(async ([key, limit]) => {
      const row = await db()
        .prepare("SELECT count,reset FROM rate_limits WHERE key=?")
        .get(key);
      return !!row && Number(row.reset) > now && Number(row.count) >= limit;
    }),
  );
  return rows.some(Boolean);
}
export async function recordFailure(buckets: Bucket[]) {
  const now = Date.now();
  await db().batch(
    buckets.map(([key]) => ({
      sql: "INSERT INTO rate_limits(key,count,reset) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset<=? THEN 1 ELSE count+1 END,reset=CASE WHEN reset<=? THEN excluded.reset ELSE reset END",
      args: [key, now + THROTTLE_WINDOW_MS, now, now],
    })),
  );
}
export async function clearFailures(key: string) {
  await db().prepare("DELETE FROM rate_limits WHERE key=?").run(key);
}
export const THROTTLE_MESSAGE =
  "Too many unsuccessful attempts from this device. Please wait 15 minutes and try again.";
