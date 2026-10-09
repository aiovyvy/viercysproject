"use client";
import { useState } from "react";
import { Shell, useData, api, Feedback, GuestLinks } from "./journey";
import Link from "next/link";
import { BookingShell } from "./booking-flow";
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
const SUGGESTED = [
  "How do I use my voucher?",
  "How much does it cost?",
  "Can I extend my stay?",
  "How do I cancel?",
  "How do I contact the hotel?",
  "Which room fits 3 people?",
];
export function Concierge() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<{
    question: string;
    reply: string;
    source: string;
    links: { label: string; href: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask(question: string) {
    if (!question.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{
        reply: string;
        source: string;
        links: { label: string; href: string }[];
      }>("/api/concierge", { message: question });
      setAnswer({ question, ...result });
      setMessage("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Concierge unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <BookingShell
      step={-1}
      title="Concierge."
      back={{ href: "/", label: "Home" }}
    >
      <p className="book-help">
        Quick answers about your voucher, prices, dates and rooms. The concierge
        gives guidance only: it can&rsquo;t book, change or cancel anything for
        you.
      </p>
      <div
        className="concierge-chips"
        role="group"
        aria-label="Common questions"
      >
        {SUGGESTED.map((question) => (
          <button
            key={question}
            type="button"
            disabled={busy}
            onClick={() => ask(question)}
          >
            {question}
          </button>
        ))}
      </div>
      <form
        className="book-card"
        onSubmit={(event) => {
          event.preventDefault();
          ask(message);
        }}
      >
        <div className="book-field">
          <label htmlFor="concierge-question">Or ask your own question</label>
          <textarea
            id="concierge-question"
            maxLength={4000}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button type="submit" className="book-button primary" disabled={busy}>
          {busy ? "Finding an answer…" : "Ask"}
        </button>
      </form>
      {error && (
        <div className="book-error" role="alert">
          <p>{error}</p>
        </div>
      )}
      {answer && (
        <section className="book-card concierge-answer" aria-live="polite">
          <p className="book-help">You asked: {answer.question}</p>
          <p>{answer.reply}</p>
          {answer.links.length > 0 && (
            <p className="book-change-links">
              {answer.links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </p>
          )}
          <p className="book-help">
            {answer.source === "ai-assisted"
              ? "AI-assisted answer. Check details on your booking page."
              : "Answer from the VIERCYS FAQ."}
          </p>
        </section>
      )}
    </BookingShell>
  );
}
