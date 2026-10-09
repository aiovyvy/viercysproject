import Link from "next/link";
import { InfoPage } from "@/components/info-page";
export const metadata = { title: "Privacy | VIERCYS" };
export default function Privacy() {
  return (
    <InfoPage
      title="Privacy."
      intro="This is a classroom demo, so please use a made-up name and an email address you don't mind showing to the presenter. Here is exactly what the demo stores."
    >
      <section className="book-card" aria-labelledby="what">
        <h2 id="what">What we store</h2>
        <ul className="info-list">
          <li>
            Your booking: name, email, optional phone number, optional special
            requests, dates, guests, rooms and the simulated price.
          </li>
          <li>
            Which invitation was used for which booking (invitation links
            themselves are stored only in scrambled, one-way form).
          </li>
          <li>
            Short-lived security records: hashed sign-in sessions and counts of
            failed attempts, used to slow down guessing.
          </li>
        </ul>
        <p>We never ask for card or payment details, and none are stored.</p>
      </section>
      <section className="book-card" aria-labelledby="where">
        <h2 id="where">Where it lives and who can see it</h2>
        <p>
          Everything is kept in a database on the presenter&rsquo;s computer.
          The presenter (acting as hotel staff) can see all bookings in the
          staff dashboard. Other guests can&rsquo;t: a booking opens only in the
          browser that made it, or with its reference and matching email.
        </p>
        <p>
          If the presenter has turned on email, your confirmation is sent
          through an email provider (Resend). If an AI service is turned on,
          concierge questions and trip-planning preferences are sent to it,
          without your name or email. Neither is used by default.
        </p>
      </section>
      <section className="book-card" aria-labelledby="cookies">
        <h2 id="cookies">Cookies and browser storage</h2>
        <ul className="info-list">
          <li>
            <strong>viercys_guest</strong>: keeps your bookings open in this
            browser for 14 days.
          </li>
          <li>
            <strong>viercys_invite</strong>: remembers a claimed invitation
            until you book or it expires.
          </li>
          <li>
            <strong>viercys_device</strong>: a random ID used only to limit
            repeated failed attempts from one device.
          </li>
          <li>
            <strong>viercys_staff</strong>: staff sign-in (presenter only).
          </li>
          <li>
            Browser storage remembers whether you have seen the booking guide
            and protects against double bookings if you press Back.
          </li>
        </ul>
        <p>There is no advertising or analytics tracking.</p>
      </section>
      <section className="book-card" aria-labelledby="delete">
        <h2 id="delete">How long and how to remove it</h2>
        <p>
          Data stays until the presenter resets the demo, which deletes every
          booking and invitation. You can cancel your booking yourself, use
          &ldquo;Forget bookings on this device&rdquo; on{" "}
          <Link href="/my-stay">My VIERCYS</Link>, or ask the presenter to
          delete your details.
        </p>
      </section>
    </InfoPage>
  );
}
