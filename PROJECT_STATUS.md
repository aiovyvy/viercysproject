# VIERCYS — requirements and delivery status

Updated **9 October 2026 (Asia/Manila)**. Both complete briefs were read before implementation; the corrective directive takes priority. Working Phase 1 photography, palette, typography and navigation were retained. This is a fictional resort with genuine persistent demo reservations and simulated payment, not a live hotel.

## Required deliverables

- [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md): quick classroom demo flow, reset steps, fallback path, and admin verification notes.
- [UX_AUDIT.md](./UX_AUDIT.md): before/after UX issues and the specific routes/components that changed.

## Latest verified milestone

- [x] `npm run lint`: passed, zero errors/warnings.
- [x] `npm run typecheck`: passed.
- [x] `npm run build`: passed; all listed routes compile.
- [x] `npm run test:unit`: **12 passed** (8 booking/database/email groups, 4 AI-provider groups).
- [x] `npm run test:e2e`: **13 passed**, Chromium against the production build; fresh isolated SQLite database and port 3100, separate from the user's development server.
- [x] `npm audit --omit=dev --json`: **0 runtime vulnerabilities**. Full dependency audit still reports **5 high development-tooling findings** in the Next ESLint dependency chain; an incompatible forced downgrade was not applied.
- [x] Rendered screenshot inspection: desktop 3D arch, full mobile homepage and image-blocked mobile email preview. Automated desktop/mobile checkout, navigation, resize contexts, reverse scroll, keyboard controls and no-overflow checks passed.
- [ ] A real unassisted classmate usability session, physical-device GPU/FPS measurements, Safari/Firefox/Outlook/Gmail delivery matrix and a full screen-reader audit have not been performed. Browser automation is not described as a human usability study.

Legend: **Tested** = implemented and exercised by automated tests and/or listed rendered inspection; **Implemented** = code exists and was reviewed/build-checked, but no dedicated end-to-end assertion covers every variant; **External** = live verification needs a configured service/approved asset; **Optional deferred** = deliberately omitted optional functionality; **Migration work** = additional cloud implementation, not an environment variable switch. Unchecked items are not silently claimed complete.

## Priority 0 — audit and documentation

| Requirement | State | Evidence / remaining work |
| --- | --- | --- |
| Read master and corrective directive completely | Tested | Read before initial edits; current directive governs |
| Inspect existing routes, dependencies, state, validation and backend | Tested | Initial audit found nonpersistent Phase 1 search and missing post-booking/admin routes |
| Keep a complete feature checklist and work in tested milestones | Tested | This matrix replaces stale Phase 1 claims; validation/booking, cinematic and final workflow milestones were checked |
| Preserve functioning design | Tested | Original local photographs, editorial compositions, palette, hero and destination gallery remain |
| Actual setup instructions and environment example | Implemented | README.md, .env.example and docs/BACKEND.md describe the working backend and real integration boundary |

## Priority 1 — booking usability, dates and accessibility

| Requirement | State | Evidence / remaining work |
| --- | --- | --- |
| Header and hero high-contrast Book your stay | Tested | Direct /availability routes, immediate booking entry assertions |
| Persistent mobile booking action; skip to booking | Tested | Mobile/tablet navigation tests; 3D scene skip works |
| Near-fold functional search; destination/dates/adults/children/rooms | Tested | Santorini-only selectable inventory; form before scrollytelling |
| Three short booking steps and readable form/body labels | Tested | Homepage rendered inspection; body/input sizes and focus styles |
| Accessible custom calendar, native min/max, keyboard/Escape | Tested | Calendar opens, arrow key moves focus, Escape closes; HTML dates are supplemented |
| Strict client and server ISO calendar validation | Tested | Impossible/leap dates, year 222222, past, departure order, 730-day horizon and 30-night maximum |
| Property-local calendar/timezone, no shifted night arithmetic | Tested | Europe/Athens property date and UTC day-ordinal arithmetic |
| Adults 1–10, children 0–8, rooms 1–5 | Tested | Separate preserved counts, no global four-person maximum; one adult per room |
| Multi-room capacity policy and Add another room action | Tested | Actual capacities; tested occupancy allocations and multi-room room changes |
| Counts change without clearing dates | Tested | Homepage controls test |
| Configurable demo currency, nights, room/extras/tax/total | Tested | Integer cents, 13% displayed demo tax, matching server quote; EUR default |
| Loading/error/empty/sold-out/success states | Tested | Feedback and inventory states; all 20 rooms sold out in unit fixture |
| Search parameters persist across results/details/compare/checkout | Tested | URL-based selection/search parameters; no authoritative localStorage bookings |
| Calm conventional booking/account/admin/email UI | Tested | No pinned or scrubbed animation in transactional routes; mobile checkout succeeds |
| No-JavaScript homepage and destination alternative | Tested | Booking form server-renders; completion requires JavaScript |

