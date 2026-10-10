import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { Navigation, Footer } from "@/app/experience";
import { ClaimButton } from "@/components/invite-claim";
import { findInvite, INVITE_MESSAGES } from "@/lib/invites";
import { formatDate } from "@/lib/policy";
import { photos } from "@/app/data";
import "@/components/booking-flow.css";
export const metadata = {
  title: "You're invited | VIERCYS Santorini",
  robots: { index: false },
};
export default async function InvitePage({
  params,
}: {
  params: Promise<{
    token: string;
  }>;
}) {
  await connection();
  const { token } = await params;
  const { state, invite } = await findInvite(token);
  const expires =
    invite && new Date(invite.expires_at).toISOString().slice(0, 10);
  return (
    <>
      <Navigation />
      <main id="main" className="invite-main">
        <div className="invite-photo">
          <Image
            src={photos.hero}
            alt="Whitewashed terraces above the blue Santorini caldera"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <section className="invite-card" aria-labelledby="invite-title">
          <p className="invite-demo">
            Classroom demo · not a real travel prize
          </p>
          {state === "valid" ? (
            <>
              <p className="invite-kicker">You&rsquo;re invited to VIERCYS.</p>
              <h1 id="invite-title">
                Your three-night Santorini escape awaits.
              </h1>
              <p className="invite-lead">
                Complimentary three-night room stay. Extra nights and upgrades
                are optional and shown before confirmation.
              </p>
              <ul className="invite-rules">
                <li>
                  Covers up to 3 nights in an Essential Room, for one room.
                </li>
                <li>
                  Prefer a larger room or a longer stay? You will see the exact
                  extra cost before you confirm.
                </li>
                <li>
                  One booking per invitation. Unused nights have no cash value.
                </li>
                {expires && <li>Claim by {formatDate(expires)}.</li>}
              </ul>
              <ClaimButton token={token} />
              <p className="invite-small">
                Takes about 3 minutes: dates, room, confirm. No account or card
                needed.
              </p>
              <Link className="invite-explore" href="/">
                Explore the hotel first
              </Link>
            </>
          ) : (
            <>
              <h1 id="invite-title">
                {state === "redeemed"
                  ? "This invitation has been used."
                  : state === "expired"
                    ? "This invitation has expired."
                    : "We couldn't find this invitation."}
              </h1>
              <p className="invite-lead">{INVITE_MESSAGES[state]}</p>
              <div className="invite-actions">
                {state === "redeemed" && (
                  <Link className="book-button primary" href="/my-stay">
                    View my stay
                  </Link>
                )}
                <Link
                  className={
                    state === "redeemed"
                      ? "book-button secondary"
                      : "book-button primary"
                  }
                  href="/book"
                >
                  Book without a voucher
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
