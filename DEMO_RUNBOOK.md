# VIERCYS Demo Runbook

A classroom demo of under 5 minutes. Classmates use their own phones to claim a fictional three-night VIERCYS Santorini stay, book it, and see it appear in the staff dashboard. Nothing is paid and no real travel is booked.

## 1. Before class (10 minutes, once)

Use a laptop and phones on the **same Wi-Fi network**. Phones reach the laptop by its IP address over plain `http`. This setup is verified to work, and automated tests cover it.

```powershell
cd "C:\Users\Kenjo Condez\Downloads\viercys-hotel"
npm install
ipconfig        # note the Wi-Fi "IPv4 Address", e.g. 192.168.1.10
```

Create `.env.local` (copy `.env.example`) and set at least:

```
VIERCYS_DEMO_MODE=true
APP_URL=http://192.168.1.10:3000
```

`APP_URL` is optional: without it, invite links use whatever address the presenter opened `/admin` from. If you open admin at `http://localhost:3000`, the links will say `localhost`, which phones cannot open. Either set `APP_URL` or open admin by the IP address.

Then build, reset and start:

```powershell
npm run build
npm run reset   # empty database: 20 rooms, no bookings, new staff password
npm run start   # serves on port 3000 on all network interfaces
```

The first time, Windows may ask whether Node.js can use the network. Allow it on **Private networks**. On a phone, open `http://192.168.1.10:3000`. If it does not load, see Troubleshooting.

## 2. Create invitation links (1 minute)

1. Open `http://<laptop-ip>:3000/admin` on the laptop.
2. Sign in as `manager`. The password is in `data/demo-staff.json`, or is `VIERCYS_ADMIN_PASSWORD` if you set one (12+ characters).
3. Open the **Invitations** tab. Enter the number of students (1–60), an optional label such as `HCI class`, and click **Create invitation links**.
4. Click **Copy all links** and paste them into your class chat or LMS. Give **one link per student**: each voucher works for one booking.

Links are stored hashed and are shown **only once**. If you lose them, create new ones. To show a link as a QR code, paste it into a QR tool you trust; the app does not generate QR codes.

## 3. What a participant does (2–4 minutes, no instructions needed)

1. Open their link → "Your three-night Santorini escape awaits." → **Claim your stay**.
2. An optional three-step guide appears (Dates → Room → Confirm). **Next**, **Back** or **Skip guide**. It can be replayed with **Show booking guide**.
3. **Dates:** three nights are preselected a week from today. Change dates, tap **4/5/7 nights**, or adjust guests with −/+. → **See available rooms**.
4. **Room:** Essential shows "Fully covered by your voucher". Signature and Grand show the exact extra amount. → **Select [room]**.
5. **Review:** price breakdown with the voucher line. Enter name and email (fake ones are fine), tick the demo checkbox → **Confirm demo reservation**.
6. **Confirmation:** booking reference, voucher savings and balance. They can try **Extend stay** (shows the extra cost before saving) or **Change dates**.

## 4. Presenter verification (1 minute)

In `/admin` → **Reservations**, each new booking shows the guest, dates, room number and "Demo voucher". The **Invitations** tab shows each link as Unused, Expired or "Redeemed · VRC-…". If a student reopens their link, they see "This invitation has been used."

Suggested talk track: "VIERCYS is fictional and the payment is simulated. The voucher covers three Essential nights; anything extra is shown before you confirm. Rooms are real database inventory: 20 rooms, and two people cannot book the same room for the same night."

## 5. Reset between sessions

Stop the server (Ctrl+C) first. Windows locks the database while it runs.

```powershell
npm run reset
npm run start
```

This deletes all bookings and invitations, recreates the 20 rooms and, unless `VIERCYS_ADMIN_PASSWORD` is set, writes a **new** manager password to `data/demo-staff.json`. Generate new invitation links afterwards.

## 6. Fallbacks

- **Email:** with no `RESEND_API_KEY`, nothing is sent. The confirmation page says "Email is not configured for this demo, so nothing was sent" and links to the email that would have been sent. This is expected.
- **No shared Wi-Fi / phones can't connect:** run the demo on the laptop. Open an invite link in the browser and use DevTools device mode (Ctrl+Shift+M, iPhone) for a phone-sized view. Everything works on `localhost`.
- **A student books the wrong thing:** they can cancel online until two days before arrival. With the default dates (a week out), the voucher is released and their link works again.
- **"Choose another room" message:** someone else took the last room of that type for those dates. Pick another room or other dates.
- **Two students used the same link:** the second one sees "Your voucher couldn't be applied" and the standard price. Nothing is booked until they confirm again. Give them their own link.
- **A student opens their booking on another device:** they tap **Find my booking** and enter the booking reference (VRC-…) and their email. There is no "email me a link" shortcut unless email is configured; access links are never shown on screen.
- **Booking within two days of arrival:** online cancellation is not available (the checkout says so). You, as the front desk, can cancel it from `/admin` → the booking.
- **Someone mistypes the staff password repeatedly:** only that device is paused for 15 minutes; sign in from your own device as normal.

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Phone can't open `http://<ip>:3000` | Same Wi-Fi? Allow Node.js through Windows Firewall (Private). Some campus networks isolate devices; use the laptop fallback |
| Invite links say `localhost` | Set `APP_URL=http://<laptop-ip>:3000` in `.env.local` and restart the server, or open `/admin` by the IP address |
| Admin password rejected after a reset | Read `data/demo-staff.json` again; reset writes a new password |
| `npm run reset` fails with "resource busy" | Stop the server first |
| Voucher banner missing on `/book` | The link wasn't claimed in this browser, or it was already used. Reopen the student's own link |
| "Too many unsuccessful attempts from this device" | Wait 15 minutes or use another device; successful sign-ins and valid invitation links are never limited |

Never set `VIERCYS_DEV_OUTBOX` for a class: it is a test-only setting that writes access emails to a file on the laptop.