## Priority 2 — cinematic Mediterranean experience

| Requirement | State | Evidence / remaining work |
| --- | --- | --- |
| Photographic Greek cliffside hero, natural light/Aegean | Tested | Existing local photography and scroll-linked hero depth preserved |
| Real spatial geometry and camera through limestone portal | Tested | R3F/Three.js extruded arches, beveled stone, texture/bump, floor and shadows; actual canvas browser assertion |
| Pinned architecture narrative controlled by reversible scroll | Tested | GSAP scrub drives camera, sunlight, layers and courtyard-to-suite framing; forward/reverse assertions |
| Vertical-scroll-controlled horizontal destination gallery | Tested | Fine-pointer desktop gallery; native fallback and complete /destinations alternative |
| Santorini available; Boracay/Amalfi/Bali coming soon | Tested | Preview navigation; no fake future booking inventory |
| Suite reveal and interactive category/photo preview | Tested | Category tabs support arrow keys; capacities/rates feed from the shared catalog |
| Calm story-to-booking transition and direct CTA | Tested | Closing booking entry, suite View rooms and scene Skip to booking |
| Mobile/coarse pointer/reduced-motion 2D fallback | Tested | No WebGL mounted in mobile or reduced-motion tests; normal vertical narrative |
| WebGL failure/context-loss photographic fallback | Implemented | Error boundary and spatial 2D fallback; explicit blocked-GPU browser fixture not added |
| Responsive measurements, reverse, no scroll-jacking/overflow | Tested | GSAP responsive reversion/refresh; desktop/mobile document overflow assertions |
| GPU/image controls | Implemented | Demand rendering, DPR cap 1.5, lazy scene, reused geometry, bounded textures/shadows and Next Image; no universal FPS claim |
| Brand palette/editorial serif/readable sans, no generic placeholders | Tested | Rendered desktop/mobile inspection; image-backed architectural compositions |
| Exact asset provenance and replacement manifest | Implemented | README.md and docs/CINEMATIC.md |
| Approved original property/category photography | External | All current imagery is disclosed stock/editorial inspiration; replacement paths and sizes documented |

## Priority 3 — complete guest journey

