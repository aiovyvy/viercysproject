import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Shell } from "@/components/journey";
import { Photo } from "@/app/experience";
import { category, money } from "@/lib/catalog";
import { searchFrom, searchQuery, validateSearch } from "@/lib/policy";
import { available } from "@/lib/booking";
export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const id = (await params).category;
  const room = category(id);
  if (!room) notFound();
  const search = searchFrom(await searchParams);
  const error = validateSearch(search);
  const remaining = error
    ? null
    : available(search).filter((item) => item.category === id).length;
  return (
    <Shell
      title={room.name}
      back={{ href: "/book/rooms?" + searchQuery(search), label: "Rooms" }}
    >
      <p className="lead">{room.description}</p>
      <div className="j-room-photo" style={{ height: 450 }}>
        <Photo
          src={room.photo}
          alt={`${room.name} editorial architectural inspiration`}
          priority
        />
      </div>
      <p className="j-note">
        Editorial photography, not actual photographs of the fictional property.
      </p>
      <div className="j-grid">
        <div>
          <h2>Your space</h2>
          <p>
            {room.size} m² · {room.view}
            <br />
            Up to {room.capacity} guests, including children
            <br />
            {room.inventory} physical rooms in this category
            <br />
            {remaining === null
              ? "Choose valid dates to check availability"
              : `${remaining} rooms available on selected dates`}
          </p>
        </div>
        <div>
          <h2>Considered details</h2>
          <ul>
            {room.amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Sample nightly rate</h2>
          <p>
            {money(room.rate)} per night, taxes included. All extras are
            optional.
          </p>
          <p>
            Online cancellation until two calendar days before arrival. No real
            charges.
          </p>
        </div>
      </div>
      <div className="j-grid">
        {[
          "/images/suite.jpg",
          "/images/architecture.jpg",
          "/images/santorini.jpg",
        ].map((photo, index) => (
          <div key={photo} className="j-room-photo">
            <Photo
              src={photo}
              alt={
                [
                  "Interior inspiration",
                  "Architectural setting inspiration",
                  "Santorini island setting",
                ][index]
              }
            />
          </div>
        ))}
      </div>
      <Link className="j-button" href={"/book/rooms?" + searchQuery(search)}>
        See prices for your dates
      </Link>
    </Shell>
  );
}
