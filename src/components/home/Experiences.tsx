"use client";
import Image from "next/image";
import { useState } from "react";
import { money } from "@/lib/catalog";
import { EXPERIENCES, confirmation } from "@/lib/experiences";
import styles from "./home.module.css";

/**
 * The optional extras guests can add while booking, told editorially.
 * Hovering a row on desktop brings its photograph forward; every row also
 * shows its own photo on phones, so nothing depends on hover.
 */
const ITEMS = EXPERIENCES.filter((item) => item.id !== "transfer");

export function Experiences() {
  const [active, setActive] = useState(0);
  return (
    <div className={styles.experiences}>
      <div className={styles.expStage} aria-hidden="true">
        {ITEMS.map((item, index) => (
          <div
            key={item.id}
            className={styles.expPhoto}
            data-active={index === active}
          >
            <Image
              src={item.photos[0].src}
              alt=""
              fill
              sizes="(max-width: 860px) 100vw, 42vw"
            />
          </div>
        ))}
      </div>
      <ol className={styles.expList}>
        {ITEMS.map((item, index) => (
          <li
            key={item.id}
            data-active={index === active}
            onMouseEnter={() => setActive(index)}
          >
            <div className={styles.expThumb}>
              <Image
                src={item.photos[0].src}
                alt={item.photos[0].alt}
                fill
                sizes="(max-width: 860px) 100vw, 1px"
              />
            </div>
            <span className={styles.expNumber}>0{index + 1}</span>
            <div className={styles.expText}>
              <h3>{item.title}</h3>
              <p>{item.line}</p>
            </div>
            <p className={styles.expMeta}>
              {money(item.price)}
              <small>{item.unit}</small>
              <small>{confirmation(item.instant)}</small>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
