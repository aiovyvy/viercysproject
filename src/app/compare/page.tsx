import Link from "next/link";
import { connection } from "next/server";
import { Shell } from "@/components/journey";
import { CATEGORIES, money } from "@/lib/catalog";
import { available } from "@/lib/booking";
import { searchFrom, searchQuery, validateSearch } from "@/lib/policy";
export default async function Compare({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const search = searchFrom(params);
  const ids = (params.categories || "essential,signature,grand")
    .split(",")
    .slice(0, 3);
  const categories = CATEGORIES.filter((cat) => ids.includes(cat.id));
  const error = validateSearch(search);
  const rooms = error ? [] : await available(search);
  return (
    <Shell
      title="Compare rooms."
      back={{ href: "/book/rooms?" + searchQuery(search), label: "Rooms" }}
    >
      <p>
        Compare up to three categories. Per-date inventory below reflects your
        search.
      </p>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      <div
        className="j-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Room comparison table, scrolls sideways"
      >
        <table className="j-table">
          <thead>
            <tr>
              <th>Compare</th>
              {categories.map((cat) => (
                <th key={cat.id}>{cat.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              "Nightly sample rate",
              "Capacity (including children)",
              "Size",
              "View",
              "Amenities",
              "Available on your dates",
            ].map((label, index) => (
              <tr key={label}>
                <th>{label}</th>
                {categories.map((cat) => (
                  <td key={cat.id}>
                    {
                      [
                        money(cat.rate) + " per night, taxes included",
                        String(cat.capacity) + " guests",
                        String(cat.size) + " m²",
                        cat.view,
                        cat.amenities.join(", "),
                        String(
                          rooms.filter((room) => room.category === cat.id)
                            .length,
                        ) +
                          " / " +
                          cat.inventory,
                      ][index]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link className="j-button" href={"/book/rooms?" + searchQuery(search)}>
        Return to room selection
      </Link>
    </Shell>
  );
}
