import Image from "next/image";
import Link from "next/link";
import { Navigation, Footer, BookLink } from "@/app/experience";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import { ChapterRail } from "@/components/editorial/ChapterRail";
import { ScrollStory } from "@/components/editorial/ScrollStory";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";
import styles from "./philosophy.module.css";

export const metadata = {
  title: "Our Philosophy | VIERCYS",
  description:
    "Architecture shaped by nature, slow luxury and thoughtful hospitality: the ideas behind VIERCYS.",
};

const CHAPTERS = [
  { id: "nature", label: "Shaped by nature" },
  { id: "earth-and-sea", label: "Earth and sea" },
  { id: "slow", label: "Slow luxury" },
  { id: "hospitality", label: "Hospitality" },
  { id: "privacy", label: "Privacy" },
  { id: "craft", label: "Craft" },
];

const SLOW =
  "Luxury, to us, is not more. It is fewer and better things: a room that stays quiet, a morning without an alarm, a table that waits until you are ready, and a horizon you never have to share.";

const MATERIALS = [
  {
    name: "Lime plaster",
    swatch: "#f1ede6",
    line: "Breathes, cools and softens every edge it covers.",
    photo: "/images/santorini/white-stair.jpg",
    focus: "70% 40%",
  },
  {
    name: "Volcanic stone",
    swatch: "#5f5a55",
    line: "The island's own bones, left honest and textured.",
    photo: "/images/santorini/stone-door.jpg",
    focus: "30% 80%",
  },
  {
    name: "Olive wood",
    swatch: "#b47a3c",
    line: "Warm grain for the things you touch every day.",
    photo: "/images/santorini/olive-wood.jpg",
    focus: "50% 50%",
  },
  {
    name: "Linen",
    swatch: "#e4ddd0",
    line: "Light, creased and cool against summer skin.",
    photo: "/images/santorini/sea-terrace.jpg",
    focus: "38% 75%",
  },
];

