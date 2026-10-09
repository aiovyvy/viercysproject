import Link from "next/link";
import { Navigation, Footer } from "@/app/experience";
import "./booking-flow.css";
/** Layout for plain information pages (Contact, FAQ, Privacy…). */
export function InfoPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main id="main" className="book-main info-main">
        <div className="book-top">
          <Link className="book-back" href="/">
            <span aria-hidden="true">←</span> Home
          </Link>
        </div>
        <h1>{title}</h1>
        {intro && <p className="info-intro">{intro}</p>}
        {children}
        <p className="book-footnote">
          VIERCYS is a fictional hotel created for a classroom demonstration.
          Prices and payments are simulated; no real accommodation or travel is
          booked.
        </p>
      </main>
      <Footer />
    </>
  );
}
