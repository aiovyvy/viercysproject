# VIERCYS Hotels & Resorts

A working fictional Santorini reservation application: Next.js 16.4 App Router, React 19, TypeScript, Tailwind CSS, GSAP ScrollTrigger, React Three Fiber, persistent SQLite, React Email rendering and optional Resend/OpenAI integrations. No actual accommodation, transport, activities or money is booked.

## Launch locally in PowerShell

Use Node.js **22.18 or newer**; this backend uses `node:sqlite`. Dependencies are already installed in this workspace.

```powershell
cd "C:\Users\Kenjo Condez\Downloads\viercys-hotel"
npm install
npm run seed
npm run dev
```

Open **http://localhost:3000**. The seed is idempotent and also runs automatically on first database access. Stop your server with **Ctrl+C**. If Next reports that this repository already has a development server, use its printed URL; do not launch a second one. To load these changes, stop the existing server in its terminal and run `npm run dev` again. Do not delete its lock while it is running.

The default authoritative database is `data/viercys.sqlite`, preserved across reloads and server restarts. It contains exactly 20 physical rooms: 101–110 Essential, 201–206 Signature, 301–304 Grand. Prices are sample EUR amounts, stored as integer cents; capacities are 2, 3 and 4 respectively. The local demo has no card fields and never charges money.

## Staff access

Open **/admin**. The seed generates a random manager password into the private, gitignored **data/demo-staff.json**. Read that file locally; do not publish it. If `VIERCYS_ADMIN_PASSWORD` is configured, use username `manager` and that password instead. It must have at least 12 characters. Staff sessions are separate from guest sessions; access and manager-only actions are checked on the server.

## Demonstrate the complete journey

1. Open the homepage and use Book your stay or the near-fold reservation form. Choose Santorini, three nights and two adults.
2. Compare categories; select a Signature Suite. Select multiple rooms when your party requires them.
3. Add optional breakfast and a romantic dinner request. Requested dinner, sailing and spa are excluded from the charged demo total and visibly await approval.
4. Enter guest details, accept the displayed policy and confirm the **simulated payment**. The reservation is committed before its reference appears.
5. Open My Stay, the email preview, printable receipt and editable Your Journey itinerary. Changes show a new quote before explicit confirmation; cancellations require explicit confirmation and observe the two-day cutoff.
6. Sign into /admin in another browser/session to see the same booking immediately. Inspect inventory, calendar, guests and reports; exercise check-in/out and housekeeping.

The booking browser receives access to its own reservation. To access all stays with an email, use /lookup. Without delivery credentials, the demo shows a clearly labeled verification shortcut. It does **not** prove mailbox ownership. Outside demo mode, that shortcut is disabled. A confirmation/preview Manage Booking token is scoped to that reservation; it cannot unlock other guests' bookings.

## Configuration

Copy `.env.example` to `.env.local`, fill only the services you use and restart Next. `npm run seed` also reads `.env.local`. Never commit credentials.

- `VIERCYS_DB_PATH`: persistent SQLite path; default data/viercys.sqlite. Use an absolute path on a persistent disk when deploying.
- `VIERCYS_DEMO_MODE`: development enables the labeled demo automatically. Production requires explicit `true` for demo lookup shortcuts/generated staff access/digital check-in.
- `VIERCYS_ADMIN_PASSWORD`: configured manager password, at least 12 characters; no shipped default.
- `NEXT_PUBLIC_DEMO_CURRENCY`: default EUR. Rebuild after changing this public setting. Amounts remain sample prices; this is not exchange-rate conversion.
- `APP_URL`: the URL guests can reach, used in email images and secure links. A localhost URL is unsuitable for external recipients.
- `RESEND_API_KEY` and `RESEND_FROM`: enable real server-side email submission. Verify your sender/domain with Resend. `RESEND_TEST_RECIPIENT` optionally redirects test emails; that recipient receives private access links, so use only a mailbox you control and clear the override for normal recipient delivery.
- `RESEND_WEBHOOK_SECRET`: configure a Resend webhook to POST to `/api/email-webhook`. Signed sent/delivered/bounced/failed/delayed events update stored statuses. Duplicate event IDs are ignored. The installed Svix verifier authenticates the raw body before JSON parsing.
- `OPENAI_API_KEY` and optional `OPENAI_MODEL`: enable structured AI suggestions. Missing keys, timeouts, refusal, invalid responses or provider errors fall back to saved deterministic suggestions. Guest inputs are treated as data. Responses do not modify bookings or charge money.

Emails use React Email's renderer with escaped, inline-styled table content and system fonts. Confirmation, modification, cancellation and manager-triggered reminder templates share the brand layout. No key/sender means **demo-preview**, never sent. A successful provider response means **accepted**, not delivered. Retry is explicit in My Stay; provider idempotency keys and stored HTML are reused. There is no unattended background retry/reminder scheduler in this build.

## Routes

