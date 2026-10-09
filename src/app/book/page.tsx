import { connection } from "next/server";
import { BookingShell, DatesStep } from "@/components/booking-flow";
import { searchFrom } from "@/lib/policy";
export const metadata = { title: "Book your stay | VIERCYS Santorini" };
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  return (
    <BookingShell
      step={0}
      title="Choose your dates."
      back={{ href: "/", label: "Home" }}
    >
      <DatesStep initial={searchFrom(await searchParams)} />
    </BookingShell>
  );
}
