"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { photos } from "./data";
import SuitePreview from "@/components/cinematic/SuitePreview";
import { CATEGORIES, CURRENCY } from "@/lib/catalog";
import ArchitecturalJourney from "@/components/cinematic/ArchitecturalJourney";

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
function useVoucherActive() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/invite", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => live && setActive(result.active === true))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return active;
}
export function BookLink({ className }: { className: string }) {
  const voucher = useVoucherActive();
  return (
    <Link className={className} href="/book">
      {voucher ? "Claim your 3-night stay" : "Book a stay"}
    </Link>
  );
}
export function Navigation() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const inFlow = path.startsWith("/book") || path.startsWith("/invite");
  // Room pages show their own room-specific booking dock on phones.
  const roomPage = path.startsWith("/rooms/");
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    // Escape or a tap outside closes the menu; Escape returns focus to it.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="nav" ref={header}>
        <Link href="/" className="wordmark" aria-label="VIERCYS home">
          VIERCYS<span>HOTELS & RESORTS</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className={open ? "navlinks open" : "navlinks"}
        >
          <Link href="/#story" onClick={() => setOpen(false)}>
            Our philosophy
          </Link>
          <Link href="/destinations" onClick={() => setOpen(false)}>
            Destinations
          </Link>
          <Link href="/my-stay" onClick={() => setOpen(false)}>
            My VIERCYS
          </Link>
          <Link href="/concierge" onClick={() => setOpen(false)}>
            Concierge
          </Link>
          <Link href="/faq" onClick={() => setOpen(false)}>
            FAQ
          </Link>
        </nav>
        {!inFlow && <BookLink className="book" />}
        <button
          ref={toggle}
          className="menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {!inFlow && !roomPage && (
        <nav aria-label="Quick booking">
          <BookLink className="mobile-book-action" />
        </nav>
      )}
    </>
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
        gsap.to(".hero-photo", {
          yPercent: 18,
          scale: 1.08,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
        gsap.to(".hero-copy", {
          yPercent: -25,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }, root);
      return () => ctx.revert();
    });
    mm.add(
      "(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const gallery = root.current?.querySelector(".destinations");
        gallery?.classList.add("is-animated");
        const ctx = gsap.context(() => {
          const travel = gsap.to(".destination-track", {
            x: () =>
              -Math.max(
                0,
                (document.querySelector(".destination-track") as HTMLElement)
                  .scrollWidth -
                  window.innerWidth +
                  96,
              ),
            ease: "none",
            scrollTrigger: {
              trigger: ".destinations",
              start: "top top",
              end: "+=1200",
              scrub: 1,
              pin: true,
              invalidateOnRefresh: true,
            },
          });
          gsap.utils
            .toArray<HTMLElement>(".destination-image")
            .forEach((photo) => {
              const image = photo.querySelector("img");
              if (image)
                gsap.fromTo(
                  image,
                  { xPercent: 7, scale: 1.16 },
                  {
                    xPercent: -7,
                    ease: "none",
                    scrollTrigger: {
                      trigger: photo,
                      containerAnimation: travel,
                      start: "left right",
                      end: "right left",
                      scrub: true,
                    },
                  },
                );
            });
        }, root);
        return () => {
          ctx.revert();
          gallery?.classList.remove("is-animated");
        };
      },
    );
    return () => mm.revert();
  }, []);
  return (
    <div ref={root}>
      <Navigation />
      <main id="main">
        <section className="hero">
          <div className="hero-photo">
            <Photo
              src={photos.hero}
              alt="Sunlit white architecture overlooking the blue Santorini caldera"
              priority
            />
          </div>
          <div className="hero-shade" />
          <div className="hero-top">
            <span>AN AEGEAN STATE OF MIND</span>
            <span>SANTORINI · GREECE</span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">THE ART OF BEING HERE</p>
            <h1>
              Where Earth
              <br />
              Meets <em>the Sea.</em>
            </h1>
            <div className="hero-bottom">
              <div>
                <BookLink className="hero-book" />
                <p>
                  A quieter world. A deeper blue.
                  <br />A place to return to yourself.
                </p>
              </div>
              <a href="#story" className="discover">
                SCROLL TO DISCOVER <span>↓</span>
              </a>
            </div>
          </div>
          <span className="hero-number">36°27′ N &nbsp; 25°22′ E</span>
        </section>
        <ArchitecturalJourney />
        <section id="reservation" className="reservation">
          <div className="reservation-heading">
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <p>
              You book the stay. <em>We curate the experience.</em>
            </p>
          </div>
          <ol className="booking-steps" aria-label="How booking works">
            <li>
              <strong>1. Choose your dates</strong>
              <span>Three nights are suggested; stay longer if you like.</span>
            </li>
            <li>
              <strong>2. Pick a room</strong>
              <span>See who each room sleeps and its exact price.</span>
            </li>
            <li>
              <strong>3. Confirm</strong>
              <span>Review the total, confirm, then manage your stay.</span>
            </li>
          </ol>
          <BookLink className="reservation-cta" />
          <p className="demo-note">
            VIERCYS is a fictional hotel for a classroom demonstration. Prices
            and payments are simulated.
          </p>
        </section>
        <section id="story" className="intro">
          <p className="eyebrow">
            THE VIERCYS PHILOSOPHY <span>01 /</span>
          </p>
          <div>
            <h2>
              Some places are visited.
              <br />
              Others are <em>felt.</em>
            </h2>
            <div className="intro-bottom">
              <span className="sun-symbol" aria-hidden="true">
                ✳
              </span>
              <p>
                Carved from limestone. Softened by sunlight. Open to the endless
                Aegean. We believe true luxury is the space to slow down — and
                the freedom to feel completely somewhere else.
              </p>
            </div>
          </div>
        </section>
        <SuitePreview
          categories={CATEGORIES.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            capacity: category.capacity,
            inventory: category.inventory,
            nightlyRate: category.rate / 100,
            currency: CURRENCY,
            amenities: [...category.amenities],
          }))}
        />
        <section id="destinations" className="destinations">
          <div className="destination-heading">
            <div>
              <p className="eyebrow">ONE PHILOSOPHY. NEW HORIZONS.</p>
              <h2>
                The world, <em>at our pace.</em>
              </h2>
            </div>
            <Link href="/destinations" className="gallery-hint">
              VIEW ALL DESTINATIONS ↗
            </Link>
          </div>
          <div className="destination-track">
            {[
              {
                name: "Santorini",
                country: "GREECE",
                photo: photos.hero,
                live: true,
              },
              {
                name: "Boracay",
                country: "PHILIPPINES",
                photo: photos.boracay,
              },
              { name: "Amalfi", country: "ITALY", photo: photos.amalfi },
              { name: "Bali", country: "INDONESIA", photo: photos.bali },
            ].map((d, i) => (
              <article className="destination" key={d.name}>
                <div className="destination-image">
                  <Photo
                    src={d.photo}
                    alt={`${d.name} destination landscape`}
                  />
                  <span className="destination-status">
                    {d.live ? "OUR FIRST ADDRESS" : "COMING SOON"}
                  </span>
                </div>
                <div className="destination-meta">
                  <span>
                    0{i + 1} / {d.country}
                  </span>
                  {d.live ? (
                    <Link href="/santorini">
                      <h3>
                        {d.name} <span>↗</span>
                      </h3>
                    </Link>
                  ) : (
                    <h3>{d.name}</h3>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="closing">
          <p className="eyebrow">THE SEA IS CALLING</p>
          <h2>
            Make room
            <br />
            for <em>something beautiful.</em>
          </h2>
          <BookLink className="closing-cta" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <Link href="/" className="wordmark">
          VIERCYS<span>HOTELS & RESORTS</span>
        </Link>
        <p>Where Earth Meets the Sea.</p>
      </div>
      <nav className="footer-links" aria-label="Footer">
        <ul>
          <li>
            <Link href="/santorini">Santorini</Link>
          </li>
          <li>
            <Link href="/destinations">Destinations</Link>
          </li>
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/faq">FAQ</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
        <ul>
          <li>
            <Link href="/book">Book a stay</Link>
          </li>
          <li>
            <Link href="/lookup">Find my booking</Link>
          </li>
          <li>
            <Link href="/privacy">Privacy</Link>
          </li>
          <li>
            <Link href="/terms">Terms</Link>
          </li>
          <li>
            <Link href="/accessibility">Accessibility</Link>
          </li>
        </ul>
      </nav>
      <div className="footer-legal">
        <span>
          © {new Date().getFullYear()} VIERCYS · Fictional concept hotel
        </span>
        <small>
          Classroom demonstration: no real bookings or payments. Temporary
          editorial photography, not original property photographs.{" "}
          <Link href="/admin">Staff</Link>
        </small>
      </div>
    </footer>
  );
}
