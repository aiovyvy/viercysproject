# VIERCYS persistent database and deployment guide

## Readiness and scope

The existing project now uses the configured Turso database when both server credentials are present. It retains SQLite for local-only development. Vercel refuses a local database fallback: no reservation depends on a writable serverless filesystem. No deployment, push, new database, paid service or domain purchase was performed.

The existing Turso database was initialized additively: **20 rooms (10 Essential, 6 Signature, 4 Grand)** and a password-protected `manager` account. Runtime requests do not migrate or seed the remote database. Your previous local SQLite records remain in `data/viercys.sqlite`; they were **not uploaded or merged**. A transfer of historical guest records would require a separately reviewed migration.

Seven synthetic verification reservations and two verification invitations remain in Turso. They were intentionally retained instead of deleting records. Verification guests use `turso-verification@example.test`; no mail was sent by these tests. Staff may cancel their confirmed reservations individually if their dates are needed.

## Persistence and concurrency

The same SQL schema and business rules serve both database engines. Persistent tables cover room categories, rooms, extras, guests, bookings, booked rooms, payment records, invitation tokens, itineraries, staff, sessions, lookup tokens, email attempts/webhook deduplication, operational blocks and rate limits. Availability remains derived from bookings and operational blocks, with existing overlap triggers preserved. No payment card collection was added.

All database consumers now await the shared adapter. Write transactions acquire the database write lock before checking availability and consuming a voucher. A failed operation rolls back as a unit; transactions are not blindly replayed. Booking idempotency, invitation hashes, staff password hashing, session access controls and email event uniqueness remain in place. Login failure counters use atomic updates. Webhook deduplication and its status update commit together.

