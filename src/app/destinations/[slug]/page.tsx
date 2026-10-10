import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navigation, Footer, BookLink } from "../../experience";
import { DESTINATIONS, destination } from "@/lib/destinations";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";
import styles from "../destinations.module.css";

export function generateStaticParams() {
  return DESTINATIONS.filter((place) => !place.bookable).map((place) => ({
    slug: place.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const place = destination((await params).slug);
  return { title: place ? `${place.name} · Coming soon | VIERCYS` : "VIERCYS" };
}

export default async function Preview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = destination(slug);
  if (!place) notFound();
  // Santorini has its own full page.
  if (place.bookable) redirect("/santorini");
  const others = DESTINATIONS.filter((item) => item.slug !== place.slug);
  return (
    <>
      <Navigation />
      <main id="main" className={ui.page}>
        <EditorialHero
          kicker={`${place.country} · Coming soon`}
          title={
            <>
              {place.name}.
              <br />
              <em>A horizon ahead.</em>
            </>
          }
          lead={place.description}
          photo={{ src: place.photo.src, alt: place.photo.alt }}
        />
        <section className={sections.band} aria-labelledby="status-title">
          <div className={`${sections.inner} ${styles.preview}`}>
            <div>
              <p className={ui.kicker}>{place.region}</p>
              <h2 id="status-title">
                A preview of <em>what may come.</em>
              </h2>
            </div>
            <div>
              <p className={styles.badge}>
                Future destination · Reservations unavailable
              </p>
              <p className={styles.previewText}>
                {place.name} is a concept for the VIERCYS collection. It has no
                rooms, prices or opening date, and it cannot be booked. The
                photograph shows {place.photo.caption.toLowerCase()}, not a
                VIERCYS property (photo: {place.photo.credit}).
              </p>
              <div className={sections.links}>
                <BookLink className={ui.primary} />
                <span className={styles.previewHint}>
                  Bookings are for Santorini only.
                </span>
              </div>
            </div>
          </div>
        </section>
        <section
          className={`${sections.band} ${sections.paper}`}
          aria-labelledby="others-title"
        >
          <div className={sections.inner}>
            <h2 id="others-title" className={styles.othersTitle}>
              Elsewhere in the collection
            </h2>
            <ul className={styles.others}>
              {others.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={
                      item.bookable
                        ? "/santorini"
                        : `/destinations/${item.slug}`
                    }
                  >
                    <span className={styles.othersPhoto}>
                      <Image
                        src={item.photo.src}
                        alt=""
                        fill
                        sizes="(max-width: 860px) 100vw, 30vw"
                      />
                    </span>
                    <strong>{item.name}</strong>
                    <span>
                      {item.country} ·{" "}
                      {item.bookable ? "Bookable now" : "Coming soon"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/destinations" className={ui.textLink}>
              Back to the collection <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
