import { databaseClient, remoteDatabase } from "../src/lib/storage";
import { migrateClassInvitations } from "../src/lib/migrations";

if (!remoteDatabase())
  throw new Error(
    "This upgrade requires the existing Turso credentials. Local databases upgrade on first use.",
  );
const client = databaseClient();
try {
  // Compare counts only: no private guest rows or credentials are logged/read.
  const counts = async () =>
    (
      await client.execute(
        "SELECT (SELECT COUNT(*) FROM bookings) AS bookings,(SELECT COUNT(*) FROM invites) AS invites,(SELECT COUNT(*) FROM rooms) AS rooms,(SELECT COUNT(*) FROM staff) AS staff",
      )
    ).rows[0];
  const before = await counts();
  await migrateClassInvitations(client);
  const after = await counts();
  const violations = (await client.execute("PRAGMA foreign_key_check")).rows
    .length;
  console.log(
    JSON.stringify(
      {
        schemaVersion: 2,
        before,
        after,
        foreignKeyViolations: violations,
        note: "Only shared invitation tables, indexes, triggers and migration version added. Existing records and staff credentials untouched.",
      },
      null,
      2,
    ),
  );
  if (violations) process.exitCode = 1;
} catch {
  console.error(
    "Shared invitation migration failed. Existing schema is required; check credentials and connectivity. No secrets are logged.",
  );
  process.exitCode = 1;
} finally {
  client.close();
}
