import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Client, Transaction, InStatement } from "@libsql/client";
import { CATEGORIES, EXTRAS } from "./catalog";
import { CLASS_INVITATION_SCHEMA } from "./class-invite-schema";

export async function initializeDatabase(client: Client, remote: boolean) {
  const tx = await client.transaction("write");
  try {
    await tx.executeMultiple(
      readFileSync(resolve("database/sqlite.sql"), "utf8"),
    );
    // Existing local records are upgraded additively, never replaced.
    for (const [table, column, definition] of [
      ["email_attempts", "claimed_at", "INTEGER NOT NULL DEFAULT 0"],
      ["bookings", "invite_id", "TEXT REFERENCES invites(id)"],
    ]) {
      const info = await tx.execute(`PRAGMA table_info(${table})`);
      if (!info.rows.some((row) => row.name === column))
        await tx.execute(
          `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
        );
    }
    await tx.executeMultiple(CLASS_INVITATION_SCHEMA);
    const seeds: InStatement[] = [];
    for (const category of CATEGORIES) {
      seeds.push({
        sql: "INSERT OR IGNORE INTO categories VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        args: [
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
        ],
      });
    }
    for (const extra of EXTRAS)
      seeds.push({
        sql: "INSERT OR IGNORE INTO extras VALUES(?,?,?,?,?)",
        args: [extra.id, extra.name, extra.price, extra.status, extra.unit],
      });
    for (const [index, category] of CATEGORIES.entries())
      for (let n = 1; n <= category.inventory; n++) {
        const number = String((index + 1) * 100 + n);
        seeds.push({
          sql: "INSERT OR IGNORE INTO rooms(id,number,category,capacity,rate) VALUES(?,?,?,?,?)",
          args: [
            "S-" + number,
            number,
            category.id,
            category.capacity,
            category.rate,
          ],
        });
      }
    await tx.batch(seeds);
    await tx.execute(
      "CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    );
    await tx.execute(
      "INSERT OR IGNORE INTO schema_migrations(version) VALUES(1),(2)",
    );
    const counts = await tx.execute(
      "SELECT category,COUNT(*) AS total FROM rooms GROUP BY category",
    );
    if (
      counts.rows.length !== 3 ||
      CATEGORIES.some(
        (cat) =>
          Number(counts.rows.find((row) => row.category === cat.id)?.total) !==
          cat.inventory,
      )
    )
      throw new Error(
        "Inventory differs from the expected 20 rooms. Initialization stopped without changing existing data.",
      );
    const password = process.env.VIERCYS_ADMIN_PASSWORD;
    const minLength = remote ? 16 : 12;
    if (password && password.length >= minLength)
      await initializeStaff(tx, password);
    else if (remote && password)
      throw new Error(
        "Production staff password must contain at least 16 characters.",
      );
    else if (
      !remote &&
      (process.env.NODE_ENV !== "production" ||
        process.env.VIERCYS_DEMO_MODE === "true") &&
      !(await tx.execute("SELECT username FROM staff LIMIT 1")).rows.length
    ) {
      const generated = randomBytes(18).toString("base64url");
      await initializeStaff(tx, generated);
      const path = resolve(
        /*turbopackIgnore: true*/ process.env.VIERCYS_DB_PATH ||
          "data/viercys.sqlite",
      );
      const base = basename(path).replace(/\.sqlite$/, "");
      writeFileSync(
        resolve(
          /*turbopackIgnore: true*/ dirname(path),
          base === "viercys" ? "demo-staff.json" : `${base}-staff.json`,
        ),
        JSON.stringify(
          {
            username: "manager",
            password: generated,
            note: "Local development only. Never upload this file.",
          },
          null,
          2,
        ),
        { mode: 0o600 },
      );
    }
    await tx.commit();
  } catch (error) {
    if (!tx.closed) await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
async function initializeStaff(tx: Transaction, password: string) {
  const existing = (
    await tx.execute(
      "SELECT salt,password_hash FROM staff WHERE username='manager'",
    )
  ).rows[0];
  if (
    existing &&
    timingSafeEqual(
      scryptSync(password, String(existing.salt), 64),
      Buffer.from(String(existing.password_hash), "hex"),
    )
  )
    return;
  if (existing)
    await tx.execute(
      "DELETE FROM sessions WHERE kind='admin' AND subject='manager'",
    );
  const salt = randomBytes(16).toString("hex");
  await tx.execute({
    sql: "INSERT INTO staff VALUES(?,?,?,?) ON CONFLICT(username) DO UPDATE SET salt=excluded.salt,password_hash=excluded.password_hash,role=excluded.role",
    args: [
      "manager",
      salt,
      scryptSync(password, salt, 64).toString("hex"),
      "manager",
    ],
  });
}

/** Explicit remote upgrade; intentionally does not seed or change staff credentials. */
export async function migrateClassInvitations(client: Client) {
  const tx = await client.transaction("write");
  try {
    const initialized = await tx.execute(
      "SELECT version FROM schema_migrations WHERE version=1",
    );
    if (!initialized.rows.length)
      throw new Error("Initialize the base database first.");
    await tx.executeMultiple(CLASS_INVITATION_SCHEMA);
    await tx.execute(
      "INSERT OR IGNORE INTO schema_migrations(version) VALUES(2)",
    );
    await tx.commit();
  } catch (error) {
    if (!tx.closed) await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
