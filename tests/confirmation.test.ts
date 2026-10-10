import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { bookingConfirmationPdf } from "../src/lib/confirmation-pdf";
import {
  confirmationAmount,
  confirmationShareText,
} from "../src/lib/confirmation";
import type { Booking } from "../src/lib/booking";
const booking = {
  reference: "VRC-PDF-123",
  name: "José Guest",
  email: "private@example.test",
  phone: "+123456789",
  arrival: "2027-06-01",
  departure: "2027-06-04",
  adults: 2,
  children: 0,
  rooms: 1,
  room_count: 1,
  roomIds: ["S-101"],
  allocations: [],
  extras: [],
  currency: "EUR",
  status: "confirmed",
  payment_status: "unpaid",
  checkin_status: "pending",
  version: 1,
  created_at: "2026-10-10 09:30:00",
  invite_id: "private-invite",
  classroom: true,
  requests: "Private request",
  pricing: {
    rooms: [
      {
        id: "S-101",
        number: "101",
        name: "Essential Room",
        rate: 18000,
        nights: 3,
        subtotal: 54000,
      },
    ],
    extras: [],
    roomSubtotal: 54000,
    extrasSubtotal: 0,
    tax: 0,
    total: 0,
    pendingApprovalTotal: 0,
    voucher: {
      roomId: "S-101",
      coveredNights: 3,
      unusedNights: 0,
      extraNights: 0,
      allowancePerNight: 18000,
      upgradePerNight: 0,
      upgradeTotal: 0,
      discount: 54000,
    },
  },
} satisfies Booking;
async function extracted(bytes: Uint8Array) {
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: false,
  });
  const pdf = await task.promise;
  const page = await pdf.getPage(1);
  const text = (await page.getTextContent()).items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ");
  await task.destroy();
  return text;
}
test("branded one-page A4 PDF contains saved Unicode guest, complimentary details and classroom disclosure", async () => {
  const bytes = await bookingConfirmationPdf(booking);
  const document = await PDFDocument.load(bytes);
  assert.equal(document.getPageCount(), 1);
  assert.deepEqual(document.getPage(0).getSize(), {
    width: 595.28,
    height: 841.89,
  });
  const text = await extracted(bytes);
  for (const expected of [
    "VIERCYS",
    "Your Stay Is Confirmed",
    "José Guest",
    "VRC-PDF-123",
    "Essential Room",
    "Room 101",
    "3 nights",
    "Complimentary invitation",
    "₱0.00",
    "Confirmed",
    "Confirmation",
    "fictional hotel",
    "not a tax invoice",
  ])
    assert.ok(text.toLowerCase().includes(expected.toLowerCase()), expected);
  for (const privateValue of [
    booking.email,
    booking.phone,
    booking.requests,
    booking.invite_id,
  ])
    assert.ok(!text.includes(privateValue));
});
test("long names and multiple rooms wrap; cancelled PDF does not announce a confirmed stay", async () => {
  const changed = {
    ...booking,
    name: "A".repeat(100),
    status: "cancelled",
    pricing: {
      ...booking.pricing,
      rooms: Array.from({ length: 5 }, (_, i) => ({
        ...booking.pricing.rooms[0],
        number: String(101 + i),
      })),
    },
  };
  const text = await extracted(await bookingConfirmationPdf(changed));
  assert.ok(text.includes("Reservation Cancelled"));
  assert.ok(!text.includes("Your Stay Is Confirmed"));
  for (let i = 101; i <= 105; i++) assert.ok(text.includes("Room " + i));
  assert.ok(text.includes("not a tax invoice"));
});
test("share summary omits identity, contacts, private links and room number; nonzero totals retain stored currency", () => {
  const summary = confirmationShareText(booking);
  for (const value of [
    booking.name,
    booking.email,
    booking.phone,
    booking.requests,
    booking.invite_id,
    "Room 101",
    "/booking/",
    "token=",
  ])
    assert.ok(!summary.includes(value));
  assert.ok(summary.includes(booking.reference));
  assert.ok(summary.includes("₱0.00"));
  assert.ok(summary.includes("Fictional HCI"));
  assert.ok(
    confirmationAmount({
      ...booking,
      pricing: { ...booking.pricing, total: 12345 },
    }).includes("123.45"),
  );
});
