"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./swipe.module.css";

/**
 * A small photo carousel built on native scroll-snap: swipe or scroll on
 * touch, previous/next buttons for mouse and keyboard. No autoplay.
 */
export function SwipeGallery({
  photos,
  label,
}: {
  photos: { src: string; alt: string }[];
  label: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  function go(step: number) {
    const node = track.current;
    if (!node) return;
    const next = Math.min(photos.length - 1, Math.max(0, index + step));
    node.scrollTo({
      left: next * node.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  return (
    <div className={styles.gallery} role="group" aria-label={label}>
      <div
        ref={track}
        className={styles.track}
        tabIndex={0}
        role="region"
        aria-label={`${label}, scroll sideways for more photos`}
        onScroll={(event) => {
          const node = event.currentTarget;
          setIndex(Math.round(node.scrollLeft / node.clientWidth));
        }}
      >
        {photos.map((photo, at) => (
          <div key={photo.src} className={styles.slide}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 860px) 100vw, 50vw"
              loading={at === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous photo"
          >
            <span aria-hidden="true">←</span>
          </button>
          <p aria-live="polite">
            {index + 1} / {photos.length}
          </p>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === photos.length - 1}
            aria-label="Next photo"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