| Route | Working behavior |
| --- | --- |
| / | Photographic hero with a Book a stay / Claim your 3-night stay CTA, scroll-driven arch passage (WebGL on desktop, layered 2.5D on phones), suite preview, destination gallery |
| /invite/[token] | Single-use demo voucher invitation; Claim your stay stores it in an httpOnly cookie |
| /book → /book/rooms → /book/details | Three-step booking: dates and guests, room cards with server-priced voucher cost, review with itemised price, guest details and optional extras |
| /destinations; /destinations/boracay; /destinations/amalfi; /destinations/bali | Honest future previews; no pretend inventory or waitlist submission |
| /santorini | Property, category capacities/rates, policies and booking entry |
| /rooms/essential; /rooms/signature; /rooms/grand; /compare | Editorial galleries, room details and comparison of up to three categories |
| /availability; /checkout | Redirect to the /book flow for old links |
| /booking/[reference] | Protected confirmation and manage stay: extend, change dates, change guests/rooms (each previewed before saving), cancel, email status |
| /booking/[reference]/receipt; /booking/[reference]/email-preview | Print/save PDF and protected branded email preview |
| /my-stay; /lookup; /profile | Reservation history, expiring single-use access, verified guest profile |
| /itinerary/[reference]; /concierge | Saved editable daily suggestions and optional AI guidance |
| /admin | Protected roles; reservations (with voucher state), invitations (create and track links), guests, inventory, calendar, reports |

My VIERCYS has a web app manifest and install icons. Installation support varies by browser. This is an **online-only** companion: private booking data is not cached offline.

## Verification

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright runs a production server at **3100**, with a fresh isolated database; it does not stop or reuse your dev server. Build first after source changes. Unit tests use temporary databases and mocked external providers. `PROJECT_STATUS.md` records the latest actual results and feature limitations.

Production preview of this fictional demo:

```powershell
$env:VIERCYS_DEMO_MODE="true"
npm run build
npm run start
```

SQLite deployment requires a single Node host and persistent writable disk, not a stateless/serverless filesystem. The supported backend is SQLite; Supabase credentials alone do not switch it. See `docs/BACKEND.md` for deployment boundaries and the explicit Postgres migration path. Node 22 may print an experimental SQLite warning. The current audit has five high findings in development lint tooling; no incompatible automatic downgrade was applied.

## Photography and cinematic behavior

All images are temporary stock/editorial inspiration, not actual VIERCYS property or category photographs. Replace them with coherent approved room/architecture imagery before presenting this as a real property. Full motion/fallback/asset details are in `docs/CINEMATIC.md`. Mobile, coarse pointer and reduced-motion modes retain normal vertical flow without loading the 3D scene. The homepage booking form also renders without JavaScript; completing a booking requires JavaScript.

| Local file | Original source |
| --- | --- |
| public/images/santorini.jpg | https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e |
| public/images/architecture.jpg | https://images.unsplash.com/photo-1533105079780-92b9be482077 |
| public/images/suite.jpg | https://images.unsplash.com/photo-1600210492486-724fe5c67fb0 |
| public/images/boracay.jpg | Laurentiu Morariu: https://unsplash.com/photos/NR-2_RIb62k |
| public/images/amalfi.jpg | Sylvain Perona: https://unsplash.com/photos/N32Di3LG-t0 |
| public/images/bali.jpg | https://images.unsplash.com/photo-1537996194471-e657df975ab4 |

Room pages and booking room cards use `public/images/santorini/` (Openverse / Wikimedia Commons). CC BY images must keep their credit, which the room-page lightbox shows on every photo:

| Local file | Creator | License | Source |
| --- | --- | --- | --- |
| santorini/oia-sunset.jpg | kuhnmi | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Sunset_in_Oia1.jpg |
| santorini/oia-evening.jpg | kuhnmi | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Sunset_in_Santorini1.jpg |
| santorini/white-stair.jpg | Klearchos Kapoutsis | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Is_it_waiting_us%3F_(2790256647).jpg |
| santorini/parasols.jpg | Klearchos Kapoutsis | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Parasols_(2784723537).jpg |
| santorini/stone-door.jpg | Klearchos Kapoutsis | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Old_Door_(4346766078).jpg |
| santorini/caldera-table.jpg | Klearchos Kapoutsis | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:A_table,_two_chairs_and_an_umbrella..._(2260966802).jpg |
| santorini/courtyard-door.jpg (cropped) | Winniepix | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Traditional_houses_beneath_the_churches_in_Firostefani,_Santorini,_Greece_(34473665406).jpg |
| santorini/caldera-dusk.jpg | Sgroey | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:View_of_Caldera_at_Sunset_from_Imerovigli,_Santorini.jpg |
| santorini/sea-terrace.jpg | rawpixel | CC0 | https://www.rawpixel.com/image/5924623 |
| santorini/caldera-pool.jpg | rawpixel | CC0 | https://www.rawpixel.com/image/5963329 |
| santorini/cliff-pools.jpg | rawpixel | CC0 | https://www.rawpixel.com/image/6054528 |
| santorini/chapel-arch.jpg | rawpixel | CC0 | https://www.rawpixel.com/image/6036805 |

Review the Unsplash license (https://unsplash.com/license) and replacement rights. The pre-existing Microsoft.Services.Store.winmd is preserved.