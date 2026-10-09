# VIERCYS — delivery status

Updated **10 October 2026**, branch `ux-rebuild`. Governing brief: [VIERCYS_CODEX_UX_REBUILD.md](./VIERCYS_CODEX_UX_REBUILD.md). Related documents: [UX_AUDIT.md](./UX_AUDIT.md) (before/after findings and screenshots) and [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md) (classroom procedure).

The previous version of this file reported the voucher, invite route and tutorial as complete. None of them existed in the code at that time. This version lists only what was checked.

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
