"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Chapter } from "@/lib/rooms-editorial";
import styles from "./room.module.css";

/**
 * Scroll-told chapters: on wide screens the photograph stays pinned and
 * changes as each chapter reaches the middle of the viewport. On phones each
 * chapter carries its own photo inline, so nothing depends on the effect.
 */
export function RoomStory({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(Number((entry.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const item of items.current) if (item) observer.observe(item);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={styles.story}>
      <div className={styles.storyFrame} aria-hidden="true">
        {chapters.map((chapter, index) => (
          <div
            key={chapter.title}
            className={styles.storyPhoto}
            data-active={index === active}
          >
            <Image
              src={chapter.photo.src}
              alt=""
              fill
              sizes="45vw"
              style={{ objectPosition: chapter.photo.focus }}
            />
          </div>
        ))}
        <p className={styles.storyCount}>
          0{active + 1} <span>/ 0{chapters.length}</span>
        </p>
      </div>
      <ol className={styles.chapters}>
        {chapters.map((chapter, index) => (
          <li
            key={chapter.title}
            ref={(node) => {
              items.current[index] = node;
            }}
            data-index={index}
            data-active={index === active}
            className={styles.chapter}
          >
            <div className={styles.chapterPhoto}>
              <Image
                src={chapter.photo.src}
                alt={chapter.photo.alt}
                fill
                sizes="100vw"
                style={{ objectPosition: chapter.photo.focus }}
              />
            </div>
            <p className={styles.chapterNumber}>0{index + 1}</p>
            <h3>{chapter.title}</h3>
            <p>{chapter.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