| Requirement | State | Evidence / remaining work |
| --- | --- | --- |
| Home, destinations index, Santorini property and future preview routes | Tested | Routes compile; navigation and future preview assertions |
| Optional skippable Smart Room Finder | Implemented | Purpose, priority (trip/space/value), budget; reasons and only available categories; no forced questionnaire |
| Real per-date availability with filters and sorting | Tested | SQLite physical inventory; category/price/space controls |
| Room detail/galleries, amenities/capacity/policies | Implemented | /rooms/[category], local editorial galleries, displayed restrictions and price |
| Compare up to three categories | Implemented | /compare table: size, views, amenities, capacity, rate, actual remaining inventory |
| Exactly 20 uniquely numbered rooms, 10/6/4 | Tested | DB seed assertions and admin 20-row inventory assertion |
| Per-room capacity; actual remaining category counts | Tested | Essential 2, Signature 3, Grand 4; availability and allocation fixtures |
| Operational states separate from booked date availability | Tested | Cleaning/occupied do not pretend future stays are sold out; maintenance and date blocks exclude new inventory |
| Multi-room selection and per-room adult/child allocation | Tested | Server validates unique requested rooms and adult minimum; checked UI room change from one room to two |
| Atomic overlapping-stay prevention and idempotency | Tested | BEGIN IMMEDIATE, DB triggers, half-open intervals, simultaneous booking requests, retry key/payload hash |
| Curate Your Escape extras and easy skip | Tested | Dinner/sailing/spa requests; breakfast/transfer confirmed-demo; quantity and live server summary |
| Pending extras excluded from paid total; special requests | Tested | Price fixture and romantic booking include dinner request and breakfast |
| Guest checkout without forced signup | Tested | Name/email, optional phone, requests, consent; actual reference after commit |
| Prominent simulated payment, no card/CVV collection | Tested | Checkout and confirmation workflow; status demo-paid and no real charge disclosure |
| Personalized success/reference/details/next steps | Tested | Hotel/dates/rooms/guest/extras/pricing/payment/manage/email/itinerary/receipt |
| My VIERCYS/history/protected reservation detail | Tested | Session-scoped reference or verified-email history; strangers cannot read booking details |
| Secure expiring single-use verified lookup | Tested | Hashed tokens; single-use verification; scoped confirmation tokens do not grant email-wide access |
| Modify dates/guests/room allocation, reprice, review before save | Tested | Availability conflict unit case and browser preview-before-commit, one-to-two-room change |
| Cancellation consent/policy/release/refund | Tested | Explicit checkbox, two-calendar-day cutoff, idempotent cancellation and demo refund ledger |
| Printable/downloadable receipt | Implemented | Print stylesheet and browser Print / save as PDF; no fake generated download |
| Optional demo digital check-in | Implemented | Arrival-day gate, own booking, explicitly disabled outside demo; staff check-in/out tested |
| Verified guest profile | Tested | Verified email required; name/phone saved in guests table; booking snapshots remain historical |
| Saved editable daily itinerary | Tested | Generate, edit, save and reload morning/afternoon/evening days |
| Interests/budget/pace/party/extras shape itinerary | Implemented | Inputs retained; modest budget and children influence fallback, interests and pace affect choices; AI receives all context |
| Confirmed extras vs suggestions vs approval requests | Tested | Separate labels and stored extras; no invented reservations/hours/costs |
| AI itinerary/concierge provider with graceful fallback | Tested / External | Four mocked provider tests; live provider needs OPENAI_API_KEY and has not been contacted |
| Concierge FAQ/dining/transport/booking navigation | Implemented | Deterministic fact-based replies and structured optional AI; no transaction permissions |
| Responsive installable guest companion | Tested / Implemented | Touch guest workflow tested; manifest/icons exist, browser installation support varies |
| Password account signup/signin | Optional deferred | Verified links support optional guest identity; no forced account requirement |
| Future-destination opt-in waitlist | Optional deferred | No storage/form implemented; previews do not advertise a working waitlist |
| Offline private reservation caching | Optional deferred | Online-only companion; sensitive booking data is not cached offline |

## Priority 4 — database, backend, security and staff

| Requirement | State | Evidence / remaining work |
| --- | --- | --- |
| Next.js/TypeScript/Tailwind/GSAP/R3F architecture | Tested | Production build, lint and typecheck; bundled Next 16.4 guides consulted |
| Persistent robust local development equivalent | Tested | SQLite file survives process/reload; browser and backend share the same persisted rows |
| Schema/migrations and idempotent exact-20 seed | Tested | database/sqlite.sql and scripts/seed.ts; non-destructive initialization and claimed_at migration |
| Store categories/amenities/rates/rooms/extras | Tested | 3 categories and 5 extras seeded in DB; physical room count assertions |
| Store blocks/bookings/allocations/guests/itinerary/email attempts | Tested | Foreign keys and persisted snapshots, saved edits and tested staff blocking |
| Payment/refund/repricing adjustment records | Tested | Demo ledger, adjustment/refund unit cases, staff report view |
| Database conflict/capacity/block constraints and transaction | Tested | Overlap, adjacent dates, sold-out, multi-room and modification tests; blocks reject booked dates |
| Server-only credentials; hashed sessions/tokens; salted staff passwords | Tested / Implemented | HttpOnly/SameSite/secure-production cookies, scrypt, token hashes, expiring sessions; no client service keys |
| Server authorization and cross-site mutation rejection | Tested | Stranger guest 403, unauthenticated admin 401, foreign Origin 403 |
| Rate-limited staff login/lookup | Implemented | Persistent hourly buckets and descriptive 429 handling |
| Separate role-based protected staff portal | Tested / Implemented | Manager login, server role guards, random private demo password; staff schema/role supported |
| Safe production staff configuration | Implemented | Non-demo production requires password >=12 characters; generated demo credentials alone do not activate it |
| Occupancy/upcoming arrivals summary | Tested | Same new guest booking is immediately visible to staff |
| Reservation/guest search, status filters and detail | Tested / Implemented | Searchable reservation table and deduplicated guest directory; detail links use server-authorized routes |
| Staff modify/cancel through protected booking detail | Tested / Implemented | Shared tested modification/cancellation service accepts staff; no bypass of availability/pricing |
| Date-based 14-day availability calendar | Tested | Calendar tab and persisted reservations/date blocks/maintenance indications |
| Room operational housekeeping/maintenance controls | Tested | Staff check-out sets cleaning; ready/occupied/maintenance controls use checked server endpoints |
| Staff check-in/check-out and accurate payment statuses | Tested | Operational flow and ledger tests |
| Occupancy/revenue period reports | Tested | Room-night occupancy and prorated room revenue; clearly simulated values |
| Supabase/Postgres/Auth deployment | Migration work | Robust SQLite is the supported allowed alternative. No remote adapter is wired. Explicit conversion/transaction/RLS/auth/mail-claim/testing path in docs/BACKEND.md |
| Multi-instance/serverless deployment, production backups/monitoring | Migration work | Not claimed ready; SQLite requires one persistent Node host, with deployment boundaries documented |

