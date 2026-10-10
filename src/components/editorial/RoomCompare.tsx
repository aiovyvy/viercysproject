import Link from "next/link";
import { CATEGORIES, money } from "@/lib/catalog";
import styles from "./compare.module.css";

type Category = (typeof CATEGORIES)[number];

const ROWS: [string, (room: Category) => string][] = [
  ["Space", (room) => `${room.size} m²`],
  ["View", (room) => room.view],
  ["Sleeps", (room) => `Up to ${room.capacity}`],
  [
    "Beds",
    (room) => room.amenities.filter((item) => /bed/i.test(item)).join(" + "),
  ],
  [
    "Outdoors",
    (room) => room.amenities.find((item) => /terrace/i.test(item)) ?? "—",
  ],
  ["Per night", (room) => money(room.rate)],
];

/**
 * All three room types side by side, read straight from the catalog. The
 * current room (if any) is highlighted; the others link to their pages and
 * keep the guest's dates in `query`.
 */
export function RoomCompare({
  current,
  query = "",
}: {
  current?: string;
  query?: string;
}) {
  const suffix = query ? `?${query}` : "";
  return (
    <div
      className={styles.wrap}
      tabIndex={0}
      role="region"
      aria-label="Room comparison, scrolls sideways on small screens"
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <td />
            {CATEGORIES.map((room) => (
              <th
                key={room.id}
                scope="col"
                aria-current={room.id === current ? "page" : undefined}
              >
                {room.id === current ? (
                  <>
                    {room.name}
                    <small>You are viewing</small>
                  </>
                ) : (
                  <Link href={`/rooms/${room.id}${suffix}`}>{room.name}</Link>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {CATEGORIES.map((room) => (
                <td
                  key={room.id}
                  data-current={room.id === current || undefined}
                >
                  {value(room)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
