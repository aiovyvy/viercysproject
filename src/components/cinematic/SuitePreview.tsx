"use client";
import Image from "next/image";
import Link from "next/link";
import { useId, useState, type KeyboardEvent } from "react";
import styles from "./suite.module.css";
export type PreviewCategory = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  inventory: number;
  nightlyRate: number;
  currency: string;
  amenities: string[];
};
const views = [
  {
    src: "/images/suite.jpg",
    name: "Interior inspiration",
    alt: "Warm Mediterranean interior with natural materials and comfortable seating",
  },
  {
    src: "/images/architecture.jpg",
    name: "Architecture inspiration",
    alt: "Sculptural Mediterranean terraces in warm sunlight",
  },
  {
    src: "/images/santorini.jpg",
    name: "Island setting",
    alt: "Santorini cliffside architecture overlooking the Aegean sea",
  },
];
export default function SuitePreview({
  categories,
}: {
  categories: PreviewCategory[];
}) {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState(0);
  const id = useId();
  if (!categories.length) return null;
  const category = categories[Math.min(selected, categories.length - 1)];
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % categories.length
        : event.key === "ArrowLeft"
          ? (index + categories.length - 1) % categories.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? categories.length - 1
              : null;
    if (next !== null) {
      event.preventDefault();
      setSelected(next);
      document.getElementById(id + "-tab-" + next)?.focus();
    }
  };
  return (
    <section className={styles.preview} aria-labelledby={id + "-title"}>
      <div className={styles.photo}>
        <Image
          src={views[view].src}
          fill
          sizes="(max-width: 899px) 100vw, 55vw"
          alt={views[view].alt}
        />
        <div
          className={styles.views}
          role="group"
          aria-label="Explore editorial photographs"
        >
          {views.map((item, index) => (
            <button
              key={item.src}
              aria-pressed={view === index}
              onClick={() => setView(index)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <p className={styles.disclosure}>
          Editorial stock photography · Interior inspiration, not photographs of
          the fictional property.
        </p>
      </div>
      <div className={styles.copy}>
        <p className={styles.kicker}>A sanctuary of your own · Santorini</p>
        <h2 id={id + "-title"}>
          Find your
          <br />
          <em>kind of quiet.</em>
        </h2>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Room categories"
        >
          {categories.map((item, index) => (
            <button
              key={item.id}
              role="tab"
              id={id + "-tab-" + index}
              aria-controls={id + "-panel"}
              aria-selected={selected === index}
              tabIndex={selected === index ? 0 : -1}
              onKeyDown={(event) => keyboard(event, index)}
              onClick={() => setSelected(index)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={id + "-panel"}
          aria-labelledby={id + "-tab-" + selected}
          className={styles.detail}
        >
          <h3>{category.name}</h3>
          <p>{category.description}</p>
          <dl>
            <div>
              <dt>Nightly demo rate</dt>
              <dd>
                {new Intl.NumberFormat("en", {
                  style: "currency",
                  currency: category.currency,
                  maximumFractionDigits: 0,
                }).format(category.nightlyRate)}
              </dd>
            </div>
            <div>
              <dt>Guests per room</dt>
              <dd>Up to {category.capacity}</dd>
            </div>
            <div>
              <dt>Physical inventory</dt>
              <dd>{category.inventory} rooms</dd>
            </div>
          </dl>
          <p className={styles.amenities}>{category.amenities.join(" · ")}</p>
          <p className={styles.note}>
            Availability depends on your dates. Taxes and optional experiences
            appear in the booking summary.
          </p>
          <Link
            href="/book"
            className={styles.action}
          >
            Check availability <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
