import Link from "next/link";
import { BookLink } from "./BookLink";
import { LEGAL_LINKS, NAV_GROUPS } from "./links";
import styles from "./site.module.css";

/** Global footer: the same groups as the menu, legal links and disclosure. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.wordmark}>
            VIERCYS<span>HOTELS &amp; RESORTS</span>
          </Link>
          <p>Where Earth Meets the Sea.</p>
          <BookLink className={styles.footerBook} />
        </div>
        <nav aria-label="Footer" className={styles.footerNav}>
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className={styles.groupTitle}>{group.title}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.footer ?? link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className={styles.groupTitle}>Legal</p>
            <ul>
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
      <div className={styles.footerLegal}>
        <p>© {new Date().getFullYear()} VIERCYS Hotels &amp; Resorts</p>
        <p>
          VIERCYS is a fictional hotel created for a classroom project. Stays
          and payments are simulated; no real accommodation is booked.{" "}
          <Link href="/admin">Staff</Link>
        </p>
      </div>
    </footer>
  );
}
