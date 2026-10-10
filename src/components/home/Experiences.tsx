"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/catalog";
import { EXPERIENCES, confirmation } from "@/lib/experiences";
import styles from "./home.module.css";

/**
 * The optional extras guests can add while booking, told editorially.
 * Scrolling a chapter into view brings its photograph forward; every row also
 * shows its own photo on phones, so nothing depends on hover.
 */
const ITEMS = EXPERIENCES.filter((item) => item.id !== "transfer");

export function Experiences() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(Number((entry.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-35% 0px -45% 0px" },
    );
    root.current
      ?.querySelectorAll("li")
      .forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={root}
      className={styles.experiences}
      data-scene="experiences"
      data-chapter={active + 1}
    >
      <div className={styles.expStage} aria-hidden="true">
        <span className={styles.expProgress}>
          0{active + 1} / 0{ITEMS.length}
        </span>
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
          <li key={item.id} data-active={index === active} data-index={index}>
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
