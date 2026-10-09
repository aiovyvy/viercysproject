import { POLICY, addDays, propertyToday } from "@/lib/policy";
import styles from "./home.module.css";

/**
 * Native date search that lands on the existing "Choose your room" step. It
 * works without JavaScript; the booking flow validates everything again.
 */
export function StaySearch({
  variant,
  idPrefix,
}: {
  variant: "bar" | "card";
  idPrefix: string;
}) {
  const today = propertyToday();
  const max = addDays(today, POLICY.horizonDays);
  return (
    <form
      method="get"
      action="/book/rooms"
      className={variant === "bar" ? styles.searchBar : styles.searchCard}
      aria-label="Find a room for your dates"
    >
      <label htmlFor={idPrefix + "-arrival"}>
        <span>Check-in</span>
        <input
          id={idPrefix + "-arrival"}
          type="date"
          name="arrival"
          defaultValue={addDays(today, 7)}
          min={today}
          max={max}
          required
        />
      </label>
      <label htmlFor={idPrefix + "-departure"}>
        <span>Check-out</span>
        <input
          id={idPrefix + "-departure"}
          type="date"
          name="departure"
          defaultValue={addDays(today, 10)}
          min={addDays(today, 1)}
          max={max}
          required
        />
      </label>
      <label htmlFor={idPrefix + "-adults"}>
        <span>Adults</span>
        <select id={idPrefix + "-adults"} name="adults" defaultValue="2">
          {[1, 2, 3, 4].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label htmlFor={idPrefix + "-children"}>
        <span>Children</span>
        <select id={idPrefix + "-children"} name="children" defaultValue="0">
          {[0, 1, 2, 3].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <input type="hidden" name="rooms" value="1" />
      <button type="submit">See rooms and prices</button>
    </form>
  );
}
