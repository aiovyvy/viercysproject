"use client";
import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { CATEGORIES, money } from "@/lib/catalog";
import { ROOM_EDITORIAL } from "@/lib/rooms-editorial";
import styles from "./home.module.css";

/**
 * Three architectural panels, one per room category. The chosen panel opens
 * wide; the others stay as slender arches. Tabs follow the ARIA pattern, so
 * arrow keys, Home and End move between rooms.
 */
export function RoomsShowcase() {
  const [active, setActive] = useState(0);
  const id = useId();
  const hover = useRef<number | undefined>(undefined);
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
  // Fine pointers preview a room on a short, deliberate hover.
  function preview(index: number) {
    window.clearTimeout(hover.current);
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    hover.current = window.setTimeout(() => setActive(index), 140);
  }
  return (
    <div className={styles.showcase}>
      <div
        className={styles.slats}
        role="tablist"
        aria-label="Rooms and suites"
        onMouseLeave={() => window.clearTimeout(hover.current)}
      >
        {CATEGORIES.map((item, index) => {
          const photo = ROOM_EDITORIAL[item.id].heroPhoto;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-controls={`${id}-panel`}
              aria-selected={active === index}
              tabIndex={active === index ? 0 : -1}
              className={styles.slat}
              onClick={() => setActive(index)}
              onMouseEnter={() => preview(index)}
              onKeyDown={(event) => keyboard(event, index)}
            >
              <Image
                src={photo.src}
                alt=""
                fill
                sizes="(max-width: 860px) 100vw, 60vw"
                style={{ objectPosition: photo.focus }}
              />
              <span className={styles.slatName}>{item.name}</span>
            </button>
          );
        })}
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
  );
}
