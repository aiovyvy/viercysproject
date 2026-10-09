import { createElement } from "react";
import { render } from "@react-email/render";
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { db, hash } from "./db";
import { getBooking, type Booking, type EmailKind } from "./booking";
import { money } from "./catalog";
import { formatDate } from "./policy";
export function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function lookupToken(email: string) {
  const token = randomBytes(32).toString("base64url");
  db()
    .prepare("INSERT INTO lookup_tokens VALUES(?,?,?,0)")
    .run(hash(token), email, Date.now() + 7 * 86400000);
  return token;
}
export function manageLink(email: string, reference?: string, origin?: string) {
  return (
    (process.env.APP_URL || origin || "http://localhost:3000").replace(
      /\/$/,
      "",
    ) +
    "/lookup?token=" +
    lookupToken(reference ? "booking:" + reference : email)
  );
}
export async function emailHtml(
  booking: Booking,
  kind: EmailKind,
  link: string,
) {
  const title = {
    confirmation: "Your sanctuary awaits.",
    modification: "Your stay, thoughtfully updated.",
    cancellation: "Until we meet again.",
    reminder: "Your arrival is drawing closer.",
  }[kind];
  const e = escapeHtml;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #d6ccbc">${e(label)}</td><td style="padding:10px 0;border-bottom:1px solid #d6ccbc;text-align:right">${e(value)}</td></tr>`;
  const price = (value: number) => money(value, booking.currency);
  const document = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>VIERCYS ${e(kind)}</title></head><body style="margin:0;background:#F3EEE5;color:#292C28;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px" cellspacing="0" cellpadding="0"><tr><td style="padding:30px;background:#233F4B;color:#F3EEE5"><div style="font:30px Georgia,serif;letter-spacing:4px">VIERCYS</div><p style="font-size:12px;letter-spacing:2px">HOTELS &amp; RESORTS</p><p>Where Earth Meets the Sea.</p></td></tr><tr><td><img src="${e((process.env.APP_URL || "http://localhost:3000") + "/images/architecture.jpg")}" width="600" alt="Mediterranean architectural inspiration" style="width:100%;height:auto;display:block"></td></tr><tr><td style="padding:32px 24px;background:#fffaf2"><p>Dear ${e(booking.name)},</p><h1 style="font:36px Georgia,serif;color:#233F4B">${title}</h1><p style="line-height:1.8">Your ${kind === "cancellation" ? "cancelled" : "confirmed demo"} VIERCYS Santorini stay is detailed below. This is a fictional property and simulated payment. No real charge has been made.</p><table width="100%" cellspacing="0" cellpadding="0" style="font-size:15px">${row("Booking reference", booking.reference)}${row("Property", "VIERCYS Santorini, Greece")}${row("Stay", formatDate(booking.arrival) + " – " + formatDate(booking.departure))}${row("Guests", booking.adults + " adults, " + booking.children + " children")}${booking.pricing.rooms.map((room) => row(room.name + " · Room " + room.number, room.nights + " nights × " + price(room.rate) + " = " + price(room.subtotal))).join("")}${booking.pricing.extras.map((extra) => row(extra.name + " × " + extra.quantity + (extra.status === "pending-approval" ? " (request, not confirmed)" : " (confirmed demo)"), price(extra.subtotal))).join("")}${row("Rooms", price(booking.pricing.roomSubtotal))}${row("Confirmed demo extras", price(booking.pricing.extrasSubtotal))}${booking.pricing.tax ? row("Tax", price(booking.pricing.tax)) : ""}${booking.pricing.voucher ? row("Demo voucher · " + booking.pricing.voucher.coveredNights + " Essential night" + (booking.pricing.voucher.coveredNights === 1 ? "" : "s") + " covered", "−" + price(booking.pricing.voucher.discount)) : ""}${row("Simulated amount due", price(booking.pricing.total))}${row("Approval requests excluded from total", price(booking.pricing.pendingApprovalTotal))}${row("Reservation / payment status", booking.status + " / " + booking.payment_status)}</table><p style="line-height:1.8">Online demo cancellation is available until two calendar days before arrival, for a full simulated refund. Requests for dinner, spa and sailing require approval; they are not bookings.</p><p><a href="${e(link)}" style="display:inline-block;background:#233F4B;color:#F3EEE5;padding:18px 24px;text-decoration:none">Securely manage your booking</a></p><p style="font-size:13px;line-height:1.7">This private link expires in 7 days and works once. Request another link from My VIERCYS if needed. Never share your link. For help, use the VIERCYS Concierge in the app. No real property contact is implied.</p><p style="font:20px Georgia,serif">You book the stay. We curate the experience.</p></td></tr><tr><td style="padding:22px;font-size:12px;line-height:1.6">VIERCYS concept property · Temporary editorial photography.<br>In preview mode, this email is not sent. Status in My VIERCYS distinguishes preview, queued, failed and provider accepted.</td></tr></table></td></tr></table></body></html>`;
  const content = document.match(/<body[^>]*>([\s\S]*)<\/body>/)![1];
  return render(
    createElement(
      "html",
      { lang: "en" },
      createElement(
        "head",
        null,
        createElement("meta", {
          name: "viewport",
          content: "width=device-width,initial-scale=1",
        }),
        createElement("title", null, "VIERCYS " + kind),
      ),
      createElement("body", {
        style: {
          margin: 0,
          backgroundColor: "#F3EEE5",
          color: "#292C28",
          fontFamily: "Arial,Helvetica,sans-serif",
        },
        dangerouslySetInnerHTML: { __html: content },
      }),
    ),
  );
}
export async function sendEmails(reference: string) {
  db()
    .prepare(
      "UPDATE email_attempts SET status='queued' WHERE reference=? AND status='sending' AND claimed_at<?",
    )
    .run(reference, Date.now() - 60000);
  const events = db()
    .prepare(
      "SELECT * FROM email_attempts WHERE reference=? AND status IN('queued','failed')",
    )
    .all(reference);
  for (const event of events) {
    const id = String(event.id);
    const booking = getBooking(reference)!;
    const html =
      String(event.html) ||
      (await emailHtml(
        booking,
        event.kind as EmailKind,
        manageLink(booking.email, booking.reference),
      ));
    const claim = db()
      .prepare(
        "UPDATE email_attempts SET html=?,attempts=attempts+1,status='sending',error=NULL,claimed_at=? WHERE id=? AND status IN('queued','failed')",
      )
      .run(html, Date.now(), id);
    if (Number(claim.changes) !== 1) continue;
    try {
      if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
        db()
          .prepare("UPDATE email_attempts SET status='demo-preview' WHERE id=?")
          .run(id);
        continue;
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": id,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM,
          to: [process.env.RESEND_TEST_RECIPIENT || booking.email],
          subject: `VIERCYS ${event.kind} · ${booking.reference}`,
          html,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          String(result.message || "Email provider rejected the request"),
        );
      db()
        .prepare(
          "UPDATE email_attempts SET status='accepted',provider_id=? WHERE id=?",
        )
        .run(String(result.id), id);
    } catch (error) {
      db()
        .prepare("UPDATE email_attempts SET status='failed',error=? WHERE id=?")
        .run(
          error instanceof Error ? error.message : "Email sending failed",
          id,
        );
    }
  }
}
export const emailConfigured = () =>
  !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
