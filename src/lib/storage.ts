import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import {
  createClient,
  type Client,
  type Transaction,
  type InValue,
  type InStatement,
} from "@libsql/client/web";

const scope = new AsyncLocalStorage<Transaction>();
let client: Client | undefined;
let ready: Promise<void> | undefined;
let turn = Promise.resolve();
export const remoteDatabase = () => !!process.env.TURSO_DATABASE_URL;
export function databaseClient() {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url && process.env.TURSO_AUTH_TOKEN)
    throw new Error(
      "TURSO_AUTH_TOKEN requires TURSO_DATABASE_URL; refusing a silent local fallback.",
    );
  if (url) {
    if (
      !/^libsql:\/\/[a-zA-Z0-9.-]+(?::\d+)?$/.test(url) ||
      !process.env.TURSO_AUTH_TOKEN
    )
      throw new Error(
        "Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on the server.",
      );
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  } else {
    if (process.env.VERCEL)
      throw new Error("Vercel requires Turso; local file storage is disabled.");
    const path = resolve(
      /*turbopackIgnore: true*/ process.env.VIERCYS_DB_PATH ||
        "data/viercys.sqlite",
    );
    mkdirSync(dirname(path), { recursive: true });
    client = localClient(path);
  }
  return client;
}
async function ensureReady() {
  ready ??= (async () => {
    const connection = databaseClient();
    if (remoteDatabase()) {
      try {
        const result = await connection.execute(
          "SELECT version FROM schema_migrations WHERE version=2",
        );
        if (!result.rows.length) throw new Error("Missing migration");
      } catch {
        throw new Error(
          "Turso is unavailable or uninitialized. Check server credentials and run npm run db:init.",
        );
      }
    } else {
      const { initializeDatabase } = await import("./migrations");
      await initializeDatabase(connection, false);
    }
  })().catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
}

/** Existing prepared statements, now asynchronous on both local SQLite and Turso. */
export function database() {
  const execute = async (sql: string, args: InValue[]) => {
    await ensureReady();
    if (!remoteDatabase() && !scope.getStore()) await turn;
    return (scope.getStore() || databaseClient()).execute({ sql, args });
  };
  return {
    async batch(statements: InStatement[]) {
      return databaseTransaction(() => scope.getStore()!.batch(statements));
    },
    prepare(sql: string) {
      return {
        async all(...args: InValue[]) {
          return (await execute(sql, args)).rows;
        },
        async get(...args: InValue[]) {
          return (await execute(sql, args)).rows[0];
        },
        async run(...args: InValue[]) {
          const result = await execute(sql, args);
          return {
            changes: result.rowsAffected,
            lastInsertRowid: result.lastInsertRowid,
          };
        },
      };
    },
    async exec(sql: string) {
      await ensureReady();
      await (scope.getStore() || databaseClient()).executeMultiple(sql);
    },
    close() {
      client?.close();
      client = undefined;
      ready = undefined;
    },
  };
}

/** Keep the existing Node SQLite engine locally; production uses HTTP only. */
function localClient(path: string): Client {
  const connection = new DatabaseSync(path);
  connection.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  const execute = async (
    statement: string | { sql: string; args?: InValue[] },
  ) => {
    const sql = typeof statement === "string" ? statement : statement.sql;
    const args = (
      typeof statement === "string" ? [] : statement.args || []
    ) as SQLInputValue[];
    const prepared = connection.prepare(sql);
    if (prepared.columns().length)
      return { rows: prepared.all(...args), columns: [], rowsAffected: 0 };
    const result = prepared.run(...args);
    return {
      rows: [],
      columns: [],
      rowsAffected: Number(result.changes),
      lastInsertRowid: result.lastInsertRowid,
    };
  };
  const batch = async (
    statements: (string | { sql: string; args?: InValue[] })[],
  ) => {
    const results = [];
    for (const statement of statements) results.push(await execute(statement));
    return results;
  };
  return {
    execute,
    executeMultiple: async (sql: string) => {
      connection.exec(sql);
    },
    async transaction() {
      connection.exec("BEGIN IMMEDIATE");
      let closed = false;
      return {
        execute,
        batch,
        executeMultiple: async (sql: string) => {
          connection.exec(sql);
        },
        get closed() {
          return closed;
        },
        async commit() {
          connection.exec("COMMIT");
          closed = true;
        },
        async rollback() {
          connection.exec("ROLLBACK");
          closed = true;
        },
        close() {
          if (!closed) {
            connection.exec("ROLLBACK");
            closed = true;
          }
        },
      };
    },
    close() {
      connection.close();
    },
  } as unknown as Client;
}
export async function databaseTransaction<T>(
  fn: () => T | Promise<T>,
): Promise<T> {
  await ensureReady();
  if (scope.getStore()) return fn();
  // Local requests share a process, but never share a transaction. Turso also
  // obtains a primary write lock across independent Vercel instances.
  const previous = turn;
  let release!: () => void;
  turn = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  let tx: Transaction | undefined;
  try {
    tx = await databaseClient().transaction("write");
    const result = await scope.run(tx, fn);
    await tx.commit();
    return result;
  } catch (error) {
    if (tx && !tx.closed) await tx.rollback().catch(() => {});
    throw error;
  } finally {
    tx?.close();
    release();
  }
}
