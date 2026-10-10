import { databaseClient, remoteDatabase } from "../src/lib/storage";
import { checkPassword, db } from "../src/lib/db";

if (!remoteDatabase())
  throw new Error("db:check requires Turso server credentials.");
const client = databaseClient();
try {
  const version = await client.execute(
    "SELECT version FROM schema_migrations ORDER BY version",
  );
  const inventory = await client.execute(
    "SELECT category,COUNT(*) AS total FROM rooms GROUP BY category",
  );
  const counts = await client.execute(
    "SELECT (SELECT COUNT(*) FROM bookings) AS reservations,(SELECT COUNT(*) FROM invites) AS invitations,(SELECT COUNT(*) FROM staff) AS staff",
  );
  const integrity = await client.execute("PRAGMA foreign_key_check");
  const account =
    process.env.VIERCYS_ADMIN_PASSWORD &&
    (await checkPassword("manager", process.env.VIERCYS_ADMIN_PASSWORD));
  console.log(
    JSON.stringify(
      {
        schemaVersions: version.rows.map((row) => Number(row.version)),
        inventory: inventory.rows.map((row) => ({
          category: row.category,
          count: Number(row.total),
        })),
        counts: counts.rows[0],
        foreignKeyViolations: integrity.rows.length,
        managerConfigured: account === "manager",
      },
      null,
      2,
    ),
  );
  if (integrity.rows.length || !account) process.exitCode = 1;
} catch {
  console.error(
    "Turso readiness check failed. Check credentials, initialization and manager configuration. No secrets or guest details are logged.",
  );
  process.exitCode = 1;
} finally {
  db().close();
}
