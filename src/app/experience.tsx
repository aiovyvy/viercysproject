"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { photos } from "./data";
import { StaySearch } from "@/components/editorial/StaySearch";
import { RoomsShowcase } from "@/components/home/RoomsShowcase";
import { Experiences } from "@/components/home/Experiences";
import { FinalInvitation } from "@/components/home/FinalInvitation";
import { ScrollReveal } from "@/components/editorial/ScrollReveal";
import { ScrollStory } from "@/components/editorial/ScrollStory";
import home from "@/components/home/home.module.css";
import { DESTINATIONS } from "@/lib/destinations";
import ArchitecturalJourney from "@/components/cinematic/ArchitecturalJourney";
import { BookLink } from "@/components/site/BookLink";

// The site chrome lives in components/site; these names are kept for the
// many pages that import them from here.
export { BookLink } from "@/components/site/BookLink";
export { SiteHeader as Navigation } from "@/components/site/SiteHeader";
export { SiteFooter as Footer } from "@/components/site/SiteFooter";
import { SiteHeader as Navigation } from "@/components/site/SiteHeader";
import { SiteFooter as Footer } from "@/components/site/SiteFooter";

export function Photo({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 760px) 100vw, 85vw"
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        // Exterior approach: the photo recedes and the copy lifts as the
        // visitor scrolls toward the arch passage.
        gsap.to("[data-hero-photo]", {
          yPercent: 14,
          scale: 1.06,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hero]",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
        gsap.to("[data-hero-copy]", {
          yPercent: -18,
          opacity: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hero]",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  return (
    <div ref={root}>
      <Navigation />
      <main id="main" className={home.page}>
        <section className={home.hero} data-hero aria-labelledby="hero-title">
          <div className={home.heroPhoto} data-hero-photo>
            <Photo
              src={photos.hero}
              alt="Sunlit white architecture and blue domes above the Santorini caldera"
              priority
            />
          </div>
          <div className={home.heroShade} />
          <p className={home.heroCoords} aria-hidden="true">
            36°27′ N · 25°22′ E
          </p>
          <div className={home.heroCopy} data-hero-copy>
            <p className={home.kicker}>VIERCYS Santorini · Greece</p>
            <h1 id="hero-title">
              Where Earth
              <br />
              Meets <em>the Sea.</em>
            </h1>
            <div className={home.heroAside}>
              <p>
                A limestone retreat above the Aegean, made for slow mornings,
                long horizons and evenings that end in gold.
              </p>
              <div className={home.heroActions}>
                <BookLink className={`hero-book ${home.primaryLight}`} />
                <a href="#rooms" className={home.ghostLight}>
                  Explore rooms &amp; suites
                </a>
              </div>
            </div>
          </div>
          <div className={home.heroSearch}>
            <StaySearch variant="bar" idPrefix="hero" />
          </div>
        </section>

        <section
          id="reservation"
          className={home.plan}
          aria-labelledby="plan-title"
        >
          <div className={home.planIntro}>
            <p className={home.kicker}>Plan your stay</p>
            <h2 id="plan-title">
              Three steps to <em>the Aegean.</em>
            </h2>
            <ol className={home.steps} aria-label="How booking works">
              <li>
                <strong>Choose your dates</strong>
                <span>Three nights are suggested. Stay up to thirty.</span>
              </li>
              <li>
                <strong>Pick your room</strong>
                <span>See who it sleeps and its exact price.</span>
              </li>
              <li>
                <strong>Confirm and relax</strong>
                <span>Review the total, confirm, then manage your stay.</span>
              </li>
            </ol>
            <p className={home.planHelp}>
              First time here? <BookLink className={home.inlineLink} /> opens a
              guided booking with a short walkthrough.
            </p>
          </div>
          <div className={home.planCard}>
            <StaySearch variant="card" idPrefix="plan" />
            <p className={home.planNote}>
              Invited guests redeem their complimentary nights when they
              confirm. VIERCYS is a fictional hotel for a classroom project;
              prices and payments are simulated.
            </p>
          </div>
        </section>

        <ArchitecturalJourney />
        <ScrollReveal scene="courtyard" className={home.courtyardReveal}>
          <div className={home.courtyardImage}>
            <Image
              src="/images/architecture.jpg"
              alt="Limestone terraces opening toward the Aegean"
              fill
              sizes="100vw"
            />
          </div>
          <div className={home.courtyardCopy}>
            <p className={home.kicker}>You have arrived</p>
            <h2>
              Stone, sunlight.
              <br />
              <em>Space to breathe.</em>
            </h2>
          </div>
        </ScrollReveal>

        <section
          id="story"
          className={home.story}
          aria-labelledby="story-title"
        >
          <div className={home.storyCopy}>
            <p className={home.kicker}>The VIERCYS philosophy</p>
            <h2 id="story-title">
              Some places are visited.
              <br />
              Others are <em>felt.</em>
            </h2>
            <p className={home.storyLead}>
              Carved from limestone. Softened by sunlight. Open to the endless
              Aegean. We believe true luxury is the space to slow down, and the
              freedom to feel completely somewhere else.
            </p>
            <Link href="/about" className={home.textLink}>
              Read the VIERCYS story <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={home.philosophyChapters}>
            <ScrollStory
              tone="light"
              chapters={[
                {
                  title: "Shaped by the island",
                  label: "Earth",
                  body: "Thick walls, deep shade and arches that frame the sea, the way Cycladic houses have always been built.",
                  photo: {
                    src: "/images/santorini/stone-door.jpg",
                    alt: "Volcanic stone and a shaded doorway",
                  },
                },
                {
                  title: "Slow by design",
                  label: "Sea",
                  body: "Twenty rooms, no crowds, and days without a timetable.",
                  photo: {
                    src: "/images/santorini/sea-terrace.jpg",
                    alt: "An open terrace above the Aegean",
                  },
                },
                {
                  title: "Personal by choice",
                  label: "Hospitality",
                  body: "Thoughtful hospitality that notices, and then gives you room.",
                  photo: {
                    src: "/images/santorini/caldera-table.jpg",
                    alt: "A terrace table prepared for two",
                  },
                },
              ]}
            />
          </div>
        </section>

        <section
          id="rooms"
          className={home.rooms}
          aria-labelledby="rooms-title"
        >
          <header className={home.sectionHead}>
            <p className={home.kicker}>Rooms &amp; suites</p>
            <h2 id="rooms-title">
              Find your <em>kind of quiet.</em>
            </h2>
            <p>
              Three ways to stay, from an intimate courtyard room to a sanctuary
              with the whole horizon.
            </p>
          </header>
          <RoomsShowcase />
        </section>

        <section
          id="experiences"
          className={home.experiencesSection}
          aria-labelledby="experiences-title"
        >
          <header className={home.sectionHead}>
            <p className={home.kicker}>Experiences</p>
            <h2 id="experiences-title">
              The island, <em>at your pace.</em>
            </h2>
            <p>
              Add any of these while you book. Some are confirmed instantly;
              others are requests our team confirms before your stay.
            </p>
          </header>
          <Experiences />
        </section>

        <section
          id="destinations"
          className={home.destination}
          aria-labelledby="destination-title"
        >
          <div className={home.spotlight}>
            <ScrollReveal scene="horizon" className={home.spotlightPhoto}>
              <Image
                src="/images/santorini/fira-sunset.jpg"
                alt="The sun setting over the caldera, seen from Fira"
                fill
                sizes="(max-width: 860px) 100vw, 45vw"
              />
            </ScrollReveal>
            <div className={home.spotlightCopy}>
              <p className={home.kicker}>Our first address · Bookable now</p>
              <h2 id="destination-title">
                Santorini, <em>where the sea fills a volcano.</em>
              </h2>
              <p>
                The island curves around a flooded caldera. Whitewashed villages
                line its rim, and every evening the cliffs turn gold above the
                water.
              </p>
              <dl className={home.spotlightFacts}>
                <div>
                  <dt>Island</dt>
                  <dd>Santorini, Cyclades</dd>
                </div>
                <div>
                  <dt>Sea</dt>
                  <dd>Aegean</dd>
                </div>
                <div>
                  <dt>Rooms</dt>
                  <dd>20</dd>
                </div>
              </dl>
              <Link href="/santorini" className={home.primary}>
                Discover Santorini
              </Link>
            </div>
          </div>
          <div className={home.horizons}>
            <div className={home.horizonsHead}>
              <h3>Next horizons</h3>
              <p>
                Future destinations we are dreaming about. They are not open for
                reservations.
              </p>
              <Link href="/destinations" className={home.textLink}>
                View all destinations <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div
              className={home.horizonScroll}
              role="region"
              aria-label="Future destinations, scrolls sideways on small screens"
              tabIndex={0}
            >
              <ul className={home.horizonList}>
                {DESTINATIONS.filter((place) => !place.bookable).map(
                  (place) => (
                    <li key={place.name}>
                      <div className={home.horizonPhoto}>
                        <Image
                          src={place.photo.src}
                          alt={place.photo.alt}
                          fill
                          sizes="(max-width: 860px) 60vw, 20vw"
                        />
                      </div>
                      <p>
                        <strong>{place.name}</strong> {place.country} · Coming
                        soon
                      </p>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </section>

        <FinalInvitation />
      </main>
      <Footer />
    </div>
  );
}
