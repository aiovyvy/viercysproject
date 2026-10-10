import type { Booking } from "./booking";
import { money } from "./catalog";
import { formatDate, nights } from "./policy";

export function confirmationAmount(booking: Booking) {
  return booking.pricing.voucher && booking.pricing.total === 0
    ? "₱0.00"
    : money(booking.pricing.total, booking.currency);
}
/** Intentionally excludes guest identity/contact information and private links. */
export function confirmationShareText(booking: Booking) {
  return [
    "VIERCYS Hotels & Resorts · Santorini",
    booking.status === "confirmed"
      ? "My Stay Is Confirmed"
      : "Reservation Cancelled",
    `Reference: ${booking.reference}`,
    `Stay: ${formatDate(booking.arrival)} – ${formatDate(booking.departure)} · ${nights(booking)} nights`,
    booking.pricing.voucher
      ? "Complimentary invitation applied"
      : "Classroom reservation",
    `Reservation total: ${confirmationAmount(booking)}`,
    "Fictional HCI classroom demonstration. No real accommodation, travel or payment is provided.",
  ].join("\n");
}
