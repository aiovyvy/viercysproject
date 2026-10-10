"use client";
import { useState } from "react";
import type { Booking } from "@/lib/booking";
import { confirmationShareText } from "@/lib/confirmation";

export function ConfirmationActions({
  booking,
  sharing = true,
}: {
  booking: Booking;
  sharing?: boolean;
}) {
  const [notice, setNotice] = useState("");
  const [manual, setManual] = useState("");
  function summary() {
    return confirmationShareText(booking) + "\n" + window.location.origin + "/";
  }
  async function copy() {
    const text = summary();
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setManual("");
      setNotice(
        "Confirmation details copied. No private booking access link or contact details were included.",
      );
    } catch {
      setManual(text);
      setNotice("Select and copy the confirmation details below.");
    }
  }
  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: "VIERCYS Booking Confirmation",
        text: confirmationShareText(booking),
        url: window.location.origin + "/",
      });
      setNotice(
        "The share sheet was closed. Your confirmation remains available here.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error && error.name === "AbortError"
          ? "Sharing cancelled. Your confirmation remains saved."
          : "Sharing is unavailable. Choose Copy Confirmation Details or download your PDF.",
      );
    }
  }
  return (
    <section
      className="confirmation-actions"
      aria-label={`Save confirmation ${booking.reference}`}
    >
      <div className="stay-actions">
        <a
          className="book-button primary"
          href={`/api/bookings/${encodeURIComponent(booking.reference)}/confirmation.pdf`}
          download={`VIERCYS-Confirmation-${booking.reference}.pdf`}
          target="_blank"
          rel="noopener"
        >
          Download PDF Confirmation
        </a>
        {sharing && (
          <>
            <button type="button" className="book-button" onClick={share}>
              Share Confirmation
            </button>
            <button type="button" className="book-text-button" onClick={copy}>
              Copy Confirmation Details
            </button>
          </>
        )}
      </div>
      {sharing && (
        <p className="book-help">
          Share a brief classroom confirmation summary. Your name, contact
          details, room number and private access stay here. The downloaded PDF
          includes your guest and room details; share that file only with people
          you choose.
        </p>
      )}
      {notice && (
        <p role="status" className="book-help">
          {notice}
        </p>
      )}
      {manual && (
        <label className="book-field">
          Confirmation details to copy
          <textarea
            readOnly
            rows={8}
            value={manual}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
    </section>
  );
}
