import { connection } from "next/server";
import { BookingShell, DetailsStep } from "@/components/booking-flow";
import { searchFrom, searchQuery } from "@/lib/policy";
export const metadata = { title: "Review and confirm | VIERCYS Santorini" };
export default async function DetailsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const search = searchFrom(params);
  return (
    <BookingShell
      step={2}
      title="Review and confirm."
      back={{ href: "/book/rooms?" + searchQuery(search), label: "Rooms" }}
    >
      <DetailsStep
        search={search}
        roomIds={(params.roomIds || "").split(",").filter(Boolean)}
      />
    </BookingShell>
  );
}
