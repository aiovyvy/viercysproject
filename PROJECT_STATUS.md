# VIERCYS — delivery status

Updated **10 October 2026**, branch `ux-rebuild`. Governing brief: [VIERCYS_CODEX_UX_REBUILD.md](./VIERCYS_CODEX_UX_REBUILD.md). Related documents: [UX_AUDIT.md](./UX_AUDIT.md) (before/after findings and screenshots) and [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md) (classroom procedure).

The previous version of this file reported the voucher, invite route and tutorial as complete. None of them existed in the code at that time. This version lists only what was checked.

## QA fix log (after the 10 October full-site audit)

### Group 1: security, rate limits, voucher recovery (done, tested)

| Audit item | Fix | Test |
| --- | --- | --- |
| C1: `/lookup` showed a working access link to anyone who typed an email, and revealed whether the email had a booking | The link is never returned over HTTP. `/api/lookup` answers identically for known and unknown emails and sends in the background (no timing difference). New primary path: booking reference **and** email must both match; failures get one generic message | `security.spec.ts` (generic error, 403 without match, access with match); `phase2.spec.ts` (identical JSON for known/unknown emails, no token in page) |
| H2: shared login/claim limits locked out the presenter after ~10 logins and the class after 60 claims | Failure-only throttling with 15-minute windows. Main key is an anonymous per-device cookie (`viercys_device`); per-IP (50 staff / 300 claim / 200 lookup) and per-account (100) caps are backstops. Successful logins and valid invite claims never count | `security.spec.ts`: one device locked after 5 failures, presenter still signs in after 17 failures from 13 devices, 13 successful sign-ins in a row, 70 students claim, token guessing throttled on the 21st try; unit test for the helpers |
| H1: losing a voucher race (or an expiry mid-checkout) left the student on a €0 page where every retry failed | The server returns `voucher_unavailable` (409) and clears the dead voucher cookie. The page explains why, re-prices at the standard rate, says nothing was booked or charged, and requires a fresh confirmation; the button now shows the amount. An unusable voucher is also explained on every booking step | `security.spec.ts`: two phones redeem one voucher at once; exactly one wins; the other sees €540.00 and is booked only after confirming that amount |
| H4: a booking link opened in another browser was a dead end | "Your booking is private" card with **Find my booking** (reference prefilled) and **Back to home** | `security.spec.ts` |

### Group 2: pricing and copy accuracy (done, tested)

| Audit item | Fix | Test |
| --- | --- | --- |
| H3: "before 13% tax" on `/santorini`, `/rooms/*`, `/compare`; concierge said "plus the displayed tax" | All say "per night, taxes included" | `content.spec.ts` scans those pages and `/faq`; unit test checks concierge replies |
| M1: checkout promised "cancel online until two days before arrival" even for arrival today/tomorrow; refusals said "Contact staff" with no contact anywhere | Checkout and the booking page show the actual last cancellation date (shared `cancelOnlineUntil` helper). Short-notice stays get a warning before confirming, and the cancel panel offers no button it would refuse. Server refusals name the date and point to the front desk. New `/contact` page explains the presenter is the front desk (no invented real contact details) | `content.spec.ts`: date shown, short-notice warning, no cancel button, Contact link works, server refusal text; unit test for the cutoff |
| M4: concierge answered "voucher" and "contact" questions with a generic island paragraph | Rules moved to `src/lib/concierge.ts` with answers for voucher, contact, extend, change dates, cancel, prices/tax, breakfast, transfers, rooms, check-in and finding a booking, each with links. Concierge page has tap-to-ask questions and shows the links | Unit test (6 questions); `content.spec.ts` |
| (link target) | `/faq` added now because Contact and the concierge link to it | `content.spec.ts` |

### Group 3: dead ends (done, tested)

