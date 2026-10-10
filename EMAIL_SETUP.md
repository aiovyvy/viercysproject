# VIERCYS confirmation email setup

The existing Next.js booking endpoint saves a validated reservation and its unique confirmation event before processing email. Resend is called only on the server. No additional email endpoint, paid service, card collection or public deployment is required by these code changes.

**Real delivery has not been verified.** This workspace has no `.env.local`, Resend API key, sender or webhook secret configured. Local tests use preview mode and a mocked provider; those tests do not demonstrate delivery to an inbox.

## Configure your existing Resend account

1. Add a domain you own in Resend and publish the SPF/DKIM records shown by its dashboard. Wait until Resend marks the domain verified. Do not use a Gmail/Outlook address as an owned sending domain. See [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction).
2. Create a server-side sending API key scoped to that domain where supported. Keep it private; never use a `NEXT_PUBLIC_` variable or commit it.
3. Copy `.env.example` to `.env.local` if needed, preserving your existing settings, and set:

```dotenv
RESEND_API_KEY=your_private_resend_key
RESEND_FROM="VIERCYS <reservations@mail.your-own-domain.example>"
RESEND_TEST_RECIPIENT=
APP_URL=http://localhost:3000
```

Replace the example sender with an address under your verified domain. Leave `RESEND_TEST_RECIPIENT` empty to deliver to the address entered during booking. Setting it redirects mail to a controlled test inbox; it must not be set when verifying guest-address delivery. Use the actual address of the running application for `APP_URL`: localhost links/images only work on that same computer. For phones on your LAN, use the laptop's reachable LAN URL. No public hosting is set up by this task.

Restart the Next.js server after changing environment variables. Missing either the API key or sender retains honest preview-only status and sends nothing.

## Test actual delivery

1. Run the application (`npm.cmd run dev`, or build then start).
2. Complete a fresh booking using an inbox you control and the classroom acknowledgement. No payment card information is requested.
3. Check that the reservation is saved and its confirmation page displays the correct reference, name, room, dates and guests.
4. Check the email status. **Provider accepted** means Resend accepted the message, not that it arrived in the inbox. Inspect the Resend delivery log and the inbox/spam folder, then verify the matching reference and classroom disclosure in the received message.
5. A failed email leaves the reservation confirmed. Use **Try sending again** on its confirmation page after correcting the configuration. Previously saved preview emails can also be retried after configuration. Do not make another reservation merely to retry its email.
6. Confirming twice uses the existing booking idempotency key and unique event, and concurrent delivery claims submit that event once. Accepted events are not submitted again. Failed sends reuse the same event key and persisted HTML.

Resend's provider idempotency window is [24 hours](https://resend.com/changelog/idempotency-keys). For an ambiguous timeout older than that window, check the provider log before retrying: no distributed email API can promise permanent exactly-once delivery solely from that key. VIERCYS permanently suppresses events with recorded provider acceptance.

## Optional delivery status webhooks

Once you have an authorized publicly reachable HTTPS endpoint, configure Resend webhooks at `/api/email-webhook` and set the corresponding `RESEND_WEBHOOK_SECRET` on the server. Subscribe to `email.sent`, `email.delivered`, `email.bounced`, `email.failed` and `email.delivery_delayed`. The existing endpoint verifies Svix signatures and deduplicates webhook events. Localhost cannot receive provider webhooks. This task does not open a tunnel or deploy the app. See [Resend webhook documentation](https://resend.com/docs/webhooks/introduction).

Until a webhook arrives, the app reports provider acceptance rather than claiming delivery. Reload the confirmation page to refresh a later webhook status.

## Local safeguards and verification

Only a successfully validated, saved booking can generate this transactional confirmation. Guest retries require access to that specific booking, keep its saved recipient and content, and cannot accept arbitrary message content or target addresses. Same-origin mutation checks are preserved. Provider traffic, including failures/retries, is capped at ten attempts per destination address and 200 across the application in a 15-minute window. Limits leave the booking saved and mark the email unsuccessful; wait before retrying. These limits do not replace provider quotas or email ownership verification; the classroom app is not being certified for unrestricted public use.

Tests cover preview fallback, escaped guest content, the branded template and simulation disclosure, recipient selection, concurrent duplicate submissions, provider rejection/retry with stable HTML and key, bounded retries, persisted bookings after failure, authenticated retry access, and signed webhook verification. Real inbox delivery remains the configuration and manual verification step above.
