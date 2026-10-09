"use client";
import { useEffect, useState } from "react";
import styles from "./room.module.css";

/**
 * Phone-only booking summary. It appears once the hero has scrolled away and
 * steps aside while the reservation panel itself is on screen.
 */
export function RoomDock({ name, rate }: { name: string; rate: string }) {
  const [heroGone, setHeroGone] = useState(false);
  const [reserveVisible, setReserveVisible] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("room-hero");
    const reserve = document.getElementById("reserve");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) setHeroGone(!entry.isIntersecting);
        if (entry.target === reserve) setReserveVisible(entry.isIntersecting);
      }
    });
    if (hero) observer.observe(hero);
    if (reserve) observer.observe(reserve);
    return () => observer.disconnect();
  }, []);
  const shown = heroGone && !reserveVisible;
  return (
    <div className={styles.dock} data-shown={shown} inert={!shown}>
      <p>
        <strong>{name}</strong>
        <span>{rate} / night · taxes incl.</span>
      </p>
      <a href="#reserve">Book a Stay</a>
    </div>
  );
}
