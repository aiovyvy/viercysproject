# VIERCYS visual refinement and booking email delivery

Work stays in the existing project on `ux-rebuild`. No push, public deployment, paid service, payment-card collection or unrelated file deletion was performed.

## Visual fixes

- Preserved the original GSAP/Three.js architectural entrance and its phone/reduced-motion fallbacks.
- Removed the later GSAP image scaling/color-filter zooms. Courtyard uses an architectural mask; the sea window opens directionally; the final invitation opens vertically. Shared editorial introductions use a short vertical settle instead of zoom. Destination and philosophy photography no longer use the former large scroll scales.
- Desktop rooms now crossfade a fixed-size featured photograph rather than widen competing image panels. Scroll, click and keyboard selection still update the title, description, rate and existing room link. Mobile retains the vertical chapters.
- Experiences crossfade with a short directional movement instead of scaling each photograph.
- The partial `04` was part of the `Chapter / total` counter inside a viewport with a large rounded lower-left corner and clipping. The counter now lives below the photo in its own caption row, outside the image mask. The mask continues to shape only photography. Desktop shows the full count and active experience title; phones keep inline images and no clipped overlay.
- Next Horizons photographs begin vertically offset and partially masked, then reveal with a left-to-right stagger driven by scroll. Captions remain outside the masks; Boracay, Amalfi and Bali keep country names and Coming Soon labels. Hover is unnecessary.

## Guest wording

Prominent labels now read `Reservation total`, `Confirm reservation`, `Invitation voucher`, `Additional amount` and `Digital check-in`. The itinerary uses `Suggested island itinerary` instead of an implementation-specific fallback label. The details form explains that email is used for confirmation and reservation management.

The booking review retains a bold, visible classroom statement: **no accommodation or payment is provided**. Consent and the confirmation/email disclosures remain explicit. Staff terminology and internal simulation state identifiers are preserved.

## Confirmation email

Reused the existing Resend HTTP sender, VIERCYS HTML template, persistent email events, provider idempotency keys, authenticated retry endpoint and signed/deduplicated webhook endpoint.

The existing booking transaction validates and saves the guest address, reservation and unique confirmation event before sending. The email includes the name, reference, property, room, dates, adults/children, pricing and a thank-you message, with an explicit HCI classroom simulation disclosure. Credentials remain server-side.

Delivery claims now happen before asynchronous rendering, so concurrent checkout/delivery calls cannot both submit an event. Template and provider failures are caught and stored as failed email status without undoing the reservation. The booking endpoint additionally protects its successful response from unexpected email-processing failures. Accepted events are never re-sent; failed events reuse their key and stored HTML.

Provider traffic is bounded transactionally to ten attempts per recipient and 200 globally per 15 minutes, including failures/retries. The existing owner authorization and same-origin checks remain in place. Preview-only events can be retried from the booking screen after credentials are configured. `accepted` remains distinct from webhook-confirmed `delivered`.

**Real inbox delivery has not been tested.** No Resend API key, sender or webhook secret is configured locally. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for the precise environment variables, verified domain requirements, optional delivery webhooks, inbox verification procedure and the provider's 24-hour idempotency limitation. Local tests use a mocked Resend response; no external mail is sent.

## Verification

- Production build and TypeScript: passed.
- ESLint and whitespace checks: passed.
- Unit tests: **21 passed** (17 booking/email tests plus four provider tests).
- Full regression suite: **63 passed (2.5 minutes)**. After the final fixed-size room and transactional send-limit refinements, **17 affected browser tests passed again (1.2 minutes)** on the final production build.
- Chromium screenshots include beginning/midpoint/end of the destination stagger and the yacht chapter at desktop, 390px and 320px, with the pointer parked at `(0, 0)`.
- New browser regressions verify changing computed masks, stagger order, captions separate from masks, photo/counter geometry, mobile overflow, saved preview confirmations, duplicate submission, retry authorization and invalid-address rejection.
- Room regressions additionally assert a fixed visual size and fully visible active photograph after each scroll-driven crossfade.
- Existing checks cover booking/voucher/inventory/staff flows, signed webhooks, reduced motion, no-JavaScript content, keyboard booking and axe accessibility.

Screenshots are local generated artifacts under `test-results/refinement/`, including `horizons-0.png` through `horizons-2.png`, `yacht-1440.png`, `yacht-390.png`, `yacht-320.png`, and the room sequences from `milestone6.spec.ts`. No physical-phone frame-rate measurement or cross-browser certification is claimed.

A temporary Playwright configuration reuses a separately managed local production server to avoid the previously observed Windows server-teardown stall. It uses the existing isolated test database/settings and is removed after verification. Test assertions were updated for the requested wording changes; no regression coverage was removed.

## Changed implementation files

`src/app/experience.tsx`, `src/app/api/[...path]/route.ts`, `src/app/destinations/destinations.module.css`, `src/app/philosophy/philosophy.module.css`, `src/components/home/RoomsShowcase.tsx`, `src/components/home/Experiences.tsx`, `src/components/home/home.module.css`, `src/components/editorial/ScrollReveal.tsx`, `src/components/editorial/hero.module.css`, `src/components/editorial/story.module.css`, `src/components/booking-flow.tsx`, `src/components/journey-stay.tsx`, `src/components/journey-itinerary.tsx`, `src/lib/email.ts`, `.env.example`, plus focused new tests and existing wording assertions.
