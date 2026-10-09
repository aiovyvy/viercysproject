import { connection } from "next/server";
import { BookingShell, RoomsStep } from "@/components/booking-flow";
import { searchFrom, searchQuery, validateSearch } from "@/lib/policy";
export const metadata = { title: "Choose a room | VIERCYS Santorini" };
export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const search = searchFrom(await searchParams);
  return (
    <BookingShell
      step={1}
      title="Choose your room."
      back={{ href: "/book?" + searchQuery(search), label: "Dates & guests" }}
    >
      <RoomsStep search={search} initialError={validateSearch(search)} />
    </BookingShell>
  );
}
