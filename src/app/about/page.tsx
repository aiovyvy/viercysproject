import Link from "next/link";
import { InfoPage } from "@/components/info-page";
export const metadata = { title: "About | VIERCYS" };
export default function About() {
  return (
    <InfoPage
      title="About VIERCYS."
      intro="Where Earth Meets the Sea. VIERCYS is an imagined Mediterranean hotel brand, designed as a classroom project in human-computer interaction."
    >
      <section className="book-card" aria-labelledby="concept">
        <h2 id="concept">The concept</h2>
        <p>
          Our first (fictional) address is VIERCYS Santorini: twenty rooms in
          three types, Essential, Signature and Grand Sanctuary, carved into a
          limestone cliff above the Aegean. Boracay, Amalfi and Bali are future
          concepts and can&rsquo;t be booked.
        </p>
      </section>
      <section className="book-card" aria-labelledby="project">
        <h2 id="project">The project</h2>
        <p>
          The site demonstrates a booking journey a first-time guest can
          complete on a phone without help: open an invitation, choose dates and
          a room, see exactly what is covered and what costs extra, confirm, and
          then view, extend or cancel the stay.
        </p>
        <p>
          Reservations are stored in a real database with real availability
          rules (the same room can&rsquo;t be booked twice for one night), but
          the hotel, the prices, the invitations and the payments are all
          simulated.
        </p>
      </section>
      <section className="book-card" aria-labelledby="images">
        <h2 id="images">Photography</h2>
        <p>
          Photos are temporary editorial images used for inspiration. They are
          not pictures of a real VIERCYS property.
        </p>
      </section>
      <p className="book-change-links">
        <Link href="/santorini">Discover Santorini</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/contact">Contact</Link>
      </p>
    </InfoPage>
  );
}
