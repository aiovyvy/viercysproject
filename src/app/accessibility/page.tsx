import Link from "next/link";
import { InfoPage } from "@/components/info-page";
export const metadata = { title: "Accessibility | VIERCYS" };
export default function Accessibility() {
  return (
    <InfoPage
      title="Accessibility."
      intro="We want every guest to be able to book without help. This page explains what we have done, what we have checked, and what we have not checked yet."
    >
      <section className="book-card" aria-labelledby="done">
        <h2 id="done">What we have done</h2>
        <ul className="info-list">
          <li>
            Readable text: at least 16px for body text and 14px for labels, with
            a sans-serif font for forms, prices and instructions.
          </li>
          <li>Buttons and controls at least 44 × 44 pixels for touch.</li>
          <li>
            Every booking step can be completed with a keyboard, with a visible
            focus outline and a &ldquo;Skip to content&rdquo; link.
          </li>
          <li>
            Form fields have labels; errors are announced and explain how to fix
            the problem.
          </li>
          <li>
            The step indicator says which step you are on (Dates, Room, Review)
            for screen readers too.
          </li>
          <li>
            If your device is set to reduce motion, the homepage animations are
            replaced by a still layout. Booking pages never animate.
          </li>
          <li>The site works at 320px wide without sideways scrolling.</li>
        </ul>
      </section>
      <section className="book-card" aria-labelledby="checked">
        <h2 id="checked">What we have checked</h2>
        <p>
          Automated browser tests on phone and desktop sizes, keyboard tests of
          the booking steps, reduced-motion tests, and automated accessibility
          scans (axe-core) of every page.
        </p>
      </section>
      <section className="book-card" aria-labelledby="not-yet">
        <h2 id="not-yet">Not checked yet</h2>
        <p>
          We have not yet tested with screen readers (VoiceOver, TalkBack,
          NVDA), on real iPhones and Android phones, or in Safari and Firefox.
          Some homepage text sits over photographs, where contrast can vary.
        </p>
      </section>
      <section className="book-card" aria-labelledby="report">
        <h2 id="report">Tell us about a problem</h2>
        <p>
          If something is hard to use, tell the presenter (see{" "}
          <Link href="/contact">Contact</Link>). Please mention the page and
          what you were trying to do.
        </p>
      </section>
    </InfoPage>
  );
}
