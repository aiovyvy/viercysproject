"use client";
import { useState } from "react";
import { Shell, useData, api, Feedback, GuestLinks } from "./journey";
import type { Booking } from "@/lib/booking";
type Day = {
  date: string;
  morning: string;
  afternoon: string;
  evening: string;
};
type Itinerary = {
  source: string;
  preferences: { interests: string; pace: string; budget: string };
  days: Day[];
  notice: string;
  bookedExtras: { name: string; quantity: number }[];
  requestedExtras: { name: string; quantity: number }[];
};
export function Journey({ reference }: { reference: string }) {
  const stay = useData<{ booking: Booking }>("/api/bookings/" + reference);
  const stored = useData<{ itinerary: Itinerary | null }>(
    "/api/bookings/" + reference + "/itinerary",
  );
  const [draft, setDraft] = useState<Itinerary | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const content = draft || stored.data?.itinerary;
  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const result = await api<{ itinerary: Itinerary }>(
        "/api/bookings/" + reference + "/itinerary",
        Object.fromEntries(values),
      );
      setDraft(result.itinerary);
      setMessage("Your suggested itinerary has been saved. Edit it anytime.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not generate your journey.",
      );
    } finally {
      setBusy(false);
    }
  }
  function edit(
    index: number,
    slot: "morning" | "afternoon" | "evening",
    text: string,
  ) {
    if (!content) return;
    setDraft({
      ...content,
      days: content.days.map((day, i) =>
        i === index ? { ...day, [slot]: text } : day,
      ),
    });
    setMessage("Unsaved itinerary edits.");
  }
  return (
    <Shell title="Your Journey.">
      <GuestLinks reference={reference} />
      <Feedback
        error={stay.error || stored.error || error}
        loading={stay.loading || stored.loading}
      />
      {stay.data && (
        <>
          <p>
            A personal rhythm for {stay.data.booking.adults} adults and{" "}
            {stay.data.booking.children} children. Suggestions remain separate
            from confirmed demo extras.
          </p>
          <form onSubmit={generate}>
            <div className="j-fields">
              <label>
                Interests
                <input
                  name="interests"
                  defaultValue={
                    content?.preferences.interests ||
                    "architecture, food, sunset"
                  }
                  maxLength={500}
                />
              </label>
              <label>
                Pace
                <select
                  name="pace"
                  defaultValue={content?.preferences.pace || "slow"}
                >
                  <option value="slow">Slow and spacious</option>
                  <option value="balanced">Balanced</option>
                  <option value="active">Active</option>
                </select>
              </label>
              <label>
                Budget
                <select
                  name="budget"
                  defaultValue={content?.preferences.budget || "moderate"}
                >
                  <option value="low">Modest</option>
                  <option value="moderate">Moderate</option>
                  <option value="generous">Generous</option>
                </select>
              </label>
            </div>
            <button type="submit" className="j-button" disabled={busy}>
              {busy
                ? "Preparing suggestions…"
                : content
                  ? "Regenerate suggested journey"
                  : "Generate my journey"}
            </button>
          </form>
          {content && (
            <>
              <div className="j-alert">
                <strong>
                  {content.source === "ai-assisted"
                    ? "AI-assisted suggestions"
                    : "Deterministic demo suggestions — no AI response used"}
                </strong>
                <p>{content.notice}</p>
                <p>
                  Confirmed in demo:{" "}
                  {content.bookedExtras
                    .map((extra) => `${extra.name} × ${extra.quantity}`)
                    .join(", ") || "None"}
                  . Requested, not confirmed:{" "}
                  {content.requestedExtras
                    .map((extra) => `${extra.name} × ${extra.quantity}`)
                    .join(", ") || "None"}
                  .
                </p>
              </div>
              {content.days.map((day, index) => (
                <section className="j-day" key={day.date}>
                  <h2>
                    Day {index + 1} · {day.date}
                  </h2>
                  <div className="j-fields">
                    {(["morning", "afternoon", "evening"] as const).map(
                      (slot) => (
                        <label key={slot}>
                          {slot[0].toUpperCase() + slot.slice(1)} — suggestions
                          <textarea
                            maxLength={2000}
                            value={day[slot]}
                            onChange={(e) => edit(index, slot, e.target.value)}
                          />
                        </label>
                      ),
                    )}
                  </div>
                </section>
              ))}
              <button
                type="button"
                className="j-button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api(
                      "/api/bookings/" + reference + "/itinerary",
                      { itinerary: content },
                      "PUT",
                    );
                    setMessage("Itinerary saved.");
                  } catch (error) {
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Could not save your journey.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Save itinerary edits
              </button>
            </>
          )}
          {message && <p role="status">{message}</p>}
        </>
      )}
    </Shell>
  );
}
export function Concierge() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell title="VIERCYS Concierge.">
      <p>
        Ask about your stay, room capacity, breakfast, transfers or island
        inspiration. This assistant provides guidance and suggestions; it cannot
        make bookings, modify reservations or charge you.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const result = await api<{ reply: string; source: string }>(
              "/api/concierge",
              { message },
            );
            setReply(result.reply);
            setSource(result.source);
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Concierge unavailable.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="j-label">
          How can we help?
          <textarea
            className="j-input"
            maxLength={4000}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <div className="j-actions">
          <button type="submit" className="j-button" disabled={busy}>
            {busy ? "Considering your question…" : "Ask concierge"}
          </button>
        </div>
      </form>
      <Feedback error={error} />
      {reply && (
        <section className="j-alert" aria-live="polite">
          <p>
            <strong>
              {source === "ai-assisted"
                ? "AI-assisted guidance"
                : "Demo FAQ fallback — no AI response used"}
            </strong>
          </p>
          <p>{reply}</p>
        </section>
      )}
      <div className="journey-links">
        <a href="/book">Book your stay</a>
        <a href="/my-stay">My VIERCYS</a>
      </div>
      <details className="j-panel">
        <summary>Quick hotel guidance</summary>
        <p>
          Essential Rooms accommodate 2 guests, Signature Suites 3, Grand
          Sanctuaries 4. All children count toward occupancy. Multiple rooms
          need at least one adult each.
        </p>
        <p>
          Stays range from 1 to 30 nights, within the next 24 months.
          Cancellation is available online until two calendar days before
          arrival.
        </p>
        <p>
          Sample nightly rates and all extras are for a fictional concept.
          Payments are simulated. Sailing, dinner and spa requests require
          approval and are not booked activities.
        </p>
      </details>
    </Shell>
  );
}
