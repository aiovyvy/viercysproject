# VIERCYS UX Audit

Audit of the primary HCI demonstration: a first-time student opens a three-night VIERCYS invitation on a phone, optionally follows a booking guide, chooses dates and a room, redeems the voucher, confirms, then views or extends the stay.

The "before" findings come from reading the repository at commit `dd27510` (10 October 2026), not from memory of the recording. The "after" evidence comes from automated browser runs on an emulated iPhone 13 viewport (Chromium) against a production build. Screenshots are in [docs/ux](./docs/ux). The earlier version of this file described a voucher, invite route and tutorial that did not exist in the code. This version replaces it.

## The five most serious problems found

| # | Problem (before) | Evidence in code | Fix (after) | Verified by |
| --- | --- | --- | --- | --- |
| 1 | **The invitation and voucher did not exist.** There was no `/invite` route, no invite table, no admin generator and no single-use rule, even though the runbook told presenters to "create a fresh demo voucher". | No match for `voucher`, `invite` or `tutorial` anywhere in `src/`, `database/` or `tests/` | `invites` table with hashed tokens, expiry and redemption ([database/sqlite.sql](./database/sqlite.sql), [src/lib/invites.ts](./src/lib/invites.ts)). Claim page [src/app/invite/[token]/page.tsx](./src/app/invite/[token]/page.tsx). Redemption runs inside the booking transaction. Admin **Invitations** tab ([src/components/admin-invites.tsx](./src/components/admin-invites.tsx)) | `tests/booking.test.ts` (single use, expiry, retry, cancel releases) and `tests/demo-journey.spec.ts` (reused link shows "This invitation has been used.") |
| 2 | **Pricing contradicted the premise.** A "complimentary" three-night Essential stay showed about €610 due, because full rate × nights was charged plus an invented 13% tax. The room screen also computed `price * 1.13` itself instead of using the server. | `pricing()` in `src/lib/booking.ts`; `src/components/journey-results.tsx` | One server pricing function applies the voucher: up to 3 Essential nights on one room. The upgrade difference is charged on every night and extra nights at the room rate. Rates are tax-inclusive. Room cards show server-computed "You pay" amounts | Unit cases for 1, 2, 3, 4 and 5 nights on Essential and Signature (3 Essential = €0; 5 Signature = €1,060 = 5×320 − 3×180). The browser test checks the same figures |
| 3 | **Room choice and navigation were unclear.** Rooms were picked by typing into a "Rooms to select" number box next to a "Compare" checkbox. The next button said "Continue to experiences", extras came before guest details, and the homepage had its own separate booking form. | `journey-results.tsx`, `journey-checkout.tsx`, `experience.tsx` | One flow: `/book` → `/book/rooms` → `/book/details` → confirmation ([src/components/booking-flow.tsx](./src/components/booking-flow.tsx)). There's a visible step indicator, a back link on every step, large room cards with **Select [room]**, and extras collapsed and optional. The old `/availability` and `/checkout` URLs redirect | `tests/phase1.spec.ts` and `tests/demo-journey.spec.ts` (`aria-current="step"` on each page) |
| 4 | **Text was too small for phones.** About 40 CSS rules were at 6–11px (nine at 9px, three at 7px, one each at 6px and 8px) and 26 at 12–13px. Important instructions were set in 9–10px uppercase captions. | `src/app/globals.css` | The booking flow uses 16–17px body text, labels of 14px or more, controls 48–52px tall and sans-serif for every control. Serif is only for large headings. A final "readability floor" block in `globals.css` lifts the remaining site captions to ≥14px and body copy to 16–17px | Rendered phone screenshots below. **Not** checked with a contrast-measuring tool |
| 5 | **Phones never saw the cinematic entrance.** The 3D/scroll sequence only ran on screens at least 900px wide with a mouse. Every phone got a static stack, and the passage came after the booking form and philosophy text. | `motionQuery` in `ArchitecturalJourney.tsx`; the CSS media query in `cinematic.module.css` | The passage now follows the hero directly. Phones without reduced motion get a pinned, scroll-scrubbed 2.5D colonnade: three arch layers at different depths pass the viewer at different rates, then the courtyard, sea copy and suite. WebGL stays desktop-only. Reduced motion keeps the static stack | `tests/cinematic.spec.ts`: phone scrubs progress past 0.3 with no canvas; reduced motion has no pin or canvas; desktop still renders 3D and reverses |

