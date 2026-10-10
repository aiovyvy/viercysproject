# Shared classroom invitations

After Vercel deploys the updated `ux-rebuild` branch, open **https://viercys.vercel.app/admin**, sign in as `manager` with your existing private password, and select **Invitations**. The new **Shared Class Invitations** section appears below the existing individual invitation generator. Guest pages contain no administration controls.

1. Enter a campaign name, such as **HCI Class 2026**.
2. Set the maximum unique redemptions (default **30**, maximum 300), expiration in your local time, and Active or Paused status.
3. Optionally paste eligible student identifiers, one per line. Identifiers are normalized to uppercase and must contain 2–64 letters, numbers, dots, hyphens or underscores. A roster generates a different private claim code for every listed identifier.
4. Choose **Create shared invitation**. Use **Copy Shared Link** and save the URL immediately. The original shared token is stored only as a hash, so the URL is displayed only at creation and cannot be recovered after refreshing/leaving. The same applies to the private roster codes.
5. Paste **only the shared URL** into your class Messenger chat or use it as the destination of your QR code. If using a roster, send each student their own code individually; do not post the codes or roster in the group chat.

The link uses `/invite/class/[secure-token]`. Its host comes from the server's canonical `APP_URL`. Production should have `APP_URL=https://viercys.vercel.app`; localhost-created links point to localhost and are not public classroom links. No environment values were changed by this feature.

## What classmates experience

The mobile invitation page explains the complimentary three-night Essential Room stay, validity, optional upgrades/extras and academic disclosure. Guests enter a full name, student identifier, optional email and, for roster campaigns, their private code. They then use the existing dates, physical room selection and review/confirmation flow.

Visits, refreshes and registration do not consume places or reserve rooms. Only a successfully saved booking consumes one place. Class bookings are exactly three nights in one room. An Essential Room is fully covered by the existing voucher; choosing upgrades/extras retains the existing transparent classroom pricing. No real payment, travel or accommodation is provided. Availability is shared with all existing bookings, so a campaign of 30 does not promise 30 simultaneous rooms: students may need different dates.

The confirmation page always shows the saved booking and unique reference. Without email, guests should save their reference and keep their browser session. Staff can assist with recovery on another device; an identifier or reference alone does not grant access to someone else's reservation. There is no new public student/booking directory.

Email is optional only for shared-class bookings; ordinary bookings retain their existing email requirement. Missing email creates no email event and does not contact Resend. Entered email addresses use the existing delivery guards: `onboarding@resend.dev` sends only to the configured Resend account recipient. Other classmates still receive their on-screen reservation confirmation. A verified sender domain is required for their email delivery. Existing provider acceptance/retry safeguards remain unchanged.

## Staff controls and privacy

Campaign cards show creation and expiration dates, redemption counts, current status and linked guest booking records. Managers can pause or resume campaigns; expired/full campaigns accept no new bookings. Pausing leaves existing reservations valid.

Self-entered student identifiers provide basic duplicate prevention, **not proof of real-world identity**. A preapproved roster with individually distributed secret codes provides stronger claim protection, but codes can still be forwarded. Protect those codes like private invitation links. Rosters, identifiers and booking records are never exposed to other guests. Public errors for an already-claimed identifier include no name, email or booking reference.

One redemption per normalized student identifier per campaign remains consumed even after cancellation. This prevents repeatedly claiming complimentary stays. Existing individual vouchers keep their prior cancellation behavior. Duplicate checkout requests return the original booking instead of consuming another place.

## Migration and verification

The existing Turso database has already received additive migration **2**, before the code push. The upgrade creates four tables and three triggers plus the version marker. It changes no existing booking, invitation, room, password or session. Counts immediately before/after migration were identical: 12 bookings, 42 individual invitations, 20 rooms and one staff account; foreign-key validation passed.

For another already-initialized database, run `npm.cmd run db:migrate-class` with its server credentials configured. It is idempotent and intentionally does not seed or modify staff credentials. Local SQLite upgrades additively on first use. Runtime Turso requests check schema readiness rather than migrating it. Do not reset or reseed production to install this feature.

Database protections include unique `(campaign_id, student_hash)` redemptions, unique booking/voucher references, a campaign capacity check/counter trigger in the existing booking write transaction, a three-night/one-room guard, and the unchanged physical-room overlap constraints. Room allocation, voucher consumption, campaign redemption and booking/email-event creation commit together or roll back together. Class stay modifications must also remain three nights and one room.

Verification includes eight focused unit tests (visits, email-free/idempotent checkout, last-place concurrency, normalized duplicate students, room overlap/rollback/retry, paused/expired campaigns, private roster credentials, cancellation policy, and direct database protection). Browser tests cover the staff creation interface, two independent mobile guests using one link, no-email confirmation, staff visibility, roster privacy and shared-link state messages. A live Turso test also uses independent Node processes for campaign-capacity and duplicate-student races; each race saved exactly one reservation. No real emails were sent by these tests.

Two synthetic reservations, four internal participant vouchers and two paused verification campaigns were retained by that live shared-invitation test. Their guest name is **Turso Verification Guest** and their email is blank. No existing guest reservations were changed or deleted. Cancel synthetic bookings individually through staff if their dates are needed.

The project continues to build into the standard `.next` directory. Pushing to the connected `ux-rebuild` branch can start Vercel's normal Git deployment; no manual deployment or external service was created by this implementation.

Final checks passed: lint, TypeScript, production build, 33 unit tests and all 67 browser tests in one complete run. The focused live Turso test passed both independent-process shared-campaign races. Secret scanning found no configured credential values in changed source/documentation, and the standard `.next` build traces include no private environment or data files.