| Audit item | Fix | Test |
| --- | --- | --- |
| H5: extending into a booked night said "no longer available. Please search again" with no alternative | The change preview returns `room_unavailable` (409) with options computed on the server: the longest extension that fits in the same room, and/or free rooms of the same type for the whole stay. The page says the booking is unchanged and offers **Extend by N nights instead**, **Move to room X for the whole stay** and **Keep current booking**; both options go through the normal price preview | `deadends.spec.ts`: both options end to end (4 → 5 nights, moved off room 104) |
| M5: a cancelled booking offered "Plan your visit" and no way to book again | **Book a new stay** / **Back to home**; trip-planning and change actions hidden | `deadends.spec.ts` |
| M6: Back after confirming showed "A selected room is no longer available" | The checkout remembers it was completed (sessionStorage) and shows "You've already booked this stay" with **View your booking** | `deadends.spec.ts` |
| M7: voucher holders weren't told their free room type was sold out | Notice on the room step with **Choose other dates**; the sold-out card no longer says "Fully covered" | `deadends.spec.ts` |
| Jargon: "Select exactly the requested number of different rooms" when no room was chosen | "Choose a room first" with a link back | `deadends.spec.ts` |
| **New bug found while testing:** each booking replaced the browser's guest session, so a second booking in the same browser locked the guest out of the first | Unverified guest sessions now hold up to 10 booking references; a verified email session is never downgraded | Unit test (both bookings readable, a stranger's session is not); `deadends.spec.ts` relies on it |

Test-only: Playwright sets `VIERCYS_DEV_OUTBOX` so access emails that can't be sent are appended to a server-side file the tests read. Nothing reads it over HTTP; leave it unset for classroom use.

## Verification on 10 October 2026

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, 0 problems |
| `npm run build` | Passed |
| `npm run test:unit` | **14 passed** (10 booking/voucher/invite/email, 4 AI-provider) |
| `npm run test:e2e` | **20 passed** (Chromium, production build, fresh SQLite, port 3100) |
| Flaky check | Calendar keyboard test was timing-dependent (6/10 failures); fixed with a polled assertion, then 15/15 passes |
| Manual LAN run | Full invite → booking journey from an emulated phone over `http://192.168.1.10` against `next start` |

Legend: **Tested** = covered by an automated test listed above. **Implemented** = code exists and was exercised manually or indirectly, with no dedicated test. **Partial** = works but falls short of the brief as noted. **Not done** = absent. **External** = needs credentials, devices or people not available here.

## P0 — mandatory

