import Image from "next/image";
import Link from "next/link";
import { BookLink } from "@/app/experience";
import { CATEGORIES, money } from "@/lib/catalog";
import { VOUCHER } from "@/lib/policy";
import { ScrollReveal } from "@/components/editorial/ScrollReveal";
import styles from "./home.module.css";

/**
 * The homepage's last scene: the blue-hour caldera opens out of an arch as
 * the visitor arrives, and the booking invitation sits over it.
 */
export function FinalInvitation() {
  const from = Math.min(...CATEGORIES.map((room) => room.rate));
  return (
    <section
      id="closing"
      className={styles.finale}
      aria-labelledby="closing-title"
    >
      <div className={styles.finaleSticky}>
        <ScrollReveal scene="sunset" className={styles.finaleMedia}>
          <Image
            src="/images/santorini/blue-hour.jpg"
            alt="Oia's cliffside houses lit at blue hour above the Aegean"
            fill
            sizes="100vw"
          />
        </ScrollReveal>
        <div className={styles.finaleCopy}>
          <p className={styles.kicker}>The Aegean is waiting</p>
          <h2 id="closing-title">
            Make room for
            <br />
            <em>something beautiful.</em>
          </h2>
          <p className={styles.finaleLead}>
            Three room types, twenty rooms and one horizon. Choose your dates
            and find the room that feels like yours.
          </p>
          <div className={styles.finaleActions}>
            <BookLink className={styles.finaleBook} />
            <Link href="/book/rooms" className={styles.finaleGhost}>
              Explore rooms &amp; suites
            </Link>
          </div>
          <ul className={styles.finaleFacts}>
            <li>
              <strong>From {money(from)}</strong> a night, taxes included
            </li>
            <li>
              <strong>Free cancellation</strong> online until two days before
              arrival
            </li>
            <li>
              <strong>Invited?</strong> {VOUCHER.nights} Essential Room nights
              are complimentary when you redeem your invitation
            </li>
          </ul>
          <p className={styles.finaleNote}>
            VIERCYS is a fictional hotel for a classroom project. Stays and
            payments are simulated.
          </p>
        </div>
        <p className={styles.finaleCredit}>Photo: kuhnmi, CC BY 2.0</p>
      </div>
    </section>
  );
}
