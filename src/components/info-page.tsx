import Link from "next/link";
import { Navigation, Footer } from "@/app/experience";
import ui from "@/components/editorial/ui.module.css";
import styles from "./info-page.module.css";
import "./booking-flow.css";
/**
 * Layout for plain information pages (Contact, FAQ, Privacy…): a calm
 * editorial header and one readable column, without motion.
 */
export function InfoPage({
  title,
  intro,
  kicker = "VIERCYS Hotels & Resorts",
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main id="main" className={`${ui.page} ${styles.page}`}>
        <header className={styles.head}>
          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{title.replace(/[.,]$/, "")}</span>
          </nav>
          <p className={ui.kicker}>{kicker}</p>
          <h1>{title}</h1>
          {intro && <p className={styles.intro}>{intro}</p>}
        </header>
        <div className={styles.body}>{children}</div>
        <p className={styles.footnote}>
          VIERCYS is a fictional hotel created for a classroom project. Prices
          and payments are simulated; no real accommodation or travel is
          booked.
        </p>
      </main>
      <Footer />
    </>
  );
}
