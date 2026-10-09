"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/rooms-editorial";
import styles from "./room.module.css";

/**
 * Asymmetric photo mosaic that opens a full-screen lightbox. The lightbox is
 * a native <dialog>, so focus is trapped and restored by the browser; arrow
 * keys, buttons, thumbnails and horizontal swipes all move between photos.
 */
export function RoomGallery({
  photos,
  roomName,
}: {
  photos: Photo[];
  roomName: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = photos.length;
  const go = useCallback(
    (step: number) => setIndex((value) => (value + step + count) % count),
    [count],
  );
  function open(at: number) {
    setIndex(at);
    dialog.current?.showModal();
  }
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const onKey = (event: KeyboardEvent) => {
      if (!node.open) return;
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    // Lock page scroll behind the open lightbox.
    const lock = () => (document.documentElement.style.overflow = "hidden");
    const unlock = () => (document.documentElement.style.overflow = "");
    const observer = new MutationObserver(() =>
      node.open ? lock() : unlock(),
    );
    observer.observe(node, { attributes: true, attributeFilter: ["open"] });
    document.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      unlock();
      document.removeEventListener("keydown", onKey);
    };
  }, [go]);
  const photo = photos[index];
  return (
    <>
      <div className={styles.mosaic}>
        {photos.map((item, at) => (
          <button
            key={item.src}
            type="button"
            className={styles.tile}
            onClick={() => open(at)}
            aria-label={`Open photo ${at + 1} of ${count}: ${item.caption}`}
          >
            <Image
              src={item.src}
              alt=""
              fill
              sizes={
                at === 0
                  ? "(max-width: 760px) 100vw, 55vw"
                  : "(max-width: 760px) 50vw, 25vw"
              }
              style={{ objectPosition: item.focus }}
            />
            <span className={styles.tileCaption}>{item.caption}</span>
          </button>
        ))}
        <button
          type="button"
          className={styles.viewAll}
          onClick={() => open(0)}
        >
          View all {count} photographs
        </button>
      </div>
      <dialog
        ref={dialog}
        className={styles.lightbox}
        aria-label={`${roomName} photographs`}
        onClick={(event) => {
          // A click on the backdrop (the dialog itself) closes it.
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className={styles.lightboxBar}>
          <p aria-live="polite">
            {index + 1} / {count}
          </p>
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => dialog.current?.close()}
            autoFocus
          >
            Close <span aria-hidden="true">✕</span>
          </button>
        </div>
        <figure
          className={styles.lightboxStage}
          onTouchStart={(event) => {
            const point = event.touches[0];
            touch.current = { x: point.clientX, y: point.clientY };
          }}
          onTouchEnd={(event) => {
            const start = touch.current;
            touch.current = null;
            if (!start) return;
            const point = event.changedTouches[0];
            const dx = point.clientX - start.x;
            const dy = point.clientY - start.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy))
              go(dx < 0 ? 1 : -1);
          }}
        >
          <div className={styles.lightboxImage} key={photo.src}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="100vw"
              style={{ objectFit: "contain" }}
            />
          </div>
          <figcaption>
            <span>{photo.caption}</span>
            <small>
              Photo: {photo.credit}. Shown for atmosphere; not the VIERCYS
              property.
            </small>
          </figcaption>
        </figure>
        <button
          type="button"
          className={`${styles.lightboxNav} ${styles.prev}`}
          onClick={() => go(-1)}
          aria-label="Previous photograph"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          className={`${styles.lightboxNav} ${styles.next}`}
          onClick={() => go(1)}
          aria-label="Next photograph"
        >
          <span aria-hidden="true">→</span>
        </button>
        <div className={styles.thumbs}>
          {photos.map((item, at) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setIndex(at)}
              aria-label={`Show photo ${at + 1}: ${item.caption}`}
              aria-current={at === index}
            >
              <Image src={item.src} alt="" fill sizes="96px" />
            </button>
          ))}
        </div>
      </dialog>
    </>
  );
}
