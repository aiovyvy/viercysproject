export type SearchInput = {
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  rooms: number;
};
export const POLICY = {
  maxNights: 30,
  horizonDays: 730,
  timeZone: "Europe/Athens",
};
// Demo voucher rule: up to three Essential Room nights on one room. Other
// tiers pay the per-night difference on every night; extra nights pay in full.
export const VOUCHER = {
  nights: 3,
  baseCategory: "essential",
  inviteDays: 30,
};
export function propertyToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: POLICY.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function dayNumber(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return NaN;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
    ? date.getTime() / 86400000
    : NaN;
}
export function addDays(iso: string, days: number) {
  return new Date((dayNumber(iso) + days) * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function nights(input: SearchInput) {
  return dayNumber(input.departure) - dayNumber(input.arrival);
}
// Online cancellation closes two calendar days before arrival (property time).
export const CANCEL_DAYS_BEFORE = 2;
export function cancelOnlineUntil(arrival: string) {
  return addDays(arrival, -CANCEL_DAYS_BEFORE);
}
export function canCancelOnline(arrival: string, today = propertyToday()) {
  return dayNumber(arrival) - dayNumber(today) >= CANCEL_DAYS_BEFORE;
}
export const FRONT_DESK =
  "Ask the front desk: during the classroom demo, that is the presenter (see Contact).";
export function validateSearch(
  input: SearchInput,
  today = propertyToday(),
): string | null {
  if (
    !input ||
    !Number.isFinite(dayNumber(input.arrival)) ||
    !Number.isFinite(dayNumber(input.departure))
  )
    return "Enter valid calendar dates with a four-digit year (YYYY-MM-DD).";
  if (input.arrival < today) return "Check-in cannot be in the past.";
  if (input.departure <= input.arrival)
    return "Check-out must be after check-in.";
  if (input.departure > addDays(today, POLICY.horizonDays))
    return "Choose dates within the next 24 months.";
  if (nights(input) > POLICY.maxNights) return "The maximum stay is 30 nights.";
  if (!Number.isInteger(input.adults) || input.adults < 1 || input.adults > 10)
    return "Choose 1–10 adults.";
  if (
    !Number.isInteger(input.children) ||
    input.children < 0 ||
    input.children > 8
  )
    return "Choose 0–8 children.";
  if (!Number.isInteger(input.rooms) || input.rooms < 1 || input.rooms > 5)
    return "Choose 1–5 rooms.";
  if (input.adults < input.rooms)
    return "At least one adult is required in each room.";
  if (input.adults + input.children > input.rooms * 4)
    return "Your party needs more room capacity. Add another room.";
  return null;
}
export function searchFrom(params: Record<string, unknown>): SearchInput {
  return {
    // Default to a three-night stay a week out, inside the online-change window.
    arrival: String(params.arrival ?? addDays(propertyToday(), 7)),
    departure: String(params.departure ?? addDays(propertyToday(), 10)),
    adults: Number(params.adults ?? 2),
    children: Number(params.children ?? 0),
    rooms: Number(params.rooms ?? 1),
  };
}
export function searchQuery(input: SearchInput) {
  return new URLSearchParams(
    Object.entries(input).map(([key, value]) => [key, String(value)]),
  ).toString();
}
export function formatDate(iso: string) {
  // Invalid input (e.g. a hand-edited URL) is shown as typed, never thrown.
  if (!Number.isFinite(dayNumber(iso))) return String(iso);
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dayNumber(iso) * 86400000));
}
