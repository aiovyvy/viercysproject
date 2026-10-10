import Link from "next/link";
import { Navigation, Footer, BookLink } from "@/app/experience";
import { money } from "@/lib/catalog";
import { EXPERIENCES, confirmation } from "@/lib/experiences";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import { ChapterRail } from "@/components/editorial/ChapterRail";
import { SwipeGallery } from "@/components/editorial/SwipeGallery";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";
import styles from "./experiences.module.css";

export const metadata = {
  title: "Experiences | VIERCYS Santorini",
  description:
    "Sunset sailing, private dinners, spa rituals and slow breakfasts: optional experiences to add when you book.",
};

export default function ExperiencesPage() {
  return (
    <>
      <Navigation />
      <main id="main" className={ui.page}>
        <EditorialHero
          kicker="Experiences · Santorini"
          title={
            <>
              The island,
              <br />
              <em>at your pace.</em>
            </>
          }
          lead="A handful of optional experiences, chosen to slow the day down rather than fill it. Add any of them when you book."
          photo={{
            src: "/images/santorini/caldera-table.jpg",
            alt: "A table for two on a terrace above the caldera at dusk",
            focus: "50% 64%",
          }}
        />
        <ChapterRail
          label="Experiences"
          chapters={EXPERIENCES.map((item) => ({
            id: item.id,
            label: item.title,
          }))}
        />

        <section
          className={`${sections.band} ${sections.paper}`}
          aria-labelledby="how-title"
        >
          <div className={`${sections.inner} ${styles.how}`}>
            <h2 id="how-title">
              How experiences <em>work.</em>
            </h2>
            <ol>
              <li>
                <strong>Choose while you book</strong>
                Experiences are added on the review step, just before you
                confirm your stay.
              </li>
              <li>
                <strong>Some are instant, some are requests</strong>
                Breakfast and transfers are added straight away. Dinner,
                sailing and spa are requests our team confirms before you
                arrive.
              </li>
              <li>
                <strong>Clear prices</strong>
                Each price is shown per guest, couple or vehicle. Requests are
                not part of your total until they are confirmed.
              </li>
            </ol>
          </div>
        </section>

        {EXPERIENCES.map((item, index) => (
          <section
            key={item.id}
            id={item.id}
            className={styles.experience}
            data-flip={index % 2 === 1}
            aria-labelledby={`${item.id}-title`}
          >
            <div className={styles.photos}>
              <SwipeGallery photos={item.photos} label={`${item.title} photos`} />
            </div>
            <div className={styles.copy}>
              <p className={ui.kicker}>
                {String(index + 1).padStart(2, "0")} ·{" "}
                {item.instant ? "Added instantly" : "On request"}
              </p>
              <h2 id={`${item.id}-title`}>{item.title}</h2>
              <p className={styles.line}>{item.line}</p>
              <p>{item.detail}</p>
              <dl className={sections.facts}>
                <div>
                  <dt>Price</dt>
                  <dd>{money(item.price)}</dd>
                </div>
                <div>
                  <dt>Per</dt>
                  <dd>{item.unit.replace(/^per /, "")}</dd>
                </div>
              </dl>
              <p className={styles.status}>{confirmation(item.instant)}</p>
            </div>
          </section>
        ))}

        <section className={sections.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">
            Start with the room. <em>Add the rest.</em>
          </h2>
          <div className={sections.closingActions}>
            <BookLink className={ui.primary} />
            <Link href="/rooms" className={ui.ghost}>
              Explore rooms &amp; suites
            </Link>
          </div>
          <p className={sections.note}>
            VIERCYS is a fictional hotel for a classroom project. Experiences
            and payments are simulated; photographs show Santorini, not the
            services themselves.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
