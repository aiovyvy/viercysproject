// Opt-in live test helper: independent Node processes model Vercel instances.
import { readFileSync } from "node:fs";
import { createBooking } from "../src/lib/booking";
import { db } from "../src/lib/db";
try {
  const booking = await createBooking(JSON.parse(readFileSync(0, "utf8")));
  process.stdout.write(
    JSON.stringify({ saved: true, reference: booking.reference }),
  );
} catch {
  process.stdout.write(JSON.stringify({ saved: false }));
} finally {
  db().close();
}
