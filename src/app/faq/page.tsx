import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { CATEGORIES, EXTRAS, money } from "@/lib/catalog";
import { VOUCHER } from "@/lib/policy";
export const metadata = { title: "FAQ | VIERCYS" };
const rate = (id: string) => money(CATEGORIES.find((c) => c.id === id)!.rate);
const extra = (id: string) => money(EXTRAS.find((e) => e.id === id)!.price);
const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is this a real hotel or a real prize?",
    a: "No. VIERCYS is a fictional hotel built for a classroom demonstration. Invitations are demo vouchers, nothing is a real reservation, and no payment is ever taken.",
  },
  {
    q: "What does the voucher cover?",
    a: `Up to ${VOUCHER.nights} nights in an Essential Room (${rate("essential")} per night), for one room. Unused nights have no cash value and can't be saved.`,
  },
  {
    q: "Can I choose a bigger room or stay longer?",
    a: `Yes. A Signature Suite (${rate("signature")}) or Grand Sanctuary (${rate("grand")}) costs the difference over the Essential rate for every night, and nights beyond the first ${VOUCHER.nights} are charged at the room rate. Every room card and the review step show the exact amount before you confirm.`,
  },
  {
    q: "How do I use my invitation?",
    a: "Open your personal link and tap Claim your stay. The voucher is applied automatically on this device. Each link works for one booking, so please don't share it.",
  },
  {
    q: "My invitation says it has been used or has expired.",
    a: "Each invitation works once and has an expiry date. If yours was used by someone else or expired, ask the presenter for a new link. You can still book at the standard demo price.",
  },
  {
    q: "Are taxes included?",
    a: "Yes. All rates include taxes, and there are no extra fees.",
  },
  {
    q: "How many people fit in a room?",
    a: "Essential Rooms sleep 2, Signature Suites 3 and Grand Sanctuaries 4. Children count toward capacity. Groups can book up to 5 rooms at once, with at least one adult per room.",
  },
  {
    q: "Can I extend my stay or change dates?",
    a: "Yes, from your booking: tap Extend stay or Change dates. You see the new price before anything changes. Online changes close on your arrival date.",
  },
  {
    q: "How do I cancel?",
    a: "From your booking, until two days before arrival; the exact date is shown on your booking and at checkout. Cancelling releases the room and an invitation voucher becomes usable again. After that, ask the front desk (the presenter).",
  },
  {
    q: "I can't find my booking.",
    a: (
      <>
        Bookings open automatically in the browser where you made them. On
        another device, use <Link href="/lookup">Find my booking</Link> with
        your booking reference (VRC-…) and the email you booked with.
      </>
    ),
  },
  {
    q: "Did I receive a confirmation email?",
    a: "Only if email has been set up for the demo. Your booking page always tells you honestly whether an email was sent, and you can view the email there either way.",
  },
  {
    q: "Are breakfast and transfers included?",
    a: `No, they are optional extras: breakfast ${extra("breakfast")} per guest per morning, airport transfer ${extra("transfer")} per vehicle. Dinner, sailing and spa are requests only and are never charged.`,
  },
];
export default function Faq() {
  return (
    <InfoPage
      title="Questions, answered."
      intro={
        <>
          Can&rsquo;t find what you need? Try the{" "}
          <Link href="/concierge">Concierge</Link> or see{" "}
          <Link href="/contact">Contact</Link>.
        </>
      }
    >
      <div className="faq-list">
        {FAQ.map((item) => (
          <details className="book-card" key={item.q}>
            <summary className="stay-summary-toggle">{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
