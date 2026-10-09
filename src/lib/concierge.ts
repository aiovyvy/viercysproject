import { EXTRAS, CATEGORIES, money, CURRENCY } from "./catalog";
import { VOUCHER, CANCEL_DAYS_BEFORE } from "./policy";
type Link = { label: string; href: string };
type Rule = { match: RegExp; reply: string; links?: Link[] };
const price = (id: string) =>
  money(EXTRAS.find((extra) => extra.id === id)!.price, CURRENCY);
const rate = (id: string) =>
  money(CATEGORIES.find((cat) => cat.id === id)!.rate, CURRENCY);
const BOOK: Link = { label: "Book a stay", href: "/book" };
const MY_STAY: Link = { label: "My VIERCYS", href: "/my-stay" };
const FIND: Link = { label: "Find my booking", href: "/lookup" };
// Deterministic answers to the questions a first-time guest actually asks.
// Order matters: the first matching rule wins.
const RULES: Rule[] = [
  {
    match: /voucher|invit|complimentary|free|claim|prize|won\b/,
    reply: `Your invitation covers up to ${VOUCHER.nights} nights in an Essential Room (${rate("essential")} per night), for one room. Open your invitation link and tap Claim your stay; the voucher is then applied automatically. A larger room or extra nights show their exact extra cost before you confirm. Each invitation works for one booking, and unused nights have no cash value. This is a classroom demo, not a real travel prize.`,
    links: [BOOK, { label: "FAQ", href: "/faq" }],
  },
  {
    match: /contact|phone|call|email us|front desk|reception|staff|human|help/,
    reply:
      "VIERCYS is a fictional hotel, so there is no real front desk. During the classroom demo, the presenter acts as the front desk and can view, change or cancel any booking. For everything else, I can point you to the right page.",
    links: [{ label: "Contact", href: "/contact" }, FIND],
  },
  {
    match: /extend|longer|extra night|more nights|stay another/,
    reply:
      "Open your booking and tap Extend stay. Choose how many nights to add; you will see the extra simulated amount before anything changes. Your voucher still applies to the first nights.",
    links: [MY_STAY, FIND],
  },
  {
    match: /change|move|reschedul|different date|new date/,
    reply:
      "Open your booking and tap Change dates. We check that your room is free on the new dates and show the new price before you confirm. Online changes close on your arrival date.",
    links: [MY_STAY, FIND],
  },
  {
    match: /cancel|refund/,
    reply: `You can cancel online from your booking until ${CANCEL_DAYS_BEFORE} days before arrival; the exact date is shown on your booking. Cancelling releases the room and records a simulated refund, and an invitation voucher becomes usable again. After that, ask the front desk (the presenter).`,
    links: [MY_STAY, { label: "Contact", href: "/contact" }],
  },
  {
    match: /tax|fee|price|cost|how much|pay|charge|card/,
    reply: `Rates include taxes: Essential ${rate("essential")}, Signature ${rate("signature")}, Grand Sanctuary ${rate("grand")} per night. Payment is simulated: we never ask for card details and nothing is charged.`,
    links: [BOOK],
  },
  {
    match: /breakfast/,
    reply: `Breakfast is an optional extra at ${price("breakfast")} per guest per morning, taxes included. Add it on the review step under Add optional experiences. It is not covered by the voucher.`,
    links: [BOOK],
  },
  {
    match: /transfer|airport|taxi|pick ?up/,
    reply: `Airport transfer is an optional extra at ${price("transfer")} per vehicle for up to four guests. Add it on the review step. No real transport is reserved.`,
    links: [BOOK],
  },
  {
    match: /room|capacity|how many (people|guests)|sleep|bed|famil|kid|child/,
    reply:
      "Essential Rooms sleep 2, Signature Suites 3 and Grand Sanctuaries 4; children count toward capacity. Larger groups can book up to 5 rooms in one reservation, with at least one adult per room.",
    links: [BOOK, { label: "Compare rooms", href: "/compare" }],
  },
  {
    match: /check.?in|check.?out|arriv|time/,
    reply:
      "Your dates and booking reference are on your booking page. Check-in and check-out are handled by the front desk (the presenter) in this demo; online changes close on your arrival date.",
    links: [MY_STAY],
  },
  {
    match: /find|lost|reference|my booking|where is/,
    reply:
      "Bookings open automatically in the browser where you made them. On another device, use Find my booking with your booking reference and the email you booked with.",
    links: [FIND],
  },
];
const DEFAULT =
  "I can help with your voucher, prices, changing or extending dates, cancelling, rooms, breakfast and transfers, or finding your booking. For island ideas, sunset viewpoints and village walks are lovely; verify access, hours and costs locally.";
export function conciergeReply(message: string) {
  const text = message.toLowerCase();
  const rule = RULES.find((item) => item.match.test(text));
  return {
    reply: rule?.reply ?? DEFAULT,
    links: rule?.links ?? [BOOK, MY_STAY],
  };
}
