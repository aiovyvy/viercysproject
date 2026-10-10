import { createElement } from "react";
import { render } from "@react-email/render";
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { db, hash, transaction } from "./db";
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
/** Absolute site address for links and images in emails. */
export function appBase(origin?: string) {
  return (process.env.APP_URL || origin || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
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
  base?: string,
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
  // Inbox clients cannot fetch photographs from a guest's localhost server.
  // Keep the branded typography and summary complete without remote imagery.
  const imageBase = appBase(base);
  const architecture = imageBase.startsWith("https://")
    ? `<tr><td><img src="${e(imageBase + "/images/architecture.jpg")}" width="600" alt="Mediterranean architectural inspiration" style="width:100%;height:auto;display:block"></td></tr>`
    : "";
  const document = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>VIERCYS ${e(kind)}</title></head><body style="margin:0;background:#F3EEE5;color:#292C28;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px" cellspacing="0" cellpadding="0"><tr><td style="padding:30px;background:#233F4B;color:#F3EEE5"><div style="font:30px Georgia,serif;letter-spacing:4px">VIERCYS</div><p style="font-size:12px;letter-spacing:2px">HOTELS &amp; RESORTS</p><p>Where Earth Meets the Sea.</p></td></tr>${architecture}<tr><td style="padding:32px 24px;background:#fffaf2"><p>Dear ${e(booking.name)},</p><h1 style="font:36px Georgia,serif;color:#233F4B">${title}</h1><p style="line-height:1.8">Your ${kind === "cancellation" ? "cancelled" : "confirmed"} VIERCYS Santorini stay is detailed below. Thank you for choosing VIERCYS. This reservation is part of an HCI classroom simulation: no actual accommodation or payment is provided. No real charge has been made.</p><table width="100%" cellspacing="0" cellpadding="0" style="font-size:15px">${row("Booking reference", booking.reference)}${row("Property", "VIERCYS Santorini, Greece")}${row("Stay", formatDate(booking.arrival) + " – " + formatDate(booking.departure))}${row("Guests", booking.adults + " adults, " + booking.children + " children")}${booking.pricing.rooms.map((room) => row(room.name + " · Room " + room.number, room.nights + " nights × " + price(room.rate) + " = " + price(room.subtotal))).join("")}${booking.pricing.extras.map((extra) => row(extra.name + " × " + extra.quantity + (extra.status === "pending-approval" ? " (request, not confirmed)" : " (confirmed)"), price(extra.subtotal))).join("")}${row("Rooms", price(booking.pricing.roomSubtotal))}${row("Confirmed extras", price(booking.pricing.extrasSubtotal))}${booking.pricing.tax ? row("Tax", price(booking.pricing.tax)) : ""}${booking.pricing.voucher ? row("Invitation voucher · " + booking.pricing.voucher.coveredNights + " Essential night" + (booking.pricing.voucher.coveredNights === 1 ? "" : "s") + " covered", "−" + price(booking.pricing.voucher.discount)) : ""}${row("Reservation total", price(booking.pricing.total))}${row("Approval requests excluded from total", price(booking.pricing.pendingApprovalTotal))}${row("Status", booking.status === "cancelled" ? "Cancelled · simulated refund" : "Confirmed · simulated payment, no real charge")}</table><p style="line-height:1.8">Online cancellation is available until two calendar days before arrival, for a full simulated refund. Requests for dinner, spa and sailing require approval; they are not bookings.</p><p><a href="${e(link)}" style="display:inline-block;background:#233F4B;color:#F3EEE5;padding:18px 24px;text-decoration:none">Securely manage your booking</a></p><p style="font-size:13px;line-height:1.7">This private link opens your booking for 7 days. On any device you can also use Find my booking with your reference and email. Never share your link. For help, use the VIERCYS Concierge in the app. No real property contact is implied.</p><p style="font:20px Georgia,serif">You book the stay. We curate the experience.</p></td></tr><tr><td style="padding:22px;font-size:12px;line-height:1.6">VIERCYS concept property · Temporary editorial photography.<br>A fictional HCI classroom resort. No actual accommodation or payment is provided.</td></tr></table></td></tr></table></body></html>`;
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
// A successful reservation is required before reaching this sender. Bound real
// provider traffic per destination address, including retries and new bookings.
function reserveEmailSend(recipient: string) {
  return transaction(() => {
    const now = Date.now();
    const limits: [string, number][] = [
      ["booking-email-" + hash(recipient.toLowerCase()), 10],
      ["booking-email-global", 200],
    ];
    const rows = limits.map(([key, limit]) => ({
      key,
      limit,
      row: db()
        .prepare("SELECT count,reset FROM rate_limits WHERE key=?")
        .get(key),
    }));
    if (
      rows.some(
        ({ row, limit }) =>
          row && Number(row.reset) > now && Number(row.count) >= limit,
      )
    )
      throw new Error(
        "Email sending limit reached. Please retry after 15 minutes.",
      );
    for (const { key, row } of rows) {
      if (!row || Number(row.reset) <= now)
        db()
          .prepare("INSERT OR REPLACE INTO rate_limits VALUES(?,?,?)")
          .run(key, 1, now + 15 * 60000);
      else
        db()
          .prepare("UPDATE rate_limits SET count=count+1 WHERE key=?")
          .run(key);
    }
  });
}

export function assertTestRecipient(recipient: string) {
  if (
    (process.env.RESEND_FROM || "").includes("onboarding@resend.dev") &&
    recipient.toLowerCase() !==
      (process.env.RESEND_SANDBOX_RECIPIENT || "").trim().toLowerCase()
  )
    throw new Error(
      "Test sender is restricted to the configured Resend account email. Your reservation remains saved.",
    );
}
export async function sendEmails(
  reference: string,
  origin?: string,
  eventId?: string,
) {
  db()
    .prepare(
      "UPDATE email_attempts SET status='queued' WHERE reference=? AND status='sending' AND claimed_at<?",
    )
    .run(reference, Date.now() - 60000);
  const events = db()
    .prepare(
      "SELECT * FROM email_attempts WHERE reference=? AND status IN('queued','failed') AND (? IS NULL OR id=?)",
    )
    .all(reference, eventId || null, eventId || null);
  for (const event of events) {
    const id = String(event.id);
    // Claim before awaiting template rendering: concurrent checkout requests
    // must never submit the same event twice.
    const claim = db()
      .prepare(
        "UPDATE email_attempts SET attempts=attempts+1,status='sending',error=NULL,claimed_at=? WHERE id=? AND status IN('queued','failed')",
      )
      .run(Date.now(), id);
    if (Number(claim.changes) !== 1) continue;
    try {
      const booking = getBooking(reference)!;
      const html =
        String(event.html) ||
        (await emailHtml(
          booking,
          event.kind as EmailKind,
          manageLink(booking.email, booking.reference, origin),
          origin,
        ));
      db().prepare("UPDATE email_attempts SET html=? WHERE id=?").run(html, id);
      if (!emailConfigured()) {
        db()
          .prepare("UPDATE email_attempts SET status='demo-preview' WHERE id=?")
          .run(id);
        continue;
      }
      const recipient = process.env.RESEND_TEST_RECIPIENT || booking.email;
      assertTestRecipient(recipient);
      reserveEmailSend(recipient);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": id,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM,
          to: [recipient],
          subject: `VIERCYS ${event.kind} \u00b7 ${booking.reference}`,
          html,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          String(result.message || "Email provider rejected the request"),
        );
      if (typeof result.id !== "string" || !result.id)
        throw new Error("Email provider did not return a message reference.");
      db()
        .prepare(
          "UPDATE email_attempts SET status='accepted',provider_id=? WHERE id=?",
        )
        .run(result.id, id);
    } catch (error) {
      // Template/provider failures cannot undo the already committed booking.
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
    assertTestRecipient(process.env.RESEND_TEST_RECIPIENT || email);
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
        html: `<div style="font:16px Arial;background:#F3EEE5;color:#233F4B;padding:32px"><h1 style="font-family:Georgia">VIERCYS</h1><p>Your private access link expires in 7 days and works once.</p><p><a href="${escapeHtml(link)}">Open My VIERCYS</a></p><p>VIERCYS is a fictional HCI classroom resort. No actual accommodation or payment is provided. Do not share this link.</p></div>`,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // Delivery failures are not reported to the requester (no enumeration).
  }
}
