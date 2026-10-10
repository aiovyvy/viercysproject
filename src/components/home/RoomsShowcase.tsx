"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CATEGORIES, money } from "@/lib/catalog";
import { ROOM_EDITORIAL } from "@/lib/rooms-editorial";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollStory } from "@/components/editorial/ScrollStory";
import styles from "./home.module.css";

/**
 * Scroll crossfades a fixed-size room composition on desktop.
 * Tabs follow the ARIA pattern, so
 * arrow keys, Home and End move between rooms.
 */
export function RoomsShowcase() {
  const [active, setActive] = useState(0);
  const id = useId();
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 861px) and (prefers-reduced-motion: no-preference)",
      () => {
        const context = gsap.context(() => {
          ScrollTrigger.create({
            trigger: stage.current,
            start: "top 110px",
            end: "+=1200",
            pin: true,
            refreshPriority: 5,
            onUpdate: (self) =>
              setActive(Math.min(2, Math.floor(self.progress * 3))),
          });
        }, stage);
        return () => context.revert();
      },
    );
    return () => media.revert();
  }, []);
  const room = CATEGORIES[active];
  const editorial = ROOM_EDITORIAL[room.id];
  const count = CATEGORIES.length;
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % count
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index + count - 1) % count
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  }
  return (
    <>
      <div ref={stage} className={styles.showcase} data-scene="rooms">
        <div className={styles.roomGallery}>
          <div
            className={styles.roomVisual}
            data-room-visual
            aria-hidden="true"
          >
            {CATEGORIES.map((item, index) => {
              const photo = ROOM_EDITORIAL[item.id].heroPhoto;
              return (
                <div
                  key={item.id}
                  className={styles.roomPhoto}
                  data-room-photo
                  data-active={active === index}
                >
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="(max-width: 860px) 100vw, 55vw"
                    style={{ objectPosition: photo.focus }}
                  />
                </div>
              );
            })}
          </div>
          <div
            className={styles.roomTabs}
            role="tablist"
            aria-label="Rooms and suites"
          >
            {CATEGORIES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-controls={`${id}-panel`}
                aria-selected={active === index}
                tabIndex={active === index ? 0 : -1}
                className={styles.roomTab}
                onClick={() => setActive(index)}
                onKeyDown={(event) => keyboard(event, index)}
              >
                <span aria-hidden="true">0{index + 1} </span>
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${active}`}
          className={styles.roomPanel}
          key={room.id}
        >
          <p className={styles.kicker}>{editorial.mood}</p>
          <h3>{room.name}</h3>
          <p className={styles.roomHook}>{editorial.hook}</p>
          <dl className={styles.roomFacts}>
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
          <p className={styles.roomNote}>
            {room.view} view · {room.amenities.slice(0, 3).join(" · ")}. Per
            night, taxes included.
          </p>
          <div className={styles.roomActions}>
            <Link href={`/rooms/${room.id}`} className={styles.primary}>
              Discover the {room.name}
            </Link>
            <Link href="/book/rooms" className={styles.textLink}>
              See rooms and prices <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.mobileRooms}>
        <ScrollStory
          tone="light"
          chapters={CATEGORIES.map((item) => ({
            title: item.name,
            body: ROOM_EDITORIAL[item.id].hook,
            photo: ROOM_EDITORIAL[item.id].heroPhoto,
            label: `${money(item.rate)} / night`,
            extra: (
              <Link className={styles.primary} href={`/rooms/${item.id}`}>
                Discover the {item.name}
              </Link>
            ),
          }))}
        />
      </div>
    </>
  );
}
