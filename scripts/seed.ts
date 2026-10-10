import { db, listRooms } from "../src/lib/db";
if (process.env.TURSO_DATABASE_URL || process.env.VERCEL)
  throw new Error(
    "Use npm run db:init for Turso. The local seed command does not initialize remote databases.",
  );
console.log(
  `Seed complete: ${(await listRooms()).length} physical Santorini rooms. Local DB: ${process.env.VIERCYS_DB_PATH || "data/viercys.sqlite"}`,
);
console.log(
  "Local demo staff credentials are in data/demo-staff.json. Keep that file private.",
);
db().close();
