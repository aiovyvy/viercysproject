"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell, useData, api, Feedback, GuestLinks } from "./journey";
import { BookingShell, PriceSummary } from "./booking-flow";
import type { Booking, Pricing } from "@/lib/booking";
import {
  addDays,
  formatDate,
  nights,
  propertyToday,
  type SearchInput,
} from "@/lib/policy";
import { money, type Room } from "@/lib/catalog";
type StayResponse = {
  booking: Booking;
  email: { kind: string; status: string; error?: string }[];
};
export function MyStay() {
  const router = useRouter();
  const result = useData<{ bookings: Booking[] }>("/api/bookings");
  return (
    <Shell title="My VIERCYS.">
      <p>
        Your reservation, your island rhythm. Use a secure access link to see
        all stays booked with your email.
      </p>
      <div className="j-actions">
        <Link href="/lookup" className="j-button">
          Request secure access
        </Link>
        <Link href="/profile" className="j-button secondary">
          Guest profile
        </Link>
        <Link href="/concierge" className="j-button secondary">
          Concierge
        </Link>
        <button
          type="button"
          className="j-button secondary"
          onClick={async () => {
            await api("/api/logout", {});
            result.refresh();
            router.refresh();
          }}
        >
          Sign out
        </button>
      </div>
      <Feedback error={result.error} loading={result.loading} />
      {result.data?.bookings.length === 0 && (
        <div className="notice">
          <h2>Your next chapter is waiting.</h2>
          <p>
            No reservations are accessible in this browser session. Request a
            verified link or book a demo stay.
          </p>
          <Link className="text-link" href="/book">
            Book your stay ↗
          </Link>
        </div>
      )}
      {result.data?.bookings.map((booking) => (
        <article className="j-room" key={booking.reference}>
          <p className="j-status">
            {booking.status} · {booking.payment_status}
          </p>
          <h2>{booking.reference}</h2>
          <p>
            {formatDate(booking.arrival)} – {formatDate(booking.departure)} ·{" "}
            {booking.name}
            <br />
            {booking.rooms} rooms · {booking.adults} adults · {booking.children}{" "}
            children · {money(booking.pricing.total, booking.currency)}
          </p>
          <Link href={"/booking/" + booking.reference} className="j-button">
            View your stay
          </Link>
        </article>
      ))}
      <p className="j-note">
        Install My VIERCYS from your browser menu for a mobile companion.
        Booking details require a connection and a secure session; they are not
        cached offline.
      </p>
    </Shell>
  );
}
const EMAIL_STATUS: Record<string, string> = {
  "demo-preview":
    "Email is not configured for this demo, so nothing was sent. You can view the email that would have been sent.",
  queued: "Your confirmation email is waiting to be sent.",
  sending: "Your confirmation email is being sent.",
  accepted:
    "Your confirmation email was handed to the email provider. Delivery is not yet confirmed.",
  sent: "Your confirmation email was sent.",
  delivered: "Your confirmation email was delivered.",
  delayed: "Email delivery is delayed by the provider.",
  bounced: "The email bounced. Check the address you entered.",
  failed: "The email could not be sent. Your booking is still confirmed.",
};
type Preview = {
  pricing: Pricing;
  currency: string;
  search: SearchInput;
  roomIds: string[];
  label: string;
};
type Panel = "" | "extend" | "dates" | "advanced" | "cancel";
export function Stay({
  reference,
  success = false,
}: {
  reference: string;
  success?: boolean;
}) {
  const result = useData<StayResponse>(
    "/api/bookings/" + encodeURIComponent(reference),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<Panel>("");
  const [extraNights, setExtraNights] = useState(2);
  const [newArrival, setNewArrival] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [notice, setNotice] = useState("");
  const catalog = useData<{ rooms: Room[]; currency: string }>("/api/catalog");
  const booking = result.data?.booking;
  function open(next: Panel) {
    setPanel(panel === next ? "" : next);
    setPreview(null);
    setError("");
    setNotice("");
  }
  async function action(path: string, body: unknown, done = "") {
    setBusy(true);
    setError("");
    try {
      await api("/api/bookings/" + reference + "/" + path, body);
      setPreview(null);
      setPanel("");
      setNotice(done);
      result.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update your stay.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function previewChange(
    search: SearchInput,
    roomIds: string[],
    label: string,
  ) {
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const quote = await api<{ pricing: Pricing; currency: string }>(
        "/api/bookings/" + reference + "/modification-quote",
        { ...search, roomIds },
      );
      setPreview({ ...quote, search, roomIds, label });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not check those dates.";
      setError(
        /unavailable|reserved/i.test(message)
          ? message +
              " Try fewer nights or different dates. Your current booking is unchanged."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }
  function advanced(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roomIds = form.getAll("roomIds").map(String);
    previewChange(
      {
        arrival: String(form.get("arrival")),
        departure: String(form.get("departure")),
        adults: Number(form.get("adults")),
        children: Number(form.get("children")),
        rooms: roomIds.length,
      },
      roomIds,
      "Changed guests or rooms",
    );
  }
  function toggle(name: Panel) {
    return (event: React.SyntheticEvent<HTMLDetailsElement>) => {
      if (event.currentTarget.open !== (panel === name)) open(name);
    };
  }
  const stayNights = booking ? nights(booking) : 0;
  const cancelled = booking?.status === "cancelled";
  const latestEmail = result.data?.email[0];
  const voucher = booking?.pricing.voucher;
  const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  // Opened without access on this device (another browser, a shared link):
  // explain how to get in instead of a bare error.
  const locked = !booking && !result.loading && !!result.error;
  return (
    <BookingShell
      step={success && !locked ? 3 : -1}
      title={
        locked
          ? "Your booking is private."
          : cancelled
            ? "Reservation cancelled."
            : success
              ? "You're booked."
              : "Your stay."
      }
      back={success ? undefined : { href: "/my-stay", label: "My VIERCYS" }}
    >
      {locked ? (
        <section className="book-card" aria-labelledby="locked-heading">
          <h2 id="locked-heading">Open it on this device</h2>
          <p>
            Bookings open automatically in the browser where they were made.
            Anywhere else, enter the booking reference and the email used to
            book.
          </p>
          <p className="stay-actions">
            <Link
              className="book-button primary"
              href={"/lookup?reference=" + encodeURIComponent(reference)}
            >
              Find my booking
            </Link>
            <Link className="book-button" href="/">
              Back to home
            </Link>
          </p>
        </section>
      ) : (
        <Feedback error={result.error} loading={result.loading} />
      )}
      {booking && (
        <div className="stay">
          <section
            className={cancelled ? "stay-banner cancelled" : "stay-banner"}
            aria-label="Booking reference"
          >
            <p>
              {cancelled
                ? "This reservation was cancelled and its rooms released. A simulated refund was recorded."
                : success
                  ? `Thank you, ${booking.name}. Your demo reservation is confirmed.`
                  : `Welcome back, ${booking.name}.`}
            </p>
            <p className="stay-ref-label">Booking reference</p>
            <p className="stay-ref">{booking.reference}</p>
            <p className="stay-status">
              {cancelled ? "Cancelled" : "Confirmed"} · Simulated payment, no
              real charge
              {booking.checkin_status === "checked-in" && " · Checked in"}
              {booking.checkin_status === "checked-out" && " · Checked out"}
            </p>
          </section>
          {notice && (
            <p className="book-voucher" role="status">
              {notice}
            </p>
          )}
          <section className="book-card" aria-labelledby="stay-summary">
            <h2 id="stay-summary">VIERCYS Santorini</h2>
            <dl className="book-stay">
              <div>
                <dt>Dates</dt>
                <dd>
                  {formatDate(booking.arrival)} –{" "}
                  {formatDate(booking.departure)} · {stayNights} night
                  {stayNights === 1 ? "" : "s"}
                </dd>
              </div>
              <div>
                <dt>Room{booking.pricing.rooms.length > 1 ? "s" : ""}</dt>
                <dd>
                  {booking.pricing.rooms
                    .map((room) => `${room.name} (no. ${room.number})`)
                    .join(", ")}
                </dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>
                  {booking.adults} adult{booking.adults === 1 ? "" : "s"}
                  {booking.children
                    ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Lead guest</dt>
                <dd>
                  {booking.name} · {booking.email}
                  {booking.phone ? " · " + booking.phone : ""}
                </dd>
              </div>
              {booking.requests && (
                <div>
                  <dt>Special request (subject to approval)</dt>
                  <dd>{booking.requests}</dd>
                </div>
              )}
            </dl>
            {voucher && (
              <p className="stay-savings">
                Voucher savings {money(voucher.discount, booking.currency)} ·
                Simulated balance{" "}
                {money(booking.pricing.total, booking.currency)}
              </p>
            )}
          </section>
          {!cancelled && (
            <nav className="stay-actions" aria-label="Manage your stay">
              <button
                type="button"
                className="book-button primary"
                aria-expanded={panel === "extend"}
                onClick={() => open("extend")}
              >
                Extend stay
              </button>
              <button
                type="button"
                className="book-button"
                aria-expanded={panel === "dates"}
                onClick={() => {
                  setNewArrival(booking.arrival);
                  open("dates");
                }}
              >
                Change dates
              </button>
              <Link
                className="book-button"
                href={`/booking/${reference}/receipt`}
              >
                Print receipt
              </Link>
              <Link className="book-button" href="/">
                Back to home
              </Link>
            </nav>
          )}
          {panel === "extend" && !cancelled && (
            <section className="book-card" aria-labelledby="extend-heading">
              <h2 id="extend-heading">Extend your stay</h2>
              <p className="book-help">
                Add nights after {formatDate(booking.departure)}. You keep the
                same room{booking.rooms > 1 ? "s" : ""}; extra nights are
                charged at the room rate.
              </p>
              <div className="stay-extend">
                <span>Extra nights</span>
                <div className="book-counter-controls">
                  <button
                    type="button"
                    aria-label="Remove one night"
                    disabled={extraNights <= 1}
                    onClick={() => {
                      setExtraNights(extraNights - 1);
                      setPreview(null);
                    }}
                  >
                    −
                  </button>
                  <output aria-live="polite">{extraNights}</output>
                  <button
                    type="button"
                    aria-label="Add one night"
                    disabled={stayNights + extraNights >= 30}
                    onClick={() => {
                      setExtraNights(extraNights + 1);
                      setPreview(null);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="book-help">
                New check-out:{" "}
                {formatDate(addDays(booking.departure, extraNights))} ·{" "}
                {stayNights + extraNights} nights in total
              </p>
              <button
                type="button"
                className="book-button primary"
                disabled={busy}
                onClick={() =>
                  previewChange(
                    {
                      arrival: booking.arrival,
                      departure: addDays(booking.departure, extraNights),
                      adults: booking.adults,
                      children: booking.children,
                      rooms: booking.rooms,
                    },
                    booking.roomIds,
                    `Extended by ${extraNights} night${extraNights === 1 ? "" : "s"}`,
                  )
                }
              >
                {busy ? "Checking…" : "Check price and availability"}
              </button>
            </section>
          )}
          {panel === "dates" && !cancelled && (
            <section className="book-card" aria-labelledby="dates-heading">
              <h2 id="dates-heading">Change dates</h2>
              <p className="book-help">
                Move your {stayNights}-night stay. We check that your room is
                free on the new dates before anything changes.
              </p>
              <div className="book-field">
                <label htmlFor="stay-arrival">New check-in</label>
                <input
                  id="stay-arrival"
                  type="date"
                  min={propertyToday()}
                  value={newArrival}
                  onChange={(e) => {
                    setNewArrival(e.target.value);
                    setPreview(null);
                  }}
                />
              </div>
              {isDate(newArrival) && (
                <p className="book-help">
                  New check-out: {formatDate(addDays(newArrival, stayNights))}
                </p>
              )}
              <button
                type="button"
                className="book-button primary"
                disabled={busy || !isDate(newArrival)}
                onClick={() =>
                  previewChange(
                    {
                      arrival: newArrival,
                      departure: addDays(newArrival, stayNights),
                      adults: booking.adults,
                      children: booking.children,
                      rooms: booking.rooms,
                    },
                    booking.roomIds,
                    "New dates",
                  )
                }
              >
                {busy ? "Checking…" : "Check price and availability"}
              </button>
            </section>
          )}
          {error && (
            <div className="book-error" role="alert">
              <p>{error}</p>
            </div>
          )}
          {preview && (
            <section
              className="book-card stay-preview"
              aria-labelledby="preview-heading"
            >
              <h2 id="preview-heading">Review the change</h2>
              <p>
                {preview.label}: {formatDate(preview.search.arrival)} –{" "}
                {formatDate(preview.search.departure)}. Nothing has changed yet.
              </p>
              <PriceSummary
                pricing={preview.pricing}
                currency={preview.currency}
                title="New price"
              />
              <p className="stay-difference">
                {preview.pricing.total >= booking.pricing.total
                  ? `Additional simulated amount: ${money(preview.pricing.total - booking.pricing.total, preview.currency)}`
                  : `Simulated refund: ${money(booking.pricing.total - preview.pricing.total, preview.currency)}`}
              </p>
              <div className="stay-actions">
                <button
                  type="button"
                  className="book-button primary"
                  disabled={busy}
                  onClick={() =>
                    action(
                      "modify",
                      { ...preview.search, roomIds: preview.roomIds },
                      "Your stay has been updated and an updated confirmation recorded.",
                    )
                  }
                >
                  Confirm change
                </button>
                <button
                  type="button"
                  className="book-button"
                  onClick={() => setPreview(null)}
                >
                  Keep current booking
                </button>
              </div>
            </section>
          )}
          <PriceSummary pricing={booking.pricing} currency={booking.currency} />
          <section className="book-card" aria-labelledby="email-heading">
            <h2 id="email-heading">Confirmation email</h2>
            <p>
              {latestEmail
                ? EMAIL_STATUS[latestEmail.status] || latestEmail.status
                : "No email recorded."}
            </p>
            <p className="book-change-links">
              <Link href={`/booking/${reference}/email-preview`}>
                View the email
              </Link>
              {latestEmail &&
                ["failed", "queued"].includes(latestEmail.status) && (
                  <button
                    type="button"
                    className="book-text-button"
                    disabled={busy}
                    onClick={() => action("email-retry", {})}
                  >
                    Try sending again
                  </button>
                )}
            </p>
          </section>
          <section className="book-card" aria-labelledby="more-heading">
            <h2 id="more-heading">More for your stay</h2>
            <p className="book-change-links">
              <Link href={`/itinerary/${reference}`}>Plan your visit</Link>
              <Link href="/concierge">Ask the concierge</Link>
              <Link href="/my-stay">All my bookings</Link>
            </p>
          </section>
          {booking.status === "confirmed" && (
            <>
              <details
                className="book-card"
                open={panel === "advanced"}
                onToggle={toggle("advanced")}
              >
                <summary className="stay-summary-toggle">
                  Change guests or rooms
                </summary>
                <form onSubmit={advanced} onChange={() => setPreview(null)}>
                  <p className="book-help">
                    Pick the rooms for your revised stay. Availability and
                    capacity are rechecked before anything is saved.
                  </p>
                  <fieldset className="stay-rooms">
                    <legend>Rooms</legend>
                    {catalog.data?.rooms
                      .filter((room) => room.operational !== "maintenance")
                      .map((room) => (
                        <label className="book-check" key={room.id}>
                          <input
                            type="checkbox"
                            name="roomIds"
                            value={room.id}
                            defaultChecked={booking.roomIds.includes(room.id)}
                          />
                          <span>
                            Room {room.number} ·{" "}
                            {room.category[0].toUpperCase() +
                              room.category.slice(1)}{" "}
                            · sleeps {room.capacity} ·{" "}
                            {money(room.rate, booking.currency)} per night
                          </span>
                        </label>
                      ))}
                  </fieldset>
                  <div className="book-date-row">
                    <div className="book-field">
                      <label htmlFor="adv-arrival">Check-in</label>
                      <input
                        id="adv-arrival"
                        type="date"
                        name="arrival"
                        defaultValue={booking.arrival}
                        required
                      />
                    </div>
                    <div className="book-field">
                      <label htmlFor="adv-departure">Check-out</label>
                      <input
                        id="adv-departure"
                        type="date"
                        name="departure"
                        defaultValue={booking.departure}
                        required
                      />
                    </div>
                    <div className="book-field">
                      <label htmlFor="adv-adults">Adults</label>
                      <input
                        id="adv-adults"
                        type="number"
                        name="adults"
                        min="1"
                        max="10"
                        defaultValue={booking.adults}
                        required
                      />
                    </div>
                    <div className="book-field">
                      <label htmlFor="adv-children">Children</label>
                      <input
                        id="adv-children"
                        type="number"
                        name="children"
                        min="0"
                        max="8"
                        defaultValue={booking.children}
                        required
                      />
                    </div>
                  </div>
                  <button
                    className="book-button primary"
                    disabled={busy}
                    type="submit"
                  >
                    Check price and availability
                  </button>
                </form>
              </details>
              <details
                className="book-card"
                open={panel === "cancel"}
                onToggle={toggle("cancel")}
              >
                <summary className="stay-summary-toggle">
                  Cancel reservation
                </summary>
                <p className="book-help">
                  Online cancellation is available until two days before
                  arrival. It releases your room and records a simulated refund
                  {voucher ? ", and your voucher can be used again" : ""}.
                </p>
                <label className="book-check">
                  <input
                    type="checkbox"
                    checked={confirmCancel}
                    onChange={(e) => setConfirmCancel(e.target.checked)}
                  />
                  <span>I want to cancel {reference}.</span>
                </label>
                <button
                  className="book-button"
                  disabled={!confirmCancel || busy}
                  type="button"
                  onClick={() =>
                    action(
                      "cancel",
                      { confirm: true },
                      "Your reservation has been cancelled.",
                    )
                  }
                >
                  Confirm cancellation
                </button>
              </details>
              {booking.arrival === propertyToday() &&
                booking.checkin_status === "not-arrived" && (
                  <button
                    className="book-button"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      action("check-in", {}, "You are pre-checked in (demo).")
                    }
                  >
                    Demo digital check-in
                  </button>
                )}
            </>
          )}
        </div>
      )}
    </BookingShell>
  );
}
export function Lookup({
  token,
  reference: initialReference = "",
}: {
  token?: string;
  reference?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function verify() {
    setBusy(true);
    try {
      await api("/api/verify", { token });
      router.push("/my-stay");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Access failed.");
      setBusy(false);
    }
  }
  async function findBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const values = new FormData(event.currentTarget);
    try {
      const result = await api<{ reference: string }>("/api/lookup/reference", {
        reference: values.get("reference"),
        email: values.get("email"),
      });
      router.push("/booking/" + result.reference);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not find the booking.",
      );
      setBusy(false);
    }
  }
  async function emailLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const values = new FormData(event.currentTarget);
    try {
      const result = await api<{ message: string }>("/api/lookup", {
        email: values.get("email"),
      });
      setMessage(result.message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not request a link.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <BookingShell
      step={-1}
      title={token ? "Open your booking." : "Find your booking."}
      back={{ href: "/my-stay", label: "My VIERCYS" }}
    >
      {token ? (
        <section className="book-card" aria-labelledby="verify-heading">
          <h2 id="verify-heading">Private access link</h2>
          <p className="book-help">
            This link was sent to the email used for the booking. It opens your
            reservations on this device.
          </p>
          <button
            type="button"
            className="book-button primary"
            disabled={busy}
            onClick={verify}
          >
            {busy ? "Opening…" : "Open my booking"}
          </button>
        </section>
      ) : (
        <>
          <form className="book-card" onSubmit={findBooking}>
            <h2>Use your booking reference</h2>
            <p className="book-help">
              Your reference is on your confirmation page and email, e.g.
              VRC-1A2B3C4D5E6F. Both details must match.
            </p>
            <div className="book-field">
              <label htmlFor="lookup-reference">Booking reference</label>
              <input
                id="lookup-reference"
                name="reference"
                defaultValue={initialReference}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={20}
              />
            </div>
            <div className="book-field">
              <label htmlFor="lookup-email">Email used for the booking</label>
              <input
                id="lookup-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </div>
            <button className="book-button primary" disabled={busy}>
              {busy ? "Checking…" : "Find my booking"}
            </button>
          </form>
          <details className="book-card">
            <summary className="stay-summary-toggle">
              Forgot your reference? Email me a link
            </summary>
            <form onSubmit={emailLink}>
              <div className="book-field">
                <label htmlFor="lookup-link-email">Email address</label>
                <input
                  id="lookup-link-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </div>
              <button className="book-button" disabled={busy}>
                {busy ? "Sending…" : "Email me a private link"}
              </button>
            </form>
          </details>
        </>
      )}
      {error && (
        <div className="book-error" role="alert">
          <p>{error}</p>
        </div>
      )}
      {message && (
        <p className="book-voucher" role="status">
          {message}
        </p>
      )}
    </BookingShell>
  );
}
export function Receipt({ reference }: { reference: string }) {
  const result = useData<StayResponse>("/api/bookings/" + reference);
  const booking = result.data?.booking;
  return (
    <Shell title="Your VIERCYS receipt.">
      <Feedback error={result.error} loading={result.loading} />
      {booking && (
        <>
          <p>
            {booking.reference} · {booking.name}
            <br />
            VIERCYS Santorini · {formatDate(booking.arrival)} –{" "}
            {formatDate(booking.departure)}
            <br />
            {booking.adults} adults · {booking.children} children · Rooms{" "}
            {booking.pricing.rooms.map((room) => room.number).join(", ")}
          </p>
          <p className="receipt-notice">
            Fictional property · {booking.status} · {booking.payment_status} ·
            No real charge
          </p>
          <PriceSummary pricing={booking.pricing} currency={booking.currency} />
          <div className="j-actions">
            <button
              type="button"
              className="j-button"
              onClick={() => window.print()}
            >
              Print / save as PDF
            </button>
            <Link className="j-button secondary" href={"/booking/" + reference}>
              Back to your stay
            </Link>
          </div>
        </>
      )}
    </Shell>
  );
}
export function EmailPreview({ reference }: { reference: string }) {
  const result = useData<StayResponse>("/api/bookings/" + reference);
  return (
    <Shell title="A considered confirmation.">
      <Feedback error={result.error} loading={result.loading} />
      {result.data && (
        <>
          <p>
            Branded email QA preview. Delivery status:{" "}
            {result.data.email[0]?.status || "queued"}. Preview does not mean
            sent or delivered.
          </p>
          <GuestLinks reference={reference} />
          <iframe
            className="email-frame"
            title="VIERCYS transactional email preview"
            src={"/api/bookings/" + reference + "/email-preview"}
            sandbox="allow-popups allow-top-navigation-by-user-activation"
          />
        </>
      )}
    </Shell>
  );
}
