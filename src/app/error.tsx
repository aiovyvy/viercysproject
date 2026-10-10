"use client";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <InfoPage
      title="A moment to reconnect."
      kicker="We could not finish that request"
      intro="Please try again. If you were confirming a booking, check My VIERCYS first: a connection error does not mean the reservation failed."
    >
      <div className={sections.links} role="alert">
        <button type="button" className={ui.primary} onClick={reset}>
          Try again
        </button>
        <Link className={ui.ghost} href="/my-stay">
          Check your reservations
        </Link>
        <Link className={ui.textLink} href="/book">
          Return to booking search <span aria-hidden="true">→</span>
        </Link>
      </div>
    </InfoPage>
  );
}
