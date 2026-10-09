import Link from "next/link";
import { Navigation, Footer } from "./experience";
export default function NotFound() {
  return (
    <>
      <Navigation />
      <main id="main" className="inner-main">
        <p className="eyebrow">VIERCYS / Page unavailable</p>
        <h1>
          A different
          <br />
          <em>direction.</em>
        </h1>
        <p className="lead">
          This page could not be found. Choose a destination or return to your
          stay.
        </p>
        <Link className="closing-cta" href="/book">
          Book your stay ↗
        </Link>
        <Link className="text-link" href="/my-stay">
          My VIERCYS ↗
        </Link>
      </main>
      <Footer />
    </>
  );
}