| Requirement | State | Evidence / notes |
| --- | --- | --- |
| Cinematic entrance with real perspective motion | Tested | Desktop: R3F/Three.js arches with a scroll-scrubbed camera, forward and reverse (`cinematic.spec.ts`). Phone: pinned 2.5D colonnade of three arch layers at different depths, scrubbed by scroll, no WebGL |
| Reduced-motion and no-WebGL fallback | Tested | Reduced motion: no pin and no canvas, static narrative. WebGL failure falls back to the 2D mask through an error boundary (Implemented; no forced-GPU-failure test) |
| Skip intro and booking CTA usable before scrolling | Tested | Header and hero "Book a stay", which reads "Claim your 3-night stay" when a voucher is active; sticky mobile button; "Skip to booking" in the passage |
| Invitation route `/invite/[token]` with honest demo copy | Tested | Brief's copy plus "Classroom demo · not a real travel prize" |
| Admin-only invite generation, opaque hashed tokens, expiry, single use | Tested | 192-bit tokens stored as SHA-256. Anonymous generation returns 401. Redemption is a conditional UPDATE inside the booking transaction |
| Unique links per participant; forwarded/reused link handled | Tested | Batch of 1–60 links. Reused link → "This invitation has been used." Unknown → explains and offers booking without a voucher |
| Voucher concurrency (two simultaneous redemptions) | Implemented | `BEGIN IMMEDIATE` plus conditional UPDATE. Unit tests are sequential; there is no simultaneous-request voucher test (the room-overlap concurrency test does exist) |
| Expired voucher | Tested (unit) | Not exercised in the browser |
| Exactly 20 rooms (10/6/4), operational state separate from bookings | Tested | Unchanged from the earlier build |
| Date validation: past, order, 222222 year, impossible dates, 24-month horizon, Athens calendar | Tested | Client and server. Fixed a crash when an impossible date was typed into the URL |
| Voucher pricing rule (3 Essential nights, upgrade on every night, extra nights at rate, unused nights no value) | Tested | 1/2/3/4/5 nights on Essential and Signature. Multi-room: voucher on one room only |
| Single server pricing function; client shows server figures | Tested | Room cards use server `due`; review uses `/api/quote`; booking recomputes on the server |
| Clear line items, one currency, tax handling | Tested | Rates are tax-inclusive (the 13% demo tax was removed). Old bookings that stored tax still show it |
| Accessible date/guest controls; parties > 4 via multiple rooms | Tested | −/+ counters with spoken labels; "needs at least 2 rooms" with **Use 2 rooms**; multi-room selection with capacity check |
| Overlap prevention, half-open ranges, idempotent checkout | Tested | Unchanged, plus voucher-safe retry (repeat submit returns the same booking after the cookie is cleared) |
| Confirmation with reference, dates, room, guests, voucher savings, balance, email status | Tested | Rebuilt page; private details need the session cookie or a verified link |
| My Stay retrieval, modify, **extend**, cancel, print | Tested | Extend and change dates preview the price before commit and keep the voucher. Cancel releases the room and the voucher. Receipt is print-to-PDF |
| Staff admin sees booking and voucher state | Tested | Reservations show "Demo voucher"; Invitations tab shows "Redeemed · VRC-…" |
| Branded email only when configured; honest status | Tested (mocked) | Voucher line added. No real Resend delivery performed (External) |
| Works for phones on the classroom LAN | Tested | Fixed three blockers: origin check rejected LAN POSTs, Secure cookies dropped on http, `crypto.randomUUID` missing on insecure origins |
| Readable typography, ≥44px targets, one booking flow, back navigation, current step | Partial | The booking flow, invite and confirmation pages meet the brief. Secondary pages (compare, room detail, Santorini, My VIERCYS list, lookup, profile, itinerary, concierge, admin) only got the global text-size floor, not a redesign |
| Optional dismissible 3-step guide with Skip/Back, remembered, replayable | Tested | Inline panel (not a modal), so it never traps focus or covers the keyboard. Stored in localStorage; falls back to hidden if storage fails |
| `DEMO_RUNBOOK.md`, `UX_AUDIT.md`, truthful status | Done | This file and the two linked above |

## P1

| Requirement | State | Notes |
| --- | --- | --- |
| Room photo gallery and details | Implemented | Existing `/rooms/[category]`; editorial stock photos, disclosed |
| Compare rooms | Implemented | Existing `/compare`, linked from the room step; old styling |
| Receipt / print | Implemented | Existing print stylesheet |
| Concise FAQ concierge | Implemented | Existing rules-based replies; links updated to `/book` |
| Room preference recommender | Removed from flow | The old "Find your sanctuary" panel was dropped to keep the room step simple |
| Optional extras | Tested | Collapsed on the review step; requests excluded from the total |
| QR codes for invites | Not done | Links can be copied |

## P2 (not required for the demo)

| Item | State |
| --- | --- |
| AI itinerary / concierge | Implemented with deterministic fallback; live provider untested (External) |
| Admin analytics | Existing occupancy/revenue report |
| PWA offline | Not done (online only, by design) |

## External or not yet done

- Real phone hardware (iOS Safari, Android Chrome), WebKit/Firefox engines, a screen-reader pass, and colour-contrast measurement have **not** been done. Browser tests use Chromium with an iPhone 13 viewport.
- No moderated usability session with classmates yet; the 2–4 minute target is unmeasured.
- Real email (Resend) and live AI need credentials.
- Supabase/Postgres migration is not wired; SQLite on one Node host is the supported setup.

## Next actions

1. Run the runbook once on real phones on the classroom Wi-Fi.
2. Bring the secondary pages (`/compare`, `/rooms/[category]`, `/my-stay` list) onto the booking-flow styles.
3. Add a simultaneous double-redemption API test and a browser test for an expired link.
4. Optional: QR rendering in the Invitations tab.
