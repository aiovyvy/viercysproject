import Image from "next/image";
import styles from "./hero.module.css";

/**
 * Opening scene for editorial pages. "full" lays the copy over a full-bleed
 * photograph; "arch" sets it beside an arched portrait on limestone. The
 * photograph settles in on load and drifts slowly as the page scrolls.
 */
export function EditorialHero({
  kicker,
  title,
  lead,
  photo,
  variant = "full",
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  photo: { src: string; alt: string; focus?: string };
  variant?: "full" | "arch";
  children?: React.ReactNode;
}) {
  return (
    <section
      className={styles.hero}
      data-variant={variant}
      aria-labelledby="page-title"
    >
      <div className={styles.media}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          preload
          sizes={variant === "arch" ? "(max-width: 860px) 100vw, 44vw" : "100vw"}
          style={{ objectPosition: photo.focus }}
        />
      </div>
      <div className={styles.copy}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 id="page-title">{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}
        {children && <div className={styles.actions}>{children}</div>}
      </div>
    </section>
  );
}
