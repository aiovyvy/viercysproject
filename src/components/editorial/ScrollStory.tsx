"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./story.module.css";

export type StoryChapter = {
  title: string;
  body: string;
  photo: { src: string; alt: string; focus?: string };
  /** Optional small label above the title, e.g. a status or place. */
  label?: string;
  /** Optional facts or links shown under the body. */
  extra?: React.ReactNode;
};

/**
 * Scroll-told chapters: on wide screens the arched photograph stays pinned
 * and changes as each chapter reaches the middle of the viewport. On phones
 * each chapter carries its own photo inline, so nothing depends on the
 * effect, on hover, or on JavaScript.
 */
export function ScrollStory({
  chapters,
  tone = "dark",
}: {
  chapters: StoryChapter[];
  tone?: "dark" | "light";
}) {
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
    <div className={styles.story} data-tone={tone}>
      <div className={styles.frame} aria-hidden="true">
        {chapters.map((chapter, index) => (
          <div
            key={chapter.title}
            className={styles.photo}
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
        <p className={styles.count}>
          {String(active + 1).padStart(2, "0")}{" "}
          <span>/ {String(chapters.length).padStart(2, "0")}</span>
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
            <div className={styles.inlinePhoto}>
              <Image
                src={chapter.photo.src}
                alt={chapter.photo.alt}
                fill
                sizes="100vw"
                style={{ objectPosition: chapter.photo.focus }}
              />
            </div>
            <p className={styles.number}>
              {String(index + 1).padStart(2, "0")}
              {chapter.label && <span> · {chapter.label}</span>}
            </p>
            <h3>{chapter.title}</h3>
            <p className={styles.body}>{chapter.body}</p>
            {chapter.extra}
          </li>
        ))}
      </ol>
    </div>
  );
}
