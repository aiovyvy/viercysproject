"use client";
import Link from "next/link";
import { Navigation, Footer } from "./experience";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <>
      <Navigation />
      <main id="main" className="inner-main">
        <p className="eyebrow">VIERCYS / We could not finish that request</p>
        <h1>
          A moment
          <br />
          <em>to reconnect.</em>
        </h1>
        <div className="notice" role="alert">
          <p>
            Please try again. If you were confirming a booking, check My VIERCYS
            first: a connection error does not mean the reservation failed.
          </p>
        </div>
        <button type="button" className="closing-cta" onClick={reset}>
          Try again
        </button>
        <Link className="text-link" href="/my-stay">
          Check your reservations ↗
        </Link>
        <Link className="text-link" href="/book">
          Return to booking search ↗
        </Link>
      </main>
      <Footer />
    </>
  );
}
