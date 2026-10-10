import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { Navigation, Footer } from "@/app/experience";
import { photos } from "@/app/data";
import {
  findCampaign,
  campaignState,
  CLASS_MESSAGES,
} from "@/lib/class-invites";
import { ClassInviteClaim } from "@/components/class-invite-claim";
import "@/components/booking-flow.css";
export const metadata = {
  title: "Your Santorini Escape Awaits | VIERCYS",
  robots: { index: false, follow: false },
};
export default async function ClassInvitation({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;
  const campaign = await findCampaign(token);
  const state = campaignState(campaign);
  return (
    <>
      <Navigation />
      <main id="main" className="invite-main">
        <div className="invite-photo">
          <Image
            src={photos.hero}
            alt="Whitewashed Santorini terraces overlooking the Aegean Sea"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <section className="invite-card" aria-labelledby="class-title">
          <p className="invite-kicker">An invitation to VIERCYS · Santorini</p>
          <h1 id="class-title">
            {state === "active"
              ? "Your Santorini Escape Awaits"
              : state === "full"
                ? "All invitations have been claimed"
                : state === "expired"
                  ? "This invitation has expired"
                  : state === "paused"
                    ? "A moment of pause"
                    : "Invitation not found"}
          </h1>
          <p className="invite-demo">
            VIERCYS is a fictional hotel for an HCI classroom demonstration. No
            real accommodation, travel or payment is provided.
          </p>
          {state === "active" ? (
            <>
              <p className="invite-lead">
                You’re invited to a complimentary three-night escape, created
                for your classroom. Make a little room for the Aegean.
              </p>
              <ul className="invite-rules">
                <li>
                  Three nights in one Essential Room, subject to availability.
                </li>
                <li>
                  Room amenities and the existing invitation allowance are
                  included. Optional upgrades and extras show their classroom
                  totals before confirmation.
                </li>
                <li>
                  Register below, choose your dates and room, then confirm. One
                  reservation per student identifier in this campaign.
                </li>
                <li>
                  Valid until{" "}
                  {new Date(campaign!.expires_at).toLocaleString("en-GB", {
                    timeZone: "Europe/Athens",
                    dateStyle: "long",
                    timeStyle: "short",
                  })}{" "}
                  (Santorini time).
                </li>
              </ul>
              <ClassInviteClaim
                token={token}
                roster={!!campaign!.roster_required}
              />
              <p className="invite-small">
                Opening this page or registering does not use an invitation.
                Your place is claimed only when your booking succeeds.
              </p>
            </>
          ) : (
            <p className="invite-lead">{CLASS_MESSAGES[state]}</p>
          )}
          <Link className="invite-explore" href="/">
            Explore VIERCYS
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
