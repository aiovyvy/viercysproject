import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Booking } from "./booking";
import { confirmationAmount } from "./confirmation";
import { formatDate, nights } from "./policy";

let fontBytes: Promise<Buffer> | undefined;
const blue = rgb(0.137, 0.247, 0.294);
const ivory = rgb(0.976, 0.961, 0.929);
const muted = rgb(0.36, 0.39, 0.38);
const gold = rgb(0.66, 0.54, 0.36);
const clean = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, " ");
function lines(text: string, font: PDFFont, size: number, width: number) {
  const result: string[] = [];
  let line = "";
  // Character wrapping also handles long unbroken names without clipping.
  for (const character of clean(text)) {
    if (line && font.widthOfTextAtSize(line + character, size) > width) {
      result.push(line.trim());
      line = "";
    }
    line += character;
  }
  if (line) result.push(line.trim());
  return result;
}
/** Only the authorized API supplies this function's saved booking snapshot. */
export async function bookingConfirmationPdf(booking: Booking) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  fontBytes ??= readFile(resolve("src/assets/fonts/NotoSans-Regular.ttf"));
  const body = await pdf.embedFont(await fontBytes, { subset: true });
  const display = await pdf.embedFont(StandardFonts.TimesRoman);
  pdf.setTitle(`VIERCYS Booking Confirmation · ${booking.reference}`);
  pdf.setAuthor("VIERCYS Hotels & Resorts");
  pdf.setSubject("Fictional HCI classroom booking confirmation");
  pdf.setLanguage("en");
  const page = pdf.addPage([595.28, 841.89]);
  const width = page.getWidth();
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: page.getHeight(),
    color: ivory,
  });
  page.drawRectangle({ x: 0, y: 665, width, height: 177, color: blue });
  page.drawText("VIERCYS", {
    x: 48,
    y: 778,
    size: 33,
    font: display,
    color: ivory,
  });
  page.drawText("HOTELS & RESORTS", {
    x: 49,
    y: 757,
    size: 9,
    font: body,
    color: ivory,
  });
  page.drawText("SANTORINI  /  GREECE", {
    x: 49,
    y: 708,
    size: 10,
    font: body,
    color: ivory,
  });
  // A restrained architectural arch, drawn as vectors for crisp printing.
  page.drawSvgPath("M 0 95 L 0 36 C 0 -12 72 -12 72 36 L 72 95", {
    x: 474,
    y: 790,
    borderColor: gold,
    borderWidth: 1.3,
  });
  page.drawSvgPath("M 0 78 L 0 28 C 0 -9 54 -9 54 28 L 54 78", {
    x: 483,
    y: 777,
    borderColor: gold,
    borderWidth: 0.7,
  });
  const confirmed = booking.status === "confirmed";
  page.drawText(
    confirmed ? "Your Stay Is Confirmed" : "Reservation Cancelled",
    { x: 48, y: 618, size: 29, font: display, color: blue },
  );
  page.drawText(
    confirmed
      ? "Thank you for choosing VIERCYS. Your island story begins here."
      : "This document reflects the current status of your classroom reservation.",
    { x: 48, y: 592, size: 10, font: body, color: muted },
  );
  let y = 553;
  function row(label: string, value: string) {
    page.drawText(label.toUpperCase(), {
      x: 48,
      y,
      size: 8,
      font: body,
      color: muted,
    });
    const wrapped = lines(value, body, 11, 321);
    for (const [index, text] of wrapped.entries())
      page.drawText(text, {
        x: 218,
        y: y - index * 16,
        size: 11,
        font: body,
        color: blue,
      });
    y -= Math.max(31, wrapped.length * 16 + 12);
    page.drawLine({
      start: { x: 48, y: y + 10 },
      end: { x: width - 48, y: y + 10 },
      thickness: 0.35,
      color: rgb(0.8, 0.79, 0.75),
    });
  }
  row("Booking reference", booking.reference);
  row("Guest", booking.name);
  row(
    "Room & category",
    booking.pricing.rooms
      .map((room) => `${room.name} · Room ${room.number}`)
      .join(" / "),
  );
  row("Check-in", formatDate(booking.arrival));
  row("Check-out", formatDate(booking.departure));
  row(
    "Duration & guests",
    `${nights(booking)} nights · ${booking.adults} adults${booking.children ? `, ${booking.children} children` : ""}`,
  );
  row(
    "Invitation",
    booking.pricing.voucher
      ? `Complimentary invitation applied · ${booking.pricing.voucher.coveredNights} Essential nights covered`
      : "Standard classroom reservation",
  );
  row("Booking status", confirmed ? "Confirmed" : "Cancelled");
  const created = new Date(
    booking.created_at.includes("T")
      ? booking.created_at
      : booking.created_at.replace(" ", "T") + "Z",
  );
  row(
    "Confirmation date",
    created.toLocaleString("en-GB", {
      timeZone: "Europe/Athens",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " (Santorini)",
  );
  y -= 9;
  page.drawText(confirmed ? "TOTAL AMOUNT DUE" : "RESERVATION TOTAL", {
    x: 48,
    y,
    size: 9,
    font: body,
    color: muted,
  });
  page.drawText(confirmationAmount(booking), {
    x: 354,
    y: y - 3,
    size: 24,
    font: body,
    color: blue,
  });
  const disclaimer =
    "VIERCYS is a fictional hotel and this reservation is part of an HCI classroom demonstration. No real accommodation, travel or payment is provided. This booking confirmation is not a tax invoice or proof of payment.";
  page.drawLine({
    start: { x: 48, y: 123 },
    end: { x: width - 48, y: 123 },
    thickness: 1,
    color: gold,
  });
  for (const [index, text] of lines(disclaimer, body, 9, width - 96).entries())
    page.drawText(text, {
      x: 48,
      y: 101 - index * 14,
      size: 9,
      font: body,
      color: muted,
    });
  page.drawText("Where Earth Meets the Sea.", {
    x: 48,
    y: 37,
    size: 12,
    font: display,
    color: blue,
  });
  page.drawText("BOOKING CONFIRMATION  /  01", {
    x: 372,
    y: 37,
    size: 8,
    font: body,
    color: muted,
  });
  return pdf.save();
}
