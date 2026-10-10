"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./rail.module.css";

/**
 * Sticky chapter index for long editorial pages. It marks the chapter in
 * view, shows reading progress and jumps to any chapter. Works by tap,
 * keyboard and scroll alike; without JavaScript it is a plain link list.
 */
export function ChapterRail({
  chapters,
  label,
}: {
  chapters: { id: string; label: string }[];
  label: string;
}) {
  const [active, setActive] = useState(chapters[0]?.id);
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const chapter of chapters) {
      const section = document.getElementById(chapter.id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [chapters]);
  useEffect(() => {
    // Keep the active chip visible on narrow screens.
    const link = list.current?.querySelector<HTMLElement>(
      `[href="#${active}"]`,
    );
    const rail = list.current;
    if (link && rail && rail.scrollWidth > rail.clientWidth)
      rail.scrollTo({
        left: link.offsetLeft - 20,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? "auto"
          : "smooth",
      });
  }, [active]);
  const index = Math.max(
    0,
    chapters.findIndex((chapter) => chapter.id === active),
  );
  return (
    <nav className={styles.rail} aria-label={label}>
      <ol ref={list}>
        {chapters.map((chapter, at) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              aria-current={chapter.id === active ? "step" : undefined}
            >
              <span aria-hidden="true">{String(at + 1).padStart(2, "0")}</span>
              {chapter.label}
            </a>
          </li>
        ))}
      </ol>
      <div className={styles.progress} aria-hidden="true">
        <span
          style={{ transform: `scaleX(${(index + 1) / chapters.length})` }}
        />
      </div>
    </nav>
  );
}