Remote storage uses the HTTP-compatible `@libsql/client/web` client without a local replica. See [Turso TypeScript reference](https://docs.turso.tech/sdk/ts/reference). Serverless local files are unsuitable for persistent reservations; see [Vercel runtimes](https://vercel.com/docs/functions/runtimes).

## Environment and initialization

Keep secrets in ignored `.env.local` locally and server-side Vercel environment settings later. Never use `NEXT_PUBLIC_` for credentials.

| Variable | Value or purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://viercys-kenteu.aws-ap-northeast-1.turso.io` |
| `TURSO_AUTH_TOKEN` | Your existing private database token |
| `VIERCYS_ADMIN_PASSWORD` | Your configured unique password, at least 16 characters |
| `APP_URL` | `http://localhost:3000` locally; the exact canonical HTTPS Vercel URL after deployment |
| `RESEND_API_KEY` | Existing private key; optional when email should remain unavailable |
| `RESEND_FROM` | `VIERCYS <onboarding@resend.dev>` for restricted account testing |
| `RESEND_SANDBOX_RECIPIENT` | Your exact Resend account email while using onboarding sender |
| `RESEND_WEBHOOK_SECRET` | Optional, only after configuring signed Resend webhooks |

Leave `RESEND_TEST_RECIPIENT` empty. Do not configure `VIERCYS_DEMO_MODE`, `VIERCYS_DB_PATH` or development outbox settings on Vercel. Remote storage disables demo shortcuts even during development. No default staff password works remotely.

Use Node 24 (the project supports Node >=22.13 and <25):

```powershell
npm.cmd ci
npm.cmd run db:init
npm.cmd run db:check
npm.cmd run dev
```

Initialization already succeeded for your database. `db:init` can be rerun: schema and catalog additions are transactional, existing rows are preserved, inventory is checked, and no default account is created. A changed admin password updates the manager hash and invalidates that manager's sessions. `db:check` is read-only and prints aggregate readiness information, not credentials or guest details. Do not use `reset` against a remote database; the script refuses it.

To return to the original local SQLite data, clear **both** Turso variables and restart. Do not delete the SQLite file or run reset to switch engines.

## Try localhost

1. Open `http://localhost:3000/book`, choose available dates and a room, complete the guest details and classroom acknowledgement, then confirm. The polished confirmation and reference work even when email is unavailable.
2. For real email testing, use only your Resend account address with the onboarding sender. Other classmates can reserve normally but cannot receive onboarding-sender mail. Provider acceptance and inbox receipt are separate statuses.
3. Open `/admin`, sign in as `manager` with the password you placed in `.env.local`, and inspect the saved reservation and inventory. Create individual invitation links through the existing staff flow and share them yourself by Messenger or QR code.
4. Use **Review confirmation email** to explicitly review and send one saved confirmation. Missing configuration leaves the booking valid; accepted events cannot be submitted again. Adding a domain never sends a backlog automatically.

The account owner confirmed receipt of the earlier real branded confirmation. Migration tests deliberately disabled email. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for verified-domain setup, safe retries and optional webhooks. A verified sending domain is required to email classmates; no testing restriction is bypassed.

## Verified checks

- Production build, lint and TypeScript passed.
- 25 unit tests passed, covering storage initialization, transaction rollback, booking rules and email safeguards.
- All 64 browser tests passed in one complete run, including invitations, vouchers, staff, accessibility, mobile, scroll effects and email fallback.
- Three opt-in live Turso tests passed: guest booking/duplicate confirmation/staff persistence; room and voucher contention; separate Node processes competing for one room. Exactly one competing reservation won.
- Foreign-key validation passed and manager credentials were checked without logging them.
- Runtime dependency audit: zero vulnerabilities. Full development audit retains five high advisories in the ESLint glob dependency chain (`braces`); no forced framework downgrade was applied. Recheck upstream fixes before expanding beyond classroom use.

Run ordinary regression checks with `npm.cmd run test:unit`, `npm.cmd run build`, and `npm.cmd run test:e2e`. The normal browser suite explicitly clears Turso credentials and uses an isolated local database. `npm.cmd run test:turso` is opt-in: it writes synthetic reservations and invitations to the configured remote database, disables email, and retains those records. Avoid repeatedly running it against an active class dataset. Live tests do not retain password-bearing browser traces.

## GitHub steps — for you to execute when ready

Current branch: `ux-rebuild`. Existing `origin` points to `aiovyvy/Viercys`; it was not changed. To use your requested `aiovyvy/viercysproject` repository, first ensure it exists and inspect its history:

```powershell
git status --short
git remote add publish https://github.com/aiovyvy/viercysproject.git
git ls-remote --heads publish
git push publish ux-rebuild
```

If `publish` already exists, inspect it rather than adding it again. If the remote has divergent history, stop and review; do not force push. Choose repository visibility yourself. Secrets, local databases, logs and private outboxes are ignored and excluded from server tracing. Unrelated local design references and room images were left untouched and are not required by current source references.

## Vercel Hobby preparation — no deployment performed

1. In your existing Vercel account, import the intended GitHub repository only when you are ready to publish. Import can immediately create a production deployment.
2. Select the repository root, Next.js preset, Node 24 and `npm run build`. Leave Output Directory at its framework default: the project now generates the standard `.next` directory. Select `ux-rebuild` as the production branch if that is the branch you intend to publish.
3. Add the server variables from the table to **Production**, including the existing Turso token and the same initialized manager password. Set `APP_URL` to the exact assigned `https://…vercel.app` address. If that address becomes known only after import, update the variable and redeploy before testing booking links. The production API fails closed without a valid HTTPS canonical URL.
4. Do not give Preview deployments production database credentials by default: previews would write to the same real class database. Explicitly configure them only when you intend that behavior; otherwise their database-backed routes fail closed.
5. After publishing by your own explicit action, test one invitation, booking, confirmation, manager login, and email status. Verify records survive a redeployment. Optional Resend webhooks use `/api/email-webhook` and a private signing secret.

Vercel's free hostname is sufficient for the website. A custom sending domain is separately needed for unrestricted guest email. Hobby/Turso Free/Resend Free remain subject to their account eligibility and quotas; this work does not enable billing or purchase anything. See [Vercel Hobby](https://vercel.com/docs/plans/hobby) and [deployment environments](https://vercel.com/docs/deployments/environments). Environment changes require redeployment.

Remaining user setup: review and push the local commit when ready, import/configure Vercel, set the actual public `APP_URL`, and verify a sending domain if classmates need emails. The database and localhost flow are ready independently of those steps.

## Shared classroom invitations

Shared campaigns extend the original vouchers. See [SHARED_CLASS_INVITATIONS.md](SHARED_CLASS_INVITATIONS.md) for manager creation, one-time links, private roster codes and additive migration 2. The migration has already been applied to the existing Turso database; no reset or new service is needed.
