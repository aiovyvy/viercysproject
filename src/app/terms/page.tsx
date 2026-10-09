import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { VOUCHER } from "@/lib/policy";
export const metadata = { title: "Terms | VIERCYS" };
export default function Terms() {
  return (
    <InfoPage
      title="Terms of the demo."
      intro="Short and plain, because nothing here is real: these terms explain how the demonstration behaves."
    >
      <section className="book-card" aria-labelledby="not-real">
        <h2 id="not-real">Not a real booking or prize</h2>
        <p>
          VIERCYS is a fictional hotel. A confirmed reservation is a record in a
          classroom demo, not a contract for accommodation or travel.
          Invitations are demo vouchers and give no real-world entitlement.
        </p>
      </section>
      <section className="book-card" aria-labelledby="payment">
        <h2 id="payment">Payment</h2>
        <p>
          All prices are simulated and include taxes. Nothing is ever charged,
          and we never ask for card details. Amounts called &ldquo;due&rdquo;,
          &ldquo;paid&rdquo; or &ldquo;refunded&rdquo; are part of the
          simulation.
        </p>
      </section>
      <section className="book-card" aria-labelledby="voucher">
        <h2 id="voucher">Invitation vouchers</h2>
        <ul className="info-list">
          <li>
            Cover up to {VOUCHER.nights} nights in an Essential Room, for one
            room, and work for one booking.
          </li>
          <li>
            Larger rooms pay the difference over the Essential rate for every
            night; nights beyond the first {VOUCHER.nights} pay the room rate.
            The amount is shown before you confirm.
          </li>
          <li>
            Unused nights have no cash value. Vouchers expire on the date shown
            on the invitation.
          </li>
          <li>
            Cancelling a voucher booking makes the voucher usable again until it
            expires. Please don&rsquo;t use or share someone else&rsquo;s link.
          </li>
        </ul>
      </section>
      <section className="book-card" aria-labelledby="changes">
        <h2 id="changes">Changes and cancellation</h2>
        <p>
          You can change or extend a stay online until your arrival date, if the
          room is free; the new price is shown first. Online cancellation is
          available until two days before arrival. After that, ask the front
          desk (<Link href="/contact">Contact</Link>).
        </p>
      </section>
      <section className="book-card" aria-labelledby="reset">
        <h2 id="reset">Demo resets</h2>
        <p>
          The presenter may reset the demo at any time, which deletes all
          bookings and invitations. See <Link href="/privacy">Privacy</Link> for
          what is stored.
        </p>
      </section>
    </InfoPage>
  );
}