## Other issues fixed along the way

- **Confirmation page:** it showed raw status codes ("confirmed · demo-paid · not-arrived"), said "1 rooms", and had seven competing buttons (My Stay, Your Journey, Concierge, Receipt, Email preview, Retry, Modify…). It now shows a confirmed banner with a large reference, plain-language status, voucher savings and balance, and one action row: **Extend stay · Change dates · Print receipt · Back to home**. Each change shows a "Review the change" price preview before it is saved. Before: [docs/ux/before-confirmation-mobile.jpg](./docs/ux/before-confirmation-mobile.jpg). After: [docs/ux/after-5-confirmation-mobile.jpg](./docs/ux/after-5-confirmation-mobile.jpg).
- **Extend stay** did not exist as an action. It is now one step: choose extra nights, see the additional simulated amount, confirm. The voucher is kept and availability is rechecked.
- **Email status** now reads "Email is not configured for this demo, so nothing was sent" rather than the internal value `demo-preview`. It never claims a message was sent when it was not.
- **Crash on a hand-edited URL:** `/book/rooms?arrival=222222-01-01` hit the error page because `formatDate` threw on an impossible date. It now shows the validation message. Found by the new end-to-end test.
- **Classroom reset left admin locked out:** deleting the database generated a new manager password but kept the old `data/demo-staff.json`. The file is now rewritten whenever a password is generated, and `npm run reset` removes the database together with its WAL/SHM files.
- **Guest counters** are large −/+ buttons with spoken labels ("Add one child"). A party of more than 4 gets "A party of 6 needs at least 2 rooms" and a **Use 2 rooms** button instead of a dead end.

## After: the phone journey

| Step | Screenshot |
| --- | --- |
| Invitation, with "Classroom demo · not a real travel prize" | [after-1-invite-mobile.jpg](./docs/ux/after-1-invite-mobile.jpg) |
| Dates step with optional guide (step 1 of 3, Skip / Next) | [after-2-dates-guide-mobile.jpg](./docs/ux/after-2-dates-guide-mobile.jpg) |
| Room card: 5 nights Signature, "You pay €1,060.00" with the reason | [after-3-room-card-mobile.jpg](./docs/ux/after-3-room-card-mobile.jpg) |
| Review step with step indicator and voucher banner | [after-4-review-mobile.jpg](./docs/ux/after-4-review-mobile.jpg) |
| Confirmation | [after-5-confirmation-mobile.jpg](./docs/ux/after-5-confirmation-mobile.jpg) |
| Extend-stay preview before commit | [after-6-extend-preview-mobile.jpg](./docs/ux/after-6-extend-preview-mobile.jpg) |
| Phone scroll passage: arches → courtyard → suite | [1](./docs/ux/after-passage-1-arches.jpg), [2](./docs/ux/after-passage-2-courtyard.jpg), [3](./docs/ux/after-passage-3-suite.jpg) |

The passage screenshots were taken before the progress labels were moved above the fixed mobile booking bar. That spacing fix is not shown in these images.

## Not yet improved (honest gaps)

- Secondary pages (`/compare`, `/rooms/[category]`, `/santorini`, `/my-stay` list, `/lookup`, `/profile`, `/itinerary`, `/concierge`, `/admin`) still use the older layout. They benefit from the global text-size floor but were not redesigned.
- No colour-contrast measurement tool or screen-reader pass (VoiceOver/TalkBack) was run.
- Testing used Chromium with an iPhone 13 viewport. No real iPhone/Android device, Safari/WebKit or Firefox runs were done.
- There is no QR code generator. Admin provides copyable links, and a QR can be made from those links with any tool the presenter trusts.
- No moderated usability session with classmates has been run. The 2–4 minute target is a design goal, not a measured result.
