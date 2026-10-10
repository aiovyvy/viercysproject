# Production readiness for the classroom presentation (Milestone 5 audit)

Goal: classmates open a normal **HTTPS link** on their own phones (no Wi-Fi sharing, laptop
off), redeem an invitation, book, receive real emails, and manage their stay, while staff
run the front desk from /admin.

Audited on 2026-10-10 against commit `d0f06c8`. Nothing has been deployed, migrated or
connected to a paid service.

## 1. What already works (verified)

| Area | State | Evidence |
| --- | --- | --- |
| Booking engine | Real availability rules, 20 physical rooms, atomic `BEGIN IMMEDIATE` transactions, database triggers against overlapping stays, idempotent checkout, voucher race handling | 19 unit tests, 57 browser tests (incl. two phones racing for one room, 70 simultaneous invitation claims) |
| Invitations | Random 24-byte tokens, stored only as hashes, single-use, expiring, redeemed inside the booking transaction, visible in /admin | `tests/booking.test.ts`, `demo-journey`, `guest-journey` |
| Staff dashboard | Reservations + status, invitations, inventory/housekeeping/blocks, calendar, guests, reports, simulated payments | Local login verified; see `docs/STAFF_LOGIN.md` |
| Security | scrypt-hashed staff password, hashed sessions, HttpOnly/SameSite cookies (Secure on HTTPS), cross-site request checks, throttling on login/lookup/invites, guests can only open their own booking | `security.spec`, `phase2.spec` |
| Confirmation email | HTML template, Resend sending, honest "not sent" preview when unconfigured, retries without duplicates, signed webhooks | unit tests with mocked Resend |
| Concierge | Works without any AI key (deterministic answers); OpenAI optional | `ai-provider.test.ts` |

## 2. What is missing, exactly

| # | Gap | Why it blocks a public demo | Who |
| --- | --- | --- | --- |
| G1 | **Persistent hosted database.** The app uses a local SQLite file through synchronous `node:sqlite` (~70 call sites in `db.ts`, `booking.ts`, `email.ts`, `invites.ts`, the API route, `admin/page.tsx`). | Serverless hosts (Vercel) have no persistent disk: bookings would vanish. | Code: me. Account: you. |
| G2 | **Invitation email.** Staff can create invitation links, but there is no invitation email template or "send" action. Links must currently be copied and shared by hand. | You want classmates to receive an invitation message. | Code: me. |
| G3 | **Sending domain for email.** Resend requires adding and verifying at least one domain before it sends. | Without it, no real email reaches classmates. | You (domain + DNS). |
| G4 | **Production settings.** `APP_URL` (the HTTPS address), `VIERCYS_ADMIN_PASSWORD`, `VIERCYS_DEMO_MODE=true`, Resend keys, and `RESEND_TEST_RECIPIENT` **left empty** (if set, every email goes to that one address). | Wrong links in emails, no staff access, or misdirected mail. | You (in host dashboard). |
| G5 | **Pre-presentation reset and backup** routine for the hosted database. | Start the class with clean data and recover if needed. | Docs: me. |
| G6 | **Real room interiors** (see `docs/ux/m1/MILESTONE-1.md`). | Not a blocker; the site honestly shows Santorini instead. | You (supply or approve generated images). |

The current fallback is ready **today**: run locally and share invitation links by hand.
It only works while your laptop is on and phones can reach it.

## 3. Hosting options (free-tier facts checked 2026-10-10)

| Option | What changes in code | Cost | Free-tier catches |
| --- | --- | --- | --- |
| **A. One Node server with a persistent disk** (e.g. Railway) | Almost none: keep SQLite, add a start command and a volume path. | Railway Hobby is reported at **$5/month** including $5 of usage, plus volume storage; an always-on app may cost more (third-party figures, confirm on Railway). | Not free. One instance only (fine for a class). |
| **B. Vercel (website) + Turso (hosted SQLite / libSQL)** | Make the data layer asynchronous (~70 call sites); the SQL and triggers stay SQLite, so the port is the smallest of the free options. | **$0** expected. | Vercel Hobby is for "personal, non-commercial use"; Turso's free plan is reported as 5 GB storage and 500 M row reads/month (third-party, confirm on turso.tech). |
| **C. Vercel + Supabase Postgres** (the option you named) | Asynchronous data layer **plus** a Postgres schema: DATE/JSONB types, a GiST exclusion constraint for overlapping stays, RLS, atomic mail claims (already outlined in `docs/BACKEND.md`). | **$0** expected. | Supabase Free: 500 MB database, 2 active projects, **pauses after 7 days without activity** (open it the day before class). |

Vercel Hobby limits (official): 1 M function invocations/month, 4 h active CPU/month,
100 GB transfer, hard caps with no paid overage. A class demo is far below these.

**Recommendation:** **B (Vercel + Turso)** if you want $0 with the least risky code change;
**C** if your course specifically requires Supabase/Postgres; **A** if you'd rather pay about
$5 for a month and change almost nothing. Concurrency stays safe in all three as long as
each booking remains one atomic transaction (B keeps the same SQL triggers; C uses the
exclusion constraint).

## 4. Email plan (Resend)

- Free plan (official): **3,000 emails/month, 100/day**, 3 custom domains. A class of ~70
  needs ~70 invitations + ~70 confirmations, so it is best spread over two days or kept
  below 100 per day.
- You must **own a domain** (or a subdomain of one) and add Resend's DNS records at your
  domain provider. Sending from a free email address (Gmail etc.) is not possible.
- Environment variables (set in the host, never committed): `RESEND_API_KEY`,
  `RESEND_FROM` (e.g. `VIERCYS <stay@mail.yourdomain>`), optional `RESEND_WEBHOOK_SECRET`.
- **Invitation email to build (G2):** VIERCYS header image and wordmark, "You're invited to
  a complimentary three-night stay", the classroom disclosure, one large "Claim your stay"
  button with the unique link, the expiry date, a plain-text version, and phone-width
  layout. Staff would paste a list of emails in /admin; each address gets its own
  single-use link. The app must report "sent" only when Resend accepts the request.
- **Confirmation email:** already sends reference, dates, room, voucher coverage and
  simulated charges with a secure manage link. Proposed polish: match the new typography
  and add the "requests are confirmed by our team" note for extras.

## 5. Proposed next steps (each needs your approval)

1. **Choose a hosting option** (A, B or C). *Approval needed.*
2. I implement it **locally**: data-layer port, schema/migration script, same tests run
   against a local equivalent, plus a step-by-step deploy guide. No account is touched.
3. I implement the **invitation email** and the "send invitations" action, with the
   honest preview fallback when email isn't configured.
4. **You** create the accounts (Vercel and Turso/Supabase or Railway; Resend), verify the
   domain, and paste the environment variables. I walk you through each screen.
5. We deploy together to a **preview URL**, run the phone journey on real devices, then
   reset the data before class. *Deploy approval needed.*

## Sources

- Supabase pricing: https://supabase.com/pricing
- Vercel pricing (Hobby terms and limits): https://vercel.com/pricing
- Resend pricing: https://resend.com/pricing
- Resend domains ("must add and verify at least one domain"): https://resend.com/docs/dashboard/domains/introduction
- Turso pricing / free plan announcement (verify current numbers): https://turso.tech/pricing, https://turso.tech/blog/turso-cloud-debuts-the-new-developer-plan
- Railway pricing summaries (third-party, verify): https://pricingsaas.com/companies/railway
