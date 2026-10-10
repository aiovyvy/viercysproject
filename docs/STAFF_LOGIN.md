# How to sign in to the VIERCYS staff dashboard

The staff dashboard lives at **/admin**. It has one account, **`manager`**, which can see
reservations and their status, invitations (create and track them), the 20 rooms
(inventory, blocks, housekeeping), a 14-day calendar, guests and reports.

This guide never contains a password. Passwords stay on your computer or in your host's
private settings, never in Git, screenshots or the website.

---

## On your own computer (VS Code)

### Option A: use the password the app generated for you (quickest)

1. Open the project folder in **VS Code**.
2. Open a terminal: menu **Terminal → New Terminal**.
3. Start the site:
   ```
   npm run dev
   ```
   Wait until you see `Ready`.
4. In the VS Code file list, open **`data/demo-staff.json`**. It looks like this (your real
   password will be a random 24-character string):
   ```json
   { "username": "manager", "password": "…", "note": "Local demo only; keep private…" }
   ```
   This file is created automatically the first time the database is created. It is listed
   in `.gitignore`, so it is never committed. **Do not share it or paste it anywhere.**
5. In your browser go to **http://localhost:3000/admin** and sign in with username
   `manager` and the password from that file.

### Option B: choose your own password

1. In the project folder create a file named **`.env.local`** (copy `.env.example` if you
   like). `.env.local` is ignored by Git.
2. Add one line, using a password of **at least 12 characters** that you don't use anywhere
   else:
   ```
   VIERCYS_ADMIN_PASSWORD=choose-a-long-private-passphrase
   ```
3. Stop the server (click the terminal and press `Ctrl + C`) and start it again with
   `npm run dev`. The `manager` password is now the one you chose.

### If the password doesn't work

- Make sure you are using the newest `data/demo-staff.json` (it changes when the database is
  reset).
- To start completely fresh (this **deletes all bookings and invitations** in your local
  demo): stop the server, then run `npm run reset`. It prints where the new password was
  written.

*Verified on 2026-10-10:* signing in with the generated local credentials returned the
dashboard (reservations, rooms, blocks, payments, reports). Automated tests also sign in
with a test-only password and use invitations, inventory and booking status.

---

## On a public website (later, when it's hosted)

- **Never** rely on `demo-staff.json` online. Set the password as a private environment
  variable in your host's dashboard:
  - `VIERCYS_ADMIN_PASSWORD`: 12+ characters, private, not your personal password.
- Without that variable, a production build refuses staff sign-in ("Production staff access
  requires configured credentials"). This is intentional.
- Only share the password with people who should run the front desk during the
  presentation, and change it afterwards.
- Sign-in attempts are throttled, sessions are stored hashed, and cookies are HttpOnly and
  marked Secure automatically when the site is served over HTTPS.
