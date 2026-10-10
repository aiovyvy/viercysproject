import { databaseClient, remoteDatabase } from "../src/lib/storage";
import { initializeDatabase } from "../src/lib/migrations";

if (!remoteDatabase())
  throw new Error(
    "db:init requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. Use npm run seed for local SQLite.",
  );
const client = databaseClient();
try {
  await initializeDatabase(client, true);
  const counts = await client.execute(
    "SELECT category,COUNT(*) AS total FROM rooms GROUP BY category",
  );
  console.log(
    "Turso initialized safely. Existing records preserved. Inventory:",
    counts.rows.map((row) => ({
      category: row.category,
      rooms: Number(row.total),
    })),
  );
  console.log(
    process.env.VIERCYS_ADMIN_PASSWORD
      ? "Manager credentials configured from server environment."
      : "No production staff credentials created. Set a private VIERCYS_ADMIN_PASSWORD (16+ characters) and run db:init again before enabling staff access.",
  );
} catch {
  console.error(
    "Database initialization failed. Check credentials, connectivity, inventory and staff password requirements. No secrets or provider error details are logged.",
  );
  process.exitCode = 1;
} finally {
  client.close();
}
