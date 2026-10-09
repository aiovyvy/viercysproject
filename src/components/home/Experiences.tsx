"use client";
import Image from "next/image";
import { useState } from "react";
import { EXTRAS, money } from "@/lib/catalog";
import styles from "./home.module.css";

/**
 * The optional extras guests can add while booking, told editorially. Prices
 * and confirmation rules come from EXTRAS; nothing here is bookable on its
 * own. Hovering a row brings its photograph forward.
 */
const STORIES: Record<
  string,
  { title: string; line: string; photo: string; alt: string }
> = {
  sailing: {
    title: "Sunset sailing",
    line: "Leave the cliffs behind and watch the caldera turn gold from the water.",
    photo: "/images/santorini/sailing.jpg",
    alt: "A white motor yacht crossing the blue caldera below Santorini's cliffs",
  },
  dinner: {
    title: "A table for two",
    line: "A private dinner set for the hour when the sea goes quiet.",
    photo: "/images/santorini/caldera-table.jpg",
    alt: "A small table and two chairs on a terrace above the caldera at dusk",
  },
  spa: {
    title: "Spa ritual",
    line: "Warm stone, cool water and an unhurried hour that belongs to you.",
    photo: "/images/santorini/cliff-pools.jpg",
    alt: "Terraces stepping down the cliff edge toward a deep blue Aegean",
  },
  breakfast: {
    title: "Breakfast in the sun",
    line: "Slow mornings, island produce and the whole horizon for company.",
    photo: "/images/santorini/sea-terrace.jpg",
    alt: "White terrace with linen sofas, potted olive trees and a wide sea view",
  },
};
const ITEMS = EXTRAS.filter((extra) => extra.id in STORIES);

export function Experiences() {
  const [active, setActive] = useState(0);
  return (
    <div className={styles.experiences}>
      <div className={styles.expStage} aria-hidden="true">
        {ITEMS.map((extra, index) => (
          <div
            key={extra.id}
            className={styles.expPhoto}
            data-active={index === active}
          >
            <Image
              src={STORIES[extra.id].photo}
              alt=""
              fill
              sizes="(max-width: 860px) 100vw, 42vw"
            />
          </div>
        ))}
      </div>
      <ol className={styles.expList}>
        {ITEMS.map((extra, index) => {
          const story = STORIES[extra.id];
          return (
            <li
              key={extra.id}
              data-active={index === active}
              onMouseEnter={() => setActive(index)}
            >
              <div className={styles.expThumb}>
                <Image
                  src={story.photo}
                  alt={story.alt}
                  fill
                  sizes="(max-width: 860px) 100vw, 1px"
                />
              </div>
              <span className={styles.expNumber}>0{index + 1}</span>
              <div className={styles.expText}>
                <h3>{story.title}</h3>
                <p>{story.line}</p>
              </div>
              <p className={styles.expMeta}>
                {money(extra.price)}
                <small>{extra.unit}</small>
                <small>
                  {extra.status === "pending-approval"
                    ? "Request while booking · confirmed by our team"
                    : "Add while booking"}
                </small>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