## Priority 5 — real email integration and premium preview

| Requirement | State | Evidence / remaining work |
| --- | --- | --- |
| React Email-rendered responsive branded HTML | Tested | Escaped inline table layout, wordmark, ivory/blue, system fonts and image alt fallback |
| Confirmation/modification/cancellation templates | Tested | Shared renderer, persisted outbox versions and tested booking actions |
| Optional pre-arrival reminder template | Implemented | Manager-triggered reminder endpoint/button; automatic scheduling is optional and absent |
| Reference/property/dates/rooms/guests/extras/totals/policies | Tested | Rendered content and fixture assertions; secure Manage Booking token |
| Email committed after reservation persistence | Tested | Outbox inserted transactionally, network submission afterward |
| Stored queued/sending/preview/failed/accepted status | Tested | Mock rejection/retry/accepted fixture, visible preview status |
| Idempotent retry, immutable HTML and safe email claim | Tested | Same provider key/body on retry; repeated accepted event not resent; stale claim recovery implemented |
| Delivered/sent/bounced/failed/delayed signed webhooks | Tested / External | Installed Svix raw-body verification, valid/invalid/replayed signed local requests; actual provider callbacks need configuration |
| Protected local preview and honest demo banner | Tested | Private iframe preview; no delivery claim without credentials |
| Desktop/mobile and image-disabled readability | Tested | Browser iframe assertions and rendered screenshot inspection; essential text remains with blocked images |
| Actual Resend submission/delivery to a mailbox | External | Requires RESEND_API_KEY, verified RESEND_FROM, reachable APP_URL and optional webhook secret; no real message sent during QA |
| Provider inbox/client rendering matrix | External | Gmail/Outlook/device inbox QA needs credentials and test delivery; browser preview is not equivalent |
| Unattended retry worker/automatic reminder scheduler | Optional deferred | Explicit retry and manager reminder work; no background scheduler is advertised |

## Priority 6 — QA and handoff

| Requirement | State | Evidence / remaining work |
| --- | --- | --- |
| Invalid years/leaps/past/order/horizon/length/timezone | Tested | Unit and browser/API hostile-date assertions |
| Capacity/multi-room/sold-out/price/extras | Tested | Booking tests and room-change browser workflow |
| Overlap/adjacent dates/concurrency/duplicate submission | Tested | Database and simultaneous production-route requests |
| Modification conflict/preview/save and cancellation | Tested | Unit conflicts, browser commit boundary, cancellation/refund |
| Unauthorized admin/guest ownership/secure lookup | Tested | Production-route and cookie-session checks |
| Email fallback/provider failure/retry/scoped link/signature | Tested | Mock provider plus production webhook tests |
| Desktop/mobile/tablet/reduced-motion/reverse/no-JS | Tested | Production Chromium suite and screenshots |
| Keyboard calendar and suite tabs | Tested | Arrow movement, Escape and ARIA-selected assertions |
| Staff sees actual guest booking; operations and profile persist | Tested | Romantic end-to-end and operational browser cases |
| Launch instructions, configuration and complete checklist | Implemented | README.md, .env.example, docs/BACKEND.md, docs/CINEMATIC.md and this file |
| External credentials/approved photos/full cloud adapter | External / Migration work | Explicit remaining boundaries above; no invented success |

## Current demonstration boundary

The application completes the classmate-style journey locally: search real physical demo inventory, select an appropriate room combination, review extras and costs, persist a simulated-payment reservation, view its private confirmation/receipt/email, save an editable itinerary, modify/cancel and observe it in protected staff operations. Real email and live AI are integration paths requiring configuration and subsequent live verification. Supabase deployment, original property photography, optional waitlists/offline features and external-client/performance/user-study QA remain explicitly tracked above.