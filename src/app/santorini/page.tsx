import Image from "next/image";
import Link from "next/link";
import { Navigation, Footer, BookLink } from "../experience";
import { CATEGORIES, money } from "@/lib/catalog";
import { ROOM_EDITORIAL } from "@/lib/rooms-editorial";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import { ScrollStory } from "@/components/editorial/ScrollStory";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";
import styles from "./santorini.module.css";

export const metadata = {
  title: "Santorini | VIERCYS",
  description:
    "VIERCYS Santorini: twenty rooms above the Aegean caldera, our first and only bookable address.",
};

export default function Santorini() {
  return (
    <>
      <Navigation />
      <main id="main" className={ui.page}>
        <EditorialHero
          kicker="Greece · Our first address"
          title={
            <>
              Santorini.
              <br />
              <em>A slower kind of beautiful.</em>
            </>
          }
          lead="Pale limestone above the Aegean. Twenty rooms, one considered philosophy: give every moment room to breathe."
          photo={{
            src: "/images/santorini/fira-sunset.jpg",
            alt: "The sun setting over the caldera, seen from Fira",
            focus: "50% 32%",
          }}
        >
          <BookLink className={ui.primaryLight} />
          <a href="#rooms" className={ui.ghostLight}>
            See the rooms
          </a>
        </EditorialHero>

        <section className={sections.band} aria-labelledby="island-title">
          <header className={`${ui.sectionHead} ${sections.inner}`}>
            <p className={ui.kicker}>The island</p>
            <h2 id="island-title">
              A volcano, <em>filled by the sea.</em>
            </h2>
          </header>
          <ScrollStory
            tone="light"
            chapters={[
              {
                label: "The caldera",
                title: "Cliffs above a flooded crater",
                body: "Santorini curves around a vast caldera, left by an eruption more than three thousand years ago. The sea filled it, and the cliffs still rise straight from the water.",
                photo: {
                  src: "/images/santorini/caldera-dusk.jpg",
                  alt: "The caldera at dusk with a tall ship crossing the water",
                  focus: "40% 50%",
                },
              },
              {
                label: "The villages",
                title: "Whitewash along the rim",
                body: "Villages such as Fira, Imerovigli and Oia line the top of the cliffs, their houses stepping down toward the water in white, cream and blue.",
                photo: {
                  src: "/images/santorini/oia-sunset.jpg",
                  alt: "Oia's white houses and windmills glowing at sunset",
                  focus: "60% 55%",
                },
              },
              {
                label: "The materials",
                title: "Stone, lime and light",
                body: "Volcanic stone, thick lime-washed walls and arched openings keep island houses cool in summer. They are the starting point for every VIERCYS room.",
                photo: {
                  src: "/images/santorini/stone-door.jpg",
                  alt: "Weathered volcanic stone doorway with a red timber door",
                  focus: "50% 55%",
                },
              },
            ]}
          />
        </section>

        <section
          id="rooms"
          className={`${sections.band} ${sections.paper}`}
          aria-labelledby="rooms-title"
        >
          <div className={sections.inner}>
            <header className={ui.sectionHead}>
              <p className={ui.kicker}>Twenty rooms · three types</p>
              <h2 id="rooms-title">
                Where you <em>will stay.</em>
              </h2>
            </header>
            <ul className={styles.rooms}>
              {CATEGORIES.map((room) => {
                const editorial = ROOM_EDITORIAL[room.id];
                return (
                  <li key={room.id}>
                    <Link href={`/rooms/${room.id}`} className={styles.room}>
                      <span className={styles.roomPhoto}>
                        <Image
                          src={editorial.heroPhoto.src}
                          alt=""
                          fill
                          sizes="(max-width: 860px) 100vw, 30vw"
                          style={{ objectPosition: editorial.heroPhoto.focus }}
                        />
                      </span>
                      <span className={styles.roomMood}>{editorial.mood}</span>
                      <strong>{room.name}</strong>
                      <span>{room.description}</span>
                      <span className={styles.roomFacts}>
                        {room.size} m² · {room.view} · up to {room.capacity}{" "}
                        guests · {room.inventory} rooms
                      </span>
                      <span className={styles.roomRate}>
                        {money(room.rate)} per night, taxes included
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href="/rooms" className={ui.textLink}>
              Compare all rooms <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className={sections.band} aria-labelledby="know-title">
          <div className={`${sections.inner} ${styles.know}`}>
            <h2 id="know-title">
              Good <em>to know.</em>
            </h2>
            <dl>
              <div>
                <dt>Guests</dt>
                <dd>
                  Every child counts toward a room&rsquo;s capacity. Book up to
                  five rooms at once, with at least one adult in each.
                </dd>
              </div>
              <div>
                <dt>Changes</dt>
                <dd>
                  Cancel online until two calendar days before arrival, or
                  extend and change dates from My VIERCYS.
                </dd>
              </div>
              <div>
                <dt>Prices</dt>
                <dd>
                  Rates are per room per night and include taxes. Extras are
                  optional and shown before you confirm.
                </dd>
              </div>
              <div>
                <dt>A classroom project</dt>
                <dd>
                  VIERCYS is fictional. Availability is real, but stays and
                  payments are simulated, and photographs show Santorini rather
                  than the property.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={sections.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">
            Your room <em>above the caldera.</em>
          </h2>
          <div className={sections.closingActions}>
            <BookLink className={ui.primary} />
            <Link href="/experiences" className={ui.ghost}>
              Add experiences
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
