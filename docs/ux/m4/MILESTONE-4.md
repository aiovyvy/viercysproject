# Milestone 4: Mobile journey, slow networks, simultaneous bookings, consistency

Branch `ux-rebuild`, after commit `e1de696`. Journey screenshots were captured against an
**isolated QA server** (port 3200, throwaway `data/qa-m4.sqlite`, test-only password), so the
real local demo database and staff credentials were never touched or shown.

## The classmate journey on a phone (iPhone 13 viewport)

`before-01…16` and `after-01…16` show every step: invitation → guide → dates → rooms (live
availability, "Fully covered by your voucher") → review (€0.00, "nothing is charged",
consent) → confirmation → extend panel → My VIERCYS → itinerary → receipt → email preview →
lookup → concierge → used invitation → staff dashboard and staff login.

New automated test `tests/guest-journey.spec.ts`:

| Test | What it proves |
| --- | --- |
| Classmate journey | Redeem invitation, skip guide, choose dates, see availability, book for €0, reopen the booking **on a second phone** with reference + email, extend (previewed, then confirmed), cancel, get a clear next step. No sideways scroll, no page errors. |
| Two phones, one room | Both confirm the same room at once in the browser: exactly one books; the other sees "just reserved", **"Nothing has been booked or charged."** (new) and a working "Choose another room" link with their dates kept. |
| Slow network | On a throttled ~3G connection the homepage headline and booking link appear; a slow availability answer shows "Preparing your stay…"; a slow confirmation tapped twice sends **one** request and books once. |

Already covered by earlier suites and still passing: API double-booking race, idempotent
retries, voucher race re-pricing, 70 simultaneous invitation claims, keyboard-only booking.

## Visual consistency

- Booking flow, guest pages, staff, lookup, concierge, legal pages now use the shared type
  tokens (Cormorant Garamond headings, Inter text) instead of Georgia/Arial; body text 16px;
  booking headings resized for the new face.
- 404 and error pages rebuilt on the shared information layout with standard buttons
  ("Book a stay" instead of "Book your stay ↗").
- `after-pages-*-sheet.png`: book, compare, lookup, My VIERCYS, privacy, terms,
  accessibility, concierge, unknown invitation, 404 at 390px and 1440px.

## Disclosure

"Demo" wording now appears only where guests need it: invitation, review/payment step,
confirmation, Contact, FAQ, Privacy, Terms, footer. The editorial site has none.