// Test-only: with VIERCYS_DEV_OUTBOX set, unsendable emails are appended to
// that server-side file. Nothing here is ever returned over HTTP.
function devOutbox(entry: Record<string, string>) {
  const path = process.env.VIERCYS_DEV_OUTBOX;
  if (path) appendFileSync(path, JSON.stringify(entry) + "\n");
}
/**
 * Emails a private access link if the address has a booking. Callers must
 * respond identically either way and must not await delivery, so neither the
 * response nor its timing reveals whether the email is known.
 */
export async function requestLookup(email: string, origin?: string) {
  const bookingRow = db()
    .prepare(
      "SELECT reference FROM bookings WHERE email=? ORDER BY created_at DESC LIMIT 1",
    )
    .get(email);
  if (!bookingRow) return;
  const link = manageLink(email, undefined, origin);
  if (!emailConfigured()) {
    devOutbox({ kind: "lookup", to: email, link });
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [process.env.RESEND_TEST_RECIPIENT || email],
        subject: "Your secure VIERCYS access link",
        html: `<div style="font:16px Arial;background:#F3EEE5;color:#233F4B;padding:32px"><h1 style="font-family:Georgia">VIERCYS</h1><p>Your private access link expires in 7 days and works once.</p><p><a href="${escapeHtml(link)}">Open My VIERCYS</a></p><p>VIERCYS is a demo concept. Do not share this link.</p></div>`,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // Delivery failures are not reported to the requester (no enumeration).
  }
}
