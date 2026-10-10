import Link from "next/link";
import { Navigation, Footer, BookLink } from "@/app/experience";
import { CATEGORIES } from "@/lib/catalog";
import { DESTINATIONS } from "@/lib/destinations";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import { ScrollStory } from "@/components/editorial/ScrollStory";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";
import styles from "./about.module.css";

export const metadata = {
  title: "About VIERCYS",
  description:
    "VIERCYS Hotels & Resorts: a Mediterranean hospitality concept, and the classroom project behind it.",
};

export default function About() {
  const rooms = CATEGORIES.reduce((sum, room) => sum + room.inventory, 0);
  const future = DESTINATIONS.filter((place) => !place.bookable).length;
  return (
    <>
      <Navigation />
      <main id="main" className={ui.page}>
        <EditorialHero
          variant="arch"
          kicker="About VIERCYS"
          title={
            <>
              About VIERCYS.
              <br />
              <em>Where Earth Meets the Sea.</em>
            </>
          }
          lead="VIERCYS Hotels & Resorts is an imagined Mediterranean hospitality brand: small hotels shaped by their landscape, where the stay is designed around calm rather than spectacle."
          photo={{
            src: "/images/santorini/chapel-arch.jpg",
            alt: "White chapel facade with an arched blue-trimmed doorway",
            focus: "50% 70%",
          }}
        >
          <Link href="/philosophy" className={ui.primary}>
            Read our philosophy
          </Link>
        </EditorialHero>

        <section className={sections.band} aria-labelledby="idea-title">
          <div className={`${sections.inner} ${styles.idea}`}>
            <div>
              <p className={ui.kicker}>The idea</p>
              <h2 id="idea-title">
                A few rooms, <em>a long horizon.</em>
              </h2>
            </div>
            <div className={styles.ideaText}>
              <p>
                The name joins the earth and the sea, the two things every
                VIERCYS address is built between. Our first address is VIERCYS
                Santorini: {rooms} rooms in three types, set into a limestone
                cliff above the Aegean.
              </p>
              <p>
                Rather than adding more, we try to remove what gets in the way:
                hidden fees, confusing booking steps, crowded terraces. What is
                left is space, light and the view.
              </p>
            </div>
            <dl className={styles.numbers}>
              <div>
                <dt>Bookable address</dt>
                <dd>1</dd>
              </div>
              <div>
                <dt>Rooms in Santorini</dt>
                <dd>{rooms}</dd>
              </div>
              <div>
                <dt>Room types</dt>
                <dd>{CATEGORIES.length}</dd>
              </div>
              <div>
                <dt>Future concepts</dt>
                <dd>{future}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          className={`${sections.band} ${sections.dark}`}
          aria-labelledby="host-title"
        >
          <header className={`${ui.sectionHead} ${sections.inner}`}>
            <p className={ui.kicker}>How we host</p>
            <h2 id="host-title">
              From invitation <em>to farewell.</em>
            </h2>
          </header>
          <ScrollStory
            chapters={[
              {
                label: "Before you arrive",
                title: "An invitation, not a sales pitch",
                body: "Choose dates and a room, see exactly what is covered and what costs extra, and confirm in a few steps. Invited guests see their complimentary nights applied automatically.",
                photo: {
                  src: "/images/santorini/courtyard-door.jpg",
                  alt: "Whitewashed courtyard wall with a blue-shuttered window",
                  focus: "50% 60%",
                },
              },
              {
                label: "While you stay",
                title: "Help when you want it",
                body: "Your itinerary keeps the plan in one place, and the concierge answers quick questions about the voucher, prices, rooms and dates.",
                photo: {
                  src: "/images/santorini/sea-terrace.jpg",
                  alt: "White terrace with linen sofas and a wide sea view",
                },
              },
              {
                label: "Whenever plans change",
                title: "Your stay, in your hands",
                body: "View, extend or cancel your booking yourself in My VIERCYS. Online cancellation stays open until two days before arrival.",
                photo: {
                  src: "/images/santorini/oia-evening.jpg",
                  alt: "The sun setting over the Aegean beside the village of Oia",
                },
              },
            ]}
          />
        </section>

        <section className={sections.band} aria-labelledby="project-title">
          <div className={`${sections.inner} ${styles.project}`}>
            <div>
              <p className={ui.kicker}>Behind the brand</p>
              <h2 id="project-title">
                A classroom project, <em>built with care.</em>
              </h2>
            </div>
            <div className={styles.projectText}>
              <p>
                VIERCYS is a human-computer interaction project. Its goal is a
                booking journey a first-time guest can complete on a phone
                without help: open an invitation, choose dates and a room,
                understand the price, confirm, and manage the stay.
              </p>
              <ul className={styles.truths}>
                <li>
                  <strong>Real</strong> Availability rules and stored
                  reservations: the same room can never be booked twice for one
                  night.
                </li>
                <li>
                  <strong>Simulated</strong> The hotel, its prices, the
                  invitations and every payment. No accommodation or travel is
                  ever booked.
                </li>
                <li>
                  <strong>Photography</strong> Licensed photographs of Santorini
                  and other real places, never of a VIERCYS property. See{" "}
                  <Link href="/credits">photo credits</Link>.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className={sections.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">
            Come and see <em>for yourself.</em>
          </h2>
          <div className={sections.closingActions}>
            <BookLink className={ui.primary} />
            <Link href="/rooms" className={ui.ghost}>
              Explore rooms &amp; suites
            </Link>
          </div>
          <p className={sections.note}>
            VIERCYS is a fictional hotel for a classroom project. Questions?
            Read the <Link href="/faq">FAQ</Link> or{" "}
            <Link href="/contact">contact us</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
