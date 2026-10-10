import Link from "next/link";
import { connection } from "next/server";
import { Navigation, Footer, BookLink } from "@/app/experience";
import { CATEGORIES, money } from "@/lib/catalog";
import { searchFrom, searchQuery } from "@/lib/policy";
import { ROOM_EDITORIAL } from "@/lib/rooms-editorial";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import { ScrollStory } from "@/components/editorial/ScrollStory";
import { RoomCompare } from "@/components/editorial/RoomCompare";
import { StaySearch } from "@/components/editorial/StaySearch";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";
import styles from "./rooms.module.css";

export const metadata = {
  title: "Rooms & Suites | VIERCYS Santorini",
  description:
    "Essential Rooms, Signature Suites and Grand Sanctuaries above the Aegean: compare space, views and nightly rates.",
};

export default async function Rooms({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  // Keep a guest's dates when they arrive here from a room page.
  const query = params.arrival ? searchQuery(searchFrom(params)) : "";
  const suffix = query ? `?${query}` : "";
  return (
    <>
      <Navigation />
      <main id="main" className={ui.page}>
        <EditorialHero
          kicker="Rooms & Suites · Santorini"
          title={
            <>
              Twenty rooms.
              <br />
              <em>Three ways to stay.</em>
            </>
          }
          lead="From an intimate courtyard room to a sanctuary with the whole horizon. Every rate includes taxes; extras are always optional."
          photo={{
            src: "/images/santorini/oia-evening.jpg",
            alt: "The sun setting over the Aegean beside the cliffside village of Oia",
            focus: "45% 50%",
          }}
        >
          <a href="#rooms-list" className={ui.primaryLight}>
            Meet the rooms
          </a>
          <a href="#check" className={ui.ghostLight}>
            Check your dates
          </a>
        </EditorialHero>

        <section
          id="rooms-list"
          className={`${sections.band} ${sections.dark}`}
          aria-labelledby="rooms-list-title"
        >
          <header className={`${ui.sectionHead} ${sections.inner}`}>
            <p className={ui.kicker}>The collection</p>
            <h2 id="rooms-list-title">
              Choose your <em>kind of quiet.</em>
            </h2>
          </header>
          <ScrollStory
            chapters={CATEGORIES.map((room) => {
              const editorial = ROOM_EDITORIAL[room.id];
              return {
                label: editorial.mood,
                title: room.name,
                body: editorial.statement,
                photo: editorial.heroPhoto,
                extra: (
                  <>
                    <dl className={sections.facts}>
                      <div>
                        <dt>From</dt>
                        <dd>{money(room.rate)}</dd>
                      </div>
                      <div>
                        <dt>Space</dt>
                        <dd>{room.size} m²</dd>
                      </div>
                      <div>
                        <dt>Sleeps</dt>
                        <dd>Up to {room.capacity}</dd>
                      </div>
                    </dl>
                    <p className={styles.amenities}>
                      {room.view} view · {room.amenities.join(" · ")}
                    </p>
                    <div className={sections.links}>
                      <Link
                        href={`/rooms/${room.id}${suffix}`}
                        className={ui.primaryLight}
                      >
                        Discover the {room.name}
                      </Link>
                    </div>
                  </>
                ),
              };
            })}
          />
        </section>

        <section
          className={sections.band}
          aria-labelledby="compare-title"
        >
          <div className={sections.inner}>
            <header className={ui.sectionHead}>
              <p className={ui.kicker}>Side by side</p>
              <h2 id="compare-title">
                Compare <em>at a glance.</em>
              </h2>
              <p>
                Every room has air conditioning and Wi-Fi. Rates are per room
                per night, taxes included.
              </p>
            </header>
            <RoomCompare query={query} />
          </div>
        </section>

        <section
          id="check"
          className={`${sections.band} ${sections.limestone} ${styles.check}`}
          aria-labelledby="check-title"
        >
          <div className={styles.checkCopy}>
            <p className={ui.kicker}>Availability</p>
            <h2 id="check-title">
              See what is free <em>on your dates.</em>
            </h2>
            <p>
              Choose dates and guests to see every room that is available, with
              the exact total. Nothing is held or charged until you confirm.
            </p>
            <p className={styles.help}>
              Prefer a guided booking? <BookLink className={ui.inlineLink} />{" "}
              walks you through it step by step.
            </p>
          </div>
          <div className={styles.checkCard}>
            <StaySearch variant="card" idPrefix="rooms" />
            <p className={sections.note}>
              VIERCYS is a fictional hotel for a classroom project. Stays and
              payments are simulated.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
