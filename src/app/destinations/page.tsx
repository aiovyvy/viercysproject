import Image from "next/image";
import Link from "next/link";
import { Navigation, Footer, BookLink } from "../experience";
import { DESTINATIONS } from "@/lib/destinations";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";
import styles from "./destinations.module.css";

export const metadata = {
  title: "Destinations | VIERCYS",
  description:
    "Santorini is our first address and the only one open for booking. Boracay, Amalfi and Bali are future concepts.",
};

export default function Destinations() {
  return (
    <>
      <Navigation />
      <main id="main" className={ui.page}>
        <EditorialHero
          kicker="The VIERCYS collection"
          title={
            <>
              New horizons.
              <br />
              <em>One philosophy.</em>
            </>
          }
          lead="Our journey begins in Santorini, the only destination open for booking. Boracay, Amalfi and Bali are concepts for the future."
          photo={{
            src: "/images/santorini/oia-sunset.jpg",
            alt: "Oia's white houses and windmills glowing at sunset above the sea",
            focus: "60% 55%",
          }}
        />

        <nav className={styles.index} aria-label="Destinations index">
          <ol>
            {DESTINATIONS.map((place, at) => (
              <li key={place.slug}>
                <a href={`#${place.slug}`}>
                  <span className={styles.indexNumber}>0{at + 1}</span>
                  <span className={styles.indexName}>{place.name}</span>
                  <span className={styles.indexMeta}>
                    {place.country} · {place.coordinates}
                  </span>
                  <span className={styles.status} data-open={place.bookable}>
                    {place.bookable ? "Bookable now" : "Coming soon"}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.stack}>
          {DESTINATIONS.map((place, at) => [
            <section
              key={place.slug}
              id={place.slug}
              className={styles.panel}
              data-open={place.bookable}
              aria-labelledby={`${place.slug}-title`}
            >
              <div className={styles.panelPhoto}>
                <Image
                  src={place.photo.src}
                  alt={place.photo.alt}
                  fill
                  sizes="100vw"
                  preload={at === 0}
                />
              </div>
              <div className={styles.card}>
                <p className={ui.kicker}>
                  0{at + 1} · {place.region}
                </p>
                <h2 id={`${place.slug}-title`}>{place.name}</h2>
                <p className={styles.line}>{place.line}</p>
                <p>{place.description}</p>
                {place.bookable ? (
                  <>
                    <p className={styles.badge} data-open="true">
                      Our first address · Open for booking
                    </p>
                    <div className={sections.links}>
                      <BookLink className={ui.primary} />
                      <Link href="/santorini" className={ui.textLink}>
                        Discover Santorini <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className={styles.badge}>
                      Future destination · Reservations unavailable
                    </p>
                    <div className={sections.links}>
                      <Link
                        href={`/destinations/${place.slug}`}
                        className={ui.textLink}
                      >
                        Preview {place.name} <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </>
                )}
                <p className={styles.credit}>
                  {place.photo.caption} · Photo: {place.photo.credit}
                </p>
              </div>
            </section>,
            // A pause so each panel can be read before the next slides over.
            at < DESTINATIONS.length - 1 && (
              <div
                key={place.slug + "-pause"}
                className={styles.pause}
                aria-hidden="true"
              />
            ),
          ])}
        </div>

        <section className={sections.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">
            Begin where it began: <em>Santorini.</em>
          </h2>
          <div className={sections.closingActions}>
            <BookLink className={ui.primary} />
            <Link href="/rooms" className={ui.ghost}>
              Explore rooms &amp; suites
            </Link>
          </div>
          <p className={sections.note}>
            VIERCYS is a fictional hotel brand for a classroom project. Only
            Santorini can be booked, and its stays are simulated.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
