"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./cinematic.module.css";
const ArchScene = dynamic(() => import("./ArchScene"), { ssr: false });
const motionQuery =
  "(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const subscribe = (listener: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
const getSnapshot = () => window.matchMedia(motionQuery).matches;
const getServerSnapshot = () => false;
export default function ArchitecturalJourney() {
  const animated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const renderFrame = useRef<(() => void) | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const use3d = animated && !failed;
  useEffect(() => {
    if (!animated || !root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const driver = { position: 0 };
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 2.5,
          pin: true,
          scrub: 0.65,
          invalidateOnRefresh: true,
          onUpdate: () => renderFrame.current?.(),
        },
      });
      timeline.to(
        driver,
        {
          position: 1,
          duration: 1,
          ease: "none",
          onUpdate: () => {
            progress.current = driver.position;
            root.current?.style.setProperty(
              "--journey",
              String(driver.position),
            );
            root.current?.setAttribute(
              "data-scroll-progress",
              driver.position.toFixed(3),
            );
            renderFrame.current?.();
          },
        },
        0,
      );
      timeline.fromTo(
        "[data-courtyard]",
        { scale: 1.02, xPercent: 0 },
        { scale: 1.17, xPercent: -2.5, ease: "none", duration: 0.8 },
        0,
      );
      timeline.to(
        "[data-opening-copy]",
        { opacity: 0, y: -35, duration: 0.18 },
        0.12,
      );
      timeline.fromTo(
        "[data-sea-copy]",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.16 },
        0.36,
      );
      timeline.to(
        "[data-sea-copy]",
        { opacity: 0, y: -25, duration: 0.12 },
        0.68,
      );
      timeline.fromTo(
        "[data-suite]",
        { opacity: 0, scale: 1.18 },
        { opacity: 1, scale: 1, duration: 0.23 },
        0.77,
      );
      timeline.fromTo(
        "[data-suite-copy]",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.16 },
        0.84,
      );
    }, root);
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    return () => {
      context.revert();
      window.removeEventListener("load", refresh);
    };
  }, [animated]);
  return (
    <section
      ref={root}
      className={styles.journey}
      data-cinematic="architectural-journey"
      data-render-mode={use3d && sceneReady ? "3d" : "2d"}
      aria-label="A passage through limestone, sea and sanctuary"
    >
      <div className={styles.stage}>
        <div className={styles.courtyard} data-courtyard>
          <Image
            src="/images/architecture.jpg"
            fill
            sizes="100vw"
            alt="Sunlit Mediterranean architecture overlooking the Aegean"
          />
        </div>
        <div className={styles.photoShade} />
        <div className={styles.portalFallback} aria-hidden="true" />
        {use3d && (
          <div className={styles.canvas}>
            <ArchScene
              progress={progress}
              renderRef={renderFrame}
              onReady={() => setSceneReady(true)}
              onFailure={() => setFailed(true)}
            />
          </div>
        )}
        <div className={styles.openingCopy} data-opening-copy>
          <p className={styles.kicker}>A passage to something quieter</p>
          <h2>
            Follow the light.
            <br />
            <em>Find your stillness.</em>
          </h2>
          <p>
            Stone holds the warmth.
            <br />
            Beyond the arch, the sea opens.
          </p>
        </div>
        <div className={styles.seaCopy} data-sea-copy>
          <p className={styles.kicker}>Where Earth Meets the Sea</p>
          <h2>
            Architecture
            <br />
            that lets <em>you breathe.</em>
          </h2>
          <p>
            Layers of limestone. Changing sunlight.
            <br />A horizon that feels entirely your own.
          </p>
        </div>
        <div className={styles.suitePhoto} data-suite>
          <Image
            src="/images/suite.jpg"
            fill
            sizes="100vw"
            alt="A light-filled suite with warm natural materials and generous seating"
          />
        </div>
        <div className={styles.suiteCopy} data-suite-copy>
          <p className={styles.kicker}>Your Santorini sanctuary</p>
          <h2>
            Twenty rooms.
            <br />
            <em>A world of your own.</em>
          </h2>
          <p>
            Essential Rooms, Signature Suites and Grand Sanctuaries. Find the
            room that fits your stay.
          </p>
          <Link href="/book" className={styles.action}>
            View rooms & availability <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className={styles.progressLabel} aria-hidden="true">
          <span>Stone</span>
          <span>Sun</span>
          <span>Sea</span>
          <span>Sanctuary</span>
        </div>
        <Link href="/#reservation" className={styles.skip}>
          Skip to booking ↓
        </Link>
      </div>
    </section>
  );
}
