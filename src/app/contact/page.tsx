import Link from "next/link";
import { InfoPage } from "@/components/info-page";
export const metadata = { title: "Contact | VIERCYS" };
export default function Contact() {
  return (
    <InfoPage
      title="Contact."
      intro="VIERCYS Santorini is a fictional hotel, so there is no real front desk, phone line or mailbox. Here is who can help during the demo."
    >
      <section className="book-card" aria-labelledby="desk">
        <h2 id="desk">Front desk (during the class demo)</h2>
        <p>
          The presenter acts as the front desk. They can see every booking in
          the staff dashboard and can change dates, cancel a stay inside the
          two-day window, or check you in. Tell them your booking reference (it
          starts with VRC-).
        </p>
      </section>
      <section className="book-card" aria-labelledby="self">
        <h2 id="self">Do it yourself</h2>
        <ul className="info-list">
          <li>
            <Link href="/lookup">Find my booking</Link>: open your booking on
            any device with its reference and email.
          </li>
          <li>
            From your booking you can extend your stay, change dates or cancel
            (online cancellation closes two days before arrival).
          </li>
          <li>
            <Link href="/concierge">Concierge</Link>: quick answers about the
            voucher, prices, rooms and dates.
          </li>
          <li>
            <Link href="/faq">FAQ</Link>: the most common questions in one
            place.
          </li>
        </ul>
      </section>
      <section className="book-card" aria-labelledby="real">
        <h2 id="real">Is this a real hotel?</h2>
        <p>
          No. VIERCYS and its invitations are a classroom HCI project. Nothing
          you book here is a real reservation or a real travel prize, and no
          payment is ever taken.
        </p>
      </section>
    </InfoPage>
  );
}
