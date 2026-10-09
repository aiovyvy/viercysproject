# VIERCYS Demo Runbook

This runbook targets a 3–5 minute classroom or live demo of the fictional VIERCYS Santorini booking flow. It is intentionally paced for a phone-sized browser and avoids relying on real payment or external email delivery.

## 1) Prepare the local demo

```powershell
cd "C:\Users\Kenjo Condez\Downloads\viercys-hotel"
npm install
npm run seed
npm run dev
```

Open the app at http://localhost:3000.

Notes:
- Use the local SQLite database in `data/viercys.sqlite`.
- The app shows a demo label and simulated payment flow throughout.
- Seed data includes exactly 20 rooms and a working admin password in `data/demo-staff.json` when generated.

## 2) Generate a guest invitation

From the admin dashboard at `/admin`:
- Sign in with the generated manager password or `VIERCYS_ADMIN_PASSWORD` if configured.
- Open the invite manager and create a fresh demo voucher.
- Copy the public invite link. If you need a simple screen-share flow, open the invite URL directly in the browser.

Recommended demo invitation copy:
- “You’re invited to VIERCYS.”
- “Your three-night Santorini escape awaits.”
- “Complimentary three-night room stay. Extra nights and upgrades are optional and shown before confirmation.”

## 3) Quick classroom flow

1. Open the invite link.
2. Click “Claim your stay”.
3. Review the onboarding tutorial if it appears, then continue.
4. Select three nights in Santorini with two adults.
5. Choose a suitable room tier and confirm the displayed voucher logic.
6. Fill in a test guest name and email.
7. Click “Confirm demo reservation”.
8. Verify the confirmation page displays the reference, dates, room, voucher savings, and remaining simulated balance.
9. Open “My Stay” using the confirmation link or staff guest lookup.
10. In the admin dashboard, confirm that the reservation appears and inventory is reduced accordingly.

## 4) Reset between demos

```powershell
cd "C:\Users\Kenjo Condez\Downloads\viercys-hotel"
Remove-Item -Recurse -Force data\viercys.sqlite
npm run seed
```

This recreates the seeded room catalog and clears demo booking data. Use only for a clean classroom reset.

## 5) Fallback when internet or email is unavailable

If outbound email or external services are unavailable:
- Continue with the on-screen confirmation flow.
- Use the embedded “Manage Booking” and “My Stay” links.
- Show the preview email instead of claiming a real sent email.
- Set the visible status text to “Email not configured for demo” when credentials are absent.
- Keep the reservation live in the SQLite database so the staff view still works.

## 6) Admin verification

Open `/admin` and confirm:
- reservation count
- guest name and email
- room assignment and stay dates
- voucher status and room inventory
- email status label is not falsely marked as sent unless a real provider accepted it

## 7) Troubleshooting

- If the booking page is blank, restart the Next server and confirm there is no stale dev process.
- If no rooms appear, re-run `npm run seed` and ensure the property date range is valid for the selected dates.
- If the admin page asks for a password, check `data/demo-staff.json` or `VIERCYS_ADMIN_PASSWORD`.
- If the browser is slow, keep the demo to a small viewport and avoid opening multiple heavy tabs.

## 8) Suggested talk track

- “This is a fictional premium Mediterranean resort with a real demo booking workflow, not a real hotel or real payment flow.”
- “The voucher covers up to three complimentary room nights; extras and upgrades are shown before confirmation.”
- “Inventory checks use real room and date validation, with protected admin access and guest retrieval.”

This runbook is intentionally reliable for a classroom environment and does not rely on real airlines, travel services, or external payment providers.
