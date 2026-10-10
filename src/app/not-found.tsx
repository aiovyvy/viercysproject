import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { BookLink } from "./experience";
import ui from "@/components/editorial/ui.module.css";
import sections from "@/components/editorial/sections.module.css";

export default function NotFound() {
  return (
    <InfoPage
      title="A different direction."
      kicker="Page not found"
      intro="This page could not be found. Choose where to go next, or return to your stay."
    >
      <div className={sections.links}>
        <BookLink className={ui.primary} />
        <Link className={ui.ghost} href="/my-stay">
          My VIERCYS
        </Link>
        <Link className={ui.textLink} href="/">
          Back to home <span aria-hidden="true">→</span>
        </Link>
      </div>
    </InfoPage>
  );
}