export default function Philosophy() {
  return (
    <>
      <Navigation />
      <main id="main" className={`${ui.page} ${styles.page}`}>
        <EditorialHero
          kicker="Our Philosophy"
          title={
            <>
              Luxury is the space
              <br />
              <em>to slow down.</em>
            </>
          }
          lead="Six ideas shape every VIERCYS stay, from the thickness of a wall to the moment we leave you alone with the view."
          photo={{
            src: "/images/santorini/caldera-dusk.jpg",
            alt: "The caldera at dusk with a tall ship crossing the water below the cliffs",
            focus: "40% 60%",
          }}
        />
        <ChapterRail chapters={CHAPTERS} label="Philosophy chapters" />

        {/* 1. The arch opens to the full view as the reader arrives. */}
        <section id="nature" className={styles.nature}>
          <div className={styles.natureFrame}>
            <Image
              src="/images/santorini/white-stair.jpg"
              alt="Sculpted white stair descending between curved walls toward the caldera"
              fill
              sizes="100vw"
              style={{ objectPosition: "50% 70%" }}
            />
          </div>
          <div className={styles.natureCopy}>
            <p className={ui.kicker}>01 · Architecture shaped by nature</p>
            <h2>
              We build the way <em>the island taught us.</em>
            </h2>
            <p>
              Thick lime-washed walls keep rooms cool. Arches carry the weight
              and frame the view. Courtyards hold the shade. VIERCYS borrows
              these forms rather than fighting them, so every room feels as if
              it grew out of the cliff.
            </p>
          </div>
        </section>

        {/* 2. Stone and sea slide toward each other and meet in the middle. */}
        <section id="earth-and-sea" className={styles.meet}>
          <div className={`${styles.meetPanel} ${styles.earth}`}>
            <Image
              src="/images/santorini/stone-door.jpg"
              alt="Weathered volcanic stone and a red timber door"
              fill
              sizes="(max-width: 860px) 100vw, 50vw"
            />
            <span>Earth</span>
          </div>
          <div className={styles.meetCopy}>
            <p className={ui.kicker}>02 · The relationship between earth and sea</p>
            <h2>
              Stone below.
              <br />
              <em>Water beyond.</em>
            </h2>
            <p>
              Santorini is a volcano filled by the sea. We let both sides of
              that story into every stay: the weight and warmth of stone,
              and the endless, moving blue on the other side of the wall.
            </p>
          </div>
          <div className={`${styles.meetPanel} ${styles.sea}`}>
            <Image
              src="/images/santorini/cliff-pools.jpg"
              alt="Terraces stepping down the cliff edge toward a deep blue Aegean"
              fill
              sizes="(max-width: 860px) 100vw, 50vw"
            />
            <span>Sea</span>
          </div>
        </section>

        {/* 3. The sentence is read word by word as it scrolls past. */}
        <section id="slow" className={styles.slow}>
          <p className={ui.kicker}>03 · Slow, intentional luxury</p>
          <h2 className={styles.visuallyHidden}>Slow, intentional luxury</h2>
          <p className={styles.slowText}>
            {SLOW.split(" ").map((word, index) => (
              <span key={index}>{word} </span>
            ))}
          </p>
        </section>

        {/* 4. Hospitality, told through the real guest journey. */}
        <section id="hospitality" className={styles.hospitality}>
          <header className={ui.sectionHead}>
            <p className={ui.kicker}>04 · Thoughtful hospitality</p>
            <h2>
              Anticipation, <em>not intrusion.</em>
            </h2>
            <p>
              Good hospitality is mostly invisible. It shows up as clarity
              before you arrive, help that is easy to ask for, and plans that
              are easy to change.
            </p>
          </header>
          <ScrollStory
            tone="light"
            chapters={[
              {
                title: "Clear before you arrive",
                body: "Prices include taxes, extras are optional, and online cancellation stays open until two days before arrival. No surprises at checkout.",
                photo: {
                  src: "/images/santorini/courtyard-door.jpg",
                  alt: "Whitewashed courtyard wall with a blue-shuttered window",
                  focus: "50% 60%",
                },
              },
              {
                title: "Close at hand while you stay",
                body: "Questions about your room, the island or your booking go to our concierge, one message away.",
                photo: {
                  src: "/images/santorini/caldera-table.jpg",
                  alt: "A small table and two chairs on a terrace above the caldera",
                  focus: "50% 62%",
                },
              },
              {
                title: "Easy to change",
                body: "My VIERCYS lets you view, extend or cancel your stay yourself, without a phone call or a form.",
                photo: {
                  src: "/images/santorini/sea-terrace.jpg",
                  alt: "White terrace with linen sofas and a wide sea view",
                  focus: "50% 60%",
                },
              },
            ]}
          />
        </section>

        {/* 5. The photograph pulls back to reveal the whole horizon. */}
        <section id="privacy" className={styles.privacy}>
          <div className={styles.privacyFrame}>
            <Image
              src="/images/santorini/oia-evening.jpg"
              alt="The sun setting over the Aegean beside the cliffside village of Oia"
              fill
              sizes="100vw"
            />
          </div>
          <div className={styles.privacyCopy}>
            <p className={ui.kicker}>05 · Privacy and personal connection</p>
            <h2>
              Twenty rooms.
              <br />
              <em>Never a crowd.</em>
            </h2>
            <p>
              A small hotel can afford to be personal. We keep VIERCYS
              deliberately small so that space, quiet and attention are never
              in short supply, and the view is yours alone.
            </p>
          </div>
        </section>

        {/* 6. Materials drift at different speeds, like layered walls. */}
        <section id="craft" className={styles.craft}>
          <header className={ui.sectionHead}>
            <p className={ui.kicker}>06 · Mediterranean craftsmanship</p>
            <h2>
              Four materials, <em>handled with care.</em>
            </h2>
            <p>
              Fewer materials, chosen for how they age, feel and hold the
              light. The same palette runs through every room.
            </p>
          </header>
          <ul
            className={styles.materials}
            tabIndex={0}
            aria-label="Materials, scrolls sideways on small screens"
          >
            {MATERIALS.map((material) => (
              <li key={material.name}>
                <div className={styles.materialPhoto}>
                  <Image
                    src={material.photo}
                    alt=""
                    fill
                    sizes="(max-width: 860px) 70vw, 24vw"
                    style={{ objectPosition: material.focus }}
                  />
                </div>
                <span
                  className={styles.swatch}
                  style={{ background: material.swatch }}
                  aria-hidden="true"
                />
                <h3>{material.name}</h3>
                <p>{material.line}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={sections.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">
            See where it <em>all comes together.</em>
          </h2>
          <div className={sections.closingActions}>
            <Link href="/rooms" className={ui.primary}>
              Explore rooms &amp; suites
            </Link>
            <BookLink className={ui.ghost} />
          </div>
          <p className={sections.note}>
            VIERCYS is a fictional hotel for a classroom project. Photographs
            show Santorini, not the property; see{" "}
            <Link href="/credits" className={ui.inlineLink}>
              photo credits
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
