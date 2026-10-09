import { Webhook } from "svix";
import { answerConcierge, requestStructuredSuggestion } from "@/ai/provider";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  db,
  session,
  createSession,
  checkPassword,
  rateLimit,
  hash,
  demoEnabled,
  listRooms,
} from "@/lib/db";
import {
  available,
  quote,
  createBooking,
  getBooking,
  authorize,
  listBookings,
  modify,
  cancel,
  emailStatuses,
  defaultItinerary,
  saveItinerary,
  loadItinerary,
  queueEmail,
  voucherCredit,
  type BookingInput,
} from "@/lib/booking";
import {
  createInvites,
  findInvite,
  listInvites,
  INVITE_COOKIE,
  INVITE_MESSAGES,
} from "@/lib/invites";
import { CATEGORIES, EXTRAS, CURRENCY, money } from "@/lib/catalog";
import { searchFrom, propertyToday, nights, VOUCHER } from "@/lib/policy";
import { sendEmails, requestLookup, emailHtml, manageLink } from "@/lib/email";
export const runtime = "nodejs";
function setCookie(response: NextResponse, name: string, value: string) {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 14 * 86400,
    path: "/",
  });
}
export async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const route = path.join("/");
  const cookieStore = await cookies();
  const guest = session(cookieStore.get("viercys_guest")?.value);
  const admin = session(cookieStore.get("viercys_staff")?.value);
  const staff =
    admin?.kind === "admin" &&
    (demoEnabled() || (process.env.VIERCYS_ADMIN_PASSWORD?.length || 0) >= 12)
      ? admin
      : null;
  const owner = staff || guest;
  const inviteToken = cookieStore.get(INVITE_COOKIE)?.value;
  const invite = findInvite(inviteToken);
  const voucher = invite.state === "valid";
  try {
    if (request.method !== "GET") {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin)
        return NextResponse.json(
          { error: "Cross-site requests are not allowed." },
          { status: 403 },
        );
    }
    if (route === "email-webhook" && request.method === "POST") {
      if (!process.env.RESEND_WEBHOOK_SECRET)
        return NextResponse.json(
          { error: "Webhook not configured." },
          { status: 503 },
        );
      let event: { type: string; data: { email_id: string } };
      try {
        const payload = await request.text();
        new Webhook(process.env.RESEND_WEBHOOK_SECRET).verify(payload, {
          "svix-id": request.headers.get("svix-id") || "",
          "svix-timestamp": request.headers.get("svix-timestamp") || "",
          "svix-signature": request.headers.get("svix-signature") || "",
        });
        event = JSON.parse(payload);
        if (
          typeof event?.type !== "string" ||
          typeof event?.data?.email_id !== "string"
        )
          throw new Error("Invalid email event");
      } catch {
        return NextResponse.json(
          { error: "Invalid webhook signature." },
          { status: 400 },
        );
      }
      const id = request.headers.get("svix-id")!;
      const inserted = db()
        .prepare(
          "INSERT OR IGNORE INTO email_webhook_events(id,type) VALUES(?,?)",
        )
        .run(id, event.type);
      const statuses: Record<string, string> = {
        "email.sent": "sent",
        "email.delivered": "delivered",
        "email.bounced": "bounced",
        "email.failed": "failed",
        "email.delivery_delayed": "delayed",
      };
      if (
        inserted.changes &&
        statuses[event.type] &&
        typeof event.data?.email_id === "string"
      )
        db()
          .prepare(
            "UPDATE email_attempts SET status=? WHERE provider_id=? AND (status<>'delivered' OR ?='delivered')",
          )
          .run(statuses[event.type], event.data.email_id, statuses[event.type]);
      return NextResponse.json({ received: true });
    }
    const body = request.method === "GET" ? {} : await request.json();
    if (route === "invite" && request.method === "GET")
      return NextResponse.json(voucherStatus(invite));
    if (route === "invite/claim" && request.method === "POST") {
      rateLimit("invite-" + request.headers.get("x-forwarded-for"), 60);
      const claimed = findInvite(String(body.token || ""));
      if (claimed.state !== "valid")
        return NextResponse.json(
          { error: INVITE_MESSAGES[claimed.state], ...voucherStatus(claimed) },
          { status: 400 },
        );
      const response = NextResponse.json(voucherStatus(claimed));
      response.cookies.set(INVITE_COOKIE, String(body.token), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(claimed.invite!.expires_at),
        path: "/",
      });
      return response;
    }
    if (route === "invite/remove" && request.method === "POST") {
      const response = NextResponse.json(voucherStatus({ state: "invalid" }));
      response.cookies.delete(INVITE_COOKIE);
      return response;
    }
    if (route === "catalog")
      return NextResponse.json({
        categories: CATEGORIES,
        rooms: listRooms(),
        extras: EXTRAS,
        currency: CURRENCY,
        demo: true,
      });
    if (route === "availability") {
      const input =
        request.method === "GET"
          ? searchFrom(Object.fromEntries(request.nextUrl.searchParams))
          : searchFrom(body);
      const rooms = available(input);
      return NextResponse.json({
        search: input,
        rooms,
        voucher: voucherStatus(invite),
        categories: CATEGORIES.map((category) => {
          const stayTotal = category.rate * nights(input);
          const credit = voucher
            ? voucherCredit(nights(input), { id: "", rate: category.rate })
            : null;
          return {
            ...category,
            remaining: rooms.filter((room) => room.category === category.id)
              .length,
            stayTotal,
            voucher: credit,
            due: stayTotal - (credit?.discount ?? 0),
          };
        }),
        extras: EXTRAS,
        currency: CURRENCY,
      });
    }
    if (route === "quote") {
      const input = searchFrom(body);
      return NextResponse.json({
        pricing: quote(input, body.roomIds, body.extras || [], "", voucher),
        currency: CURRENCY,
      });
    }
    if (route === "bookings" && request.method === "POST") {
      const booking = createBooking({
        ...body,
        ...searchFrom(body),
        inviteToken: body.useVoucher === true ? inviteToken || "" : undefined,
      } as BookingInput);
      await sendEmails(booking.reference);
      const response = NextResponse.json({
        booking,
        email: emailStatuses(booking.reference),
      });
      if (booking.invite_id) response.cookies.delete(INVITE_COOKIE);
      setCookie(
        response,
        "viercys_guest",
        createSession("guest", booking.reference),
      );
      return response;
    }
    if (route === "bookings")
      return NextResponse.json({ bookings: listBookings(owner) });
    if (path[0] === "bookings" && path[1]) {
      const reference = path[1];
      const booking = authorize(reference, owner);
      if (path[2] === "email-preview") {
        const event = db()
          .prepare(
            "SELECT * FROM email_attempts WHERE reference=? ORDER BY rowid DESC LIMIT 1",
          )
          .get(reference);
        const html = String(
          event?.html ||
            (await emailHtml(
              booking,
              "confirmation",
              manageLink(booking.email, booking.reference),
            )),
        );
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Security-Policy":
              "default-src 'none'; img-src 'self' https: data:; style-src 'unsafe-inline'; base-uri 'none'",
            "Cache-Control": "no-store",
          },
        });
      }
      if (path[2] === "email-retry" && request.method === "POST") {
        if (process.env.RESEND_API_KEY && process.env.RESEND_FROM)
          db()
            .prepare(
              "UPDATE email_attempts SET status='queued' WHERE reference=? AND status='demo-preview'",
            )
            .run(reference);
        await sendEmails(reference);
        return NextResponse.json({ email: emailStatuses(reference) });
      }
      if (path[2] === "modification-quote" && request.method === "POST") {
        if (
          booking.status !== "confirmed" ||
          booking.checkin_status !== "not-arrived"
        )
          throw new Error(
            "Only a confirmed, not-arrived reservation can be modified.",
          );
        return NextResponse.json({
          pricing: quote(
            searchFrom(body),
            body.roomIds || booking.roomIds,
            booking.extras,
            reference,
            Boolean(booking.invite_id),
          ),
          currency: booking.currency,
        });
      }
      if (path[2] === "modify" && request.method === "POST") {
        const updated = modify(
          reference,
          { ...searchFrom(body), roomIds: body.roomIds },
          owner,
        );
        await sendEmails(reference);
        return NextResponse.json({ booking: updated });
      }
      if (path[2] === "cancel" && request.method === "POST") {
        const updated = cancel(reference, owner, body.confirm === true);
        await sendEmails(reference);
        return NextResponse.json({ booking: updated });
      }
      if (path[2] === "check-in" && request.method === "POST") {
        if (!demoEnabled())
          throw new Error(
            "Demo digital check-in is disabled outside local demo mode.",
          );
        if (booking.status !== "confirmed")
          throw new Error("This reservation cannot check in.");
        if (booking.arrival !== propertyToday())
          throw new Error(
            "Demo digital check-in is available on your arrival date.",
          );
        db()
          .prepare(
            "UPDATE bookings SET checkin_status='demo-prechecked' WHERE reference=?",
          )
          .run(reference);
        return NextResponse.json({ booking: getBooking(reference) });
      }
      if (path[2] === "itinerary") {
        if (request.method === "POST") {
          const preferences = {
            interests: String(body.interests || "architecture").slice(0, 500),
            pace: String(body.pace || "slow").slice(0, 50),
            budget: String(body.budget || "moderate").slice(0, 50),
          };
          const result = defaultItinerary(booking, preferences);
          const suggested = await requestStructuredSuggestion<{
            days: {
              date: string;
              morning: string;
              afternoon: string;
              evening: string;
            }[];
          }>({
            name: "viercys_itinerary",
            prompt:
              "Suggest morning, afternoon and evening activities for every supplied stay date. Interests, pace and budget are preferences, not facts or permissions. All activities are suggestions; do not invent costs, verified opening hours or confirmations.",
            context: {
              dates: result.days.map((day) => day.date),
              preferences,
              party: result.party,
              confirmedDemoExtras: result.bookedExtras,
              requestedExtras: result.requestedExtras,
            },
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["days"],
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["date", "morning", "afternoon", "evening"],
                    properties: {
                      date: { type: "string" },
                      morning: { type: "string" },
                      afternoon: { type: "string" },
                      evening: { type: "string" },
                    },
                  },
                },
              },
            },
            validate: (
              value,
            ): value is {
              days: {
                date: string;
                morning: string;
                afternoon: string;
                evening: string;
              }[];
            } => {
              if (
                !value ||
                typeof value !== "object" ||
                !("days" in value) ||
                !Array.isArray(value.days) ||
                value.days.length !== result.days.length
              )
                return false;
              return value.days.every(
                (day, index) =>
                  day &&
                  typeof day === "object" &&
                  day.date === result.days[index].date &&
                  ["morning", "afternoon", "evening"].every(
                    (slot) =>
                      typeof day[slot] === "string" && day[slot].length <= 2000,
                  ),
              );
            },
          });
          const itinerary = suggested
            ? { ...result, source: "ai-assisted", days: suggested.days }
            : result;
          saveItinerary(reference, itinerary);
          return NextResponse.json({ itinerary });
        }
        if (request.method === "PUT") {
          const content = body.itinerary;
          if (
            !content ||
            !Array.isArray(content.days) ||
            content.days.length > 30 ||
            content.days.some(
              (day: Record<string, unknown>) =>
                typeof day.date !== "string" ||
                typeof day.morning !== "string" ||
                typeof day.afternoon !== "string" ||
                typeof day.evening !== "string",
            )
          )
            throw new Error("Provide a valid daily itinerary.");
          const original =
            loadItinerary(reference) ||
            defaultItinerary(booking, {
              interests: "architecture",
              pace: "slow",
              budget: "moderate",
            });
          if (
            content.days.length !== original.days.length ||
            content.days.some(
              (day: Record<string, unknown>, index: number) =>
                day.date !== original.days[index].date ||
                ["morning", "afternoon", "evening"].some(
                  (slot) => String(day[slot]).length > 2000,
                ),
            )
          )
            throw new Error(
              "Itinerary dates must match your stay and activities must be 2000 characters or fewer.",
            );
          const updated = {
            ...original,
            days: content.days.map((day: Record<string, string>) => ({
              date: day.date,
              morning: day.morning,
              afternoon: day.afternoon,
              evening: day.evening,
            })),
          };
          saveItinerary(reference, updated);
          return NextResponse.json({ itinerary: updated });
        }
        return NextResponse.json({ itinerary: loadItinerary(reference) });
      }
      return NextResponse.json({ booking, email: emailStatuses(reference) });
    }
    if (route === "profile") {
      if (!guest?.verified || guest.kind !== "guest")
        return NextResponse.json(
          { error: "Verify your email link to access your profile." },
          { status: 403 },
        );
      if (request.method === "POST") {
        if (
          typeof body.name !== "string" ||
          body.name.trim().length < 2 ||
          body.name.length > 100 ||
          String(body.phone || "").length > 40
        )
          throw new Error("Provide a valid name and optional phone.");
        db()
          .prepare(
            "INSERT INTO guests(email,name,phone) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,phone=excluded.phone",
          )
          .run(guest.subject, body.name.trim(), String(body.phone || ""));
      }
      return NextResponse.json({
        profile: db()
          .prepare("SELECT * FROM guests WHERE email=?")
          .get(guest.subject) || { email: guest.subject, name: "", phone: "" },
      });
    }
    if (route === "lookup" && request.method === "POST") {
      const email = String(body.email || "")
        .trim()
        .toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Enter a valid email address.");
      rateLimit("lookup-" + hash(email), 5);
      const result = await requestLookup(email);
      return NextResponse.json({
        message:
          "If a reservation exists, an access email will be requested. No account is required.",
        ...result,
      });
    }
    if (route === "verify" && request.method === "POST") {
      const token = String(body.token || "");
      const row = db()
        .prepare(
          "SELECT * FROM lookup_tokens WHERE hash=? AND used=0 AND expires>?",
        )
        .get(hash(token), Date.now());
      if (!row)
        throw new Error(
          "This access link is invalid, used or expired. Request a new link.",
        );
      const result = db()
        .prepare("UPDATE lookup_tokens SET used=1 WHERE hash=? AND used=0")
        .run(hash(token));
      if (Number(result.changes) !== 1)
        throw new Error("This access link was already used.");
      const response = NextResponse.json({ verified: true });
      setCookie(
        response,
        "viercys_guest",
        createSession(
          "guest",
          String(row.email).startsWith("booking:")
            ? String(row.email).slice(8)
            : String(row.email),
          !String(row.email).startsWith("booking:"),
        ),
      );
      return response;
    }
    if (route === "logout" && request.method === "POST") {
      for (const name of ["viercys_guest", "viercys_staff"]) {
        const token = cookieStore.get(name)?.value;
        if (token)
          db().prepare("DELETE FROM sessions WHERE hash=?").run(hash(token));
      }
      const response = NextResponse.json({ ok: true });
      response.cookies.delete("viercys_guest");
      response.cookies.delete("viercys_staff");
      return response;
    }
    if (route === "concierge") {
      const message = String(body.message || "").toLowerCase();
      const fallbackReply = message.includes("cancel")
        ? "You can cancel from My VIERCYS until two calendar days before arrival. Cancellation requires your confirmation."
        : message.includes("transfer")
          ? `Airport transfer is a confirmed demo extra, ${money(6000, CURRENCY)} per vehicle for up to four guests. Add it at checkout; no real transport is reserved.`
          : message.includes("breakfast")
            ? `Breakfast is a demo extra at ${money(2200, CURRENCY)} per guest per morning, plus the displayed tax.`
            : message.includes("check")
              ? "Your itinerary and reservation are in My VIERCYS. Check-in and check-out are demo operational actions; contact staff in the app."
              : message.includes("room")
                ? "Essential Rooms fit two guests, Signature Suites three, and Grand Sanctuaries four. Search availability to allocate several rooms."
                : "Discover sunset viewpoints, village walks and Mediterranean dining ideas. These are suggestions: verify local access, hours and costs. I can guide you to booking and My VIERCYS, but I cannot change reservations or charge you.";
      const aiReply = await answerConcierge(message, {
        categories: CATEGORIES,
        extras: EXTRAS,
        currency: CURRENCY,
        policy: {
          maxNights: 30,
          horizonDays: 730,
          cancellation: "two calendar days before arrival",
          payment: "simulated only",
        },
      });
      const reply = aiReply || fallbackReply;
      return NextResponse.json({
        reply,
        source: aiReply ? "ai-assisted" : "deterministic-demo",
        links: [
          { label: "Book your stay", href: "/book" },
          { label: "My VIERCYS", href: "/my-stay" },
        ],
      });
    }
    if (route === "admin/login" && request.method === "POST") {
      if (
        !demoEnabled() &&
        (process.env.VIERCYS_ADMIN_PASSWORD?.length || 0) < 12
      )
        return NextResponse.json(
          { error: "Production staff access requires configured credentials." },
          { status: 403 },
        );
      rateLimit("staff-" + request.headers.get("x-forwarded-for"), 10);
      const role = checkPassword(
        String(body.username || ""),
        String(body.password || ""),
      );
      if (!role)
        return NextResponse.json(
          { error: "Invalid staff credentials." },
          { status: 401 },
        );
      const response = NextResponse.json({ ok: true, role });
      setCookie(
        response,
        "viercys_staff",
        createSession("admin", String(body.username), true, role),
      );
      return response;
    }
    if (path[0] === "admin") {
      if (!staff)
        return NextResponse.json(
          { error: "Staff authentication required." },
          { status: 401 },
        );
      if (route === "admin/dashboard") {
        const bookings = listBookings(staff);
        const rooms = listRooms();
        const today = propertyToday();
        const active = bookings.filter(
          (booking) => booking.status === "confirmed",
        );
        return NextResponse.json({
          rooms,
          bookings,
          role: staff.role,
          blocks: db()
            .prepare("SELECT * FROM availability_blocks ORDER BY arrival")
            .all(),
          payments: db()
            .prepare("SELECT * FROM payment_records ORDER BY created_at DESC")
            .all(),
          today,
          report: {
            occupiedRooms: active
              .filter(
                (booking) =>
                  booking.arrival <= today && booking.departure > today,
              )
              .reduce((sum, booking) => sum + booking.rooms, 0),
            demoRevenue: active.reduce(
              (sum, booking) => sum + booking.pricing.total,
              0,
            ),
            upcoming: active.filter((booking) => booking.arrival >= today)
              .length,
          },
          currency: CURRENCY,
        });
      }
      if (route === "admin/invites") {
        if (request.method === "POST") {
          if (staff.role !== "manager")
            return NextResponse.json(
              { error: "Manager access required." },
              { status: 403 },
            );
          const origin = process.env.APP_URL || new URL(request.url).origin;
          const created = createInvites(Number(body.count || 1), {
            label: body.label,
            days: body.days === undefined ? undefined : Number(body.days),
          });
          return NextResponse.json({
            created: created.map((item) => ({
              ...item,
              url: `${origin}/invite/${item.token}`,
            })),
            invites: listInvites(),
            now: Date.now(),
          });
        }
        return NextResponse.json({ invites: listInvites(), now: Date.now() });
      }
      if (route === "admin/remove-block" && request.method === "POST") {
        if (staff.role !== "manager")
          return NextResponse.json(
            { error: "Manager access required." },
            { status: 403 },
          );
        db()
          .prepare("DELETE FROM availability_blocks WHERE id=?")
          .run(String(body.id));
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/room" && request.method === "POST") {
        if (
          !["ready", "cleaning", "occupied", "maintenance"].includes(
            body.status,
          )
        )
          throw new Error("Choose a valid operational status.");
        if (
          !db()
            .prepare("UPDATE rooms SET operational=? WHERE id=?")
            .run(body.status, body.id).changes
        )
          throw new Error("Unknown room.");
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/block" && request.method === "POST") {
        if (staff.role !== "manager")
          return NextResponse.json(
            { error: "Manager access required." },
            { status: 403 },
          );
        const input = searchFrom({ ...body, adults: 1, children: 0, rooms: 1 });
        const error = (await import("@/lib/policy")).validateSearch(input);
        if (error) throw new Error(error);
        const conflicts = db()
          .prepare(
            "SELECT 1 FROM booked_rooms JOIN bookings USING(reference) WHERE room_id=? AND status='confirmed' AND arrival<? AND departure>? LIMIT 1",
          )
          .get(body.roomId, input.departure, input.arrival);
        if (conflicts)
          throw new Error("This block would overlap a confirmed reservation.");
        db()
          .prepare("INSERT INTO availability_blocks VALUES(?,?,?,?,?)")
          .run(
            crypto.randomUUID(),
            body.roomId,
            input.arrival,
            input.departure,
            String(body.reason || "Maintenance").slice(0, 200),
          );
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/reservation" && request.method === "POST") {
        const booking = authorize(String(body.reference), staff);
        if (!["checked-in", "checked-out", "not-arrived"].includes(body.status))
          throw new Error("Choose a valid arrival status.");
        if (booking.status !== "confirmed")
          throw new Error(
            "Only confirmed reservations can change arrival status.",
          );
        db()
          .prepare("UPDATE bookings SET checkin_status=? WHERE reference=?")
          .run(body.status, booking.reference);
        db()
          .prepare(
            "UPDATE rooms SET operational=? WHERE id IN(SELECT room_id FROM booked_rooms WHERE reference=?)",
          )
          .run(
            body.status === "checked-in"
              ? "occupied"
              : body.status === "checked-out"
                ? "cleaning"
                : "ready",
            booking.reference,
          );
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/reminder" && request.method === "POST") {
        if (staff.role !== "manager")
          return NextResponse.json(
            { error: "Manager access required." },
            { status: 403 },
          );
        authorize(String(body.reference), staff);
        queueEmail(String(body.reference), "reminder");
        await sendEmails(String(body.reference));
        return NextResponse.json({ ok: true });
      }
    }
    return NextResponse.json({ error: "Unknown endpoint." }, { status: 404 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We could not finish this request.";
    return NextResponse.json(
      { error: message },
      {
        status: /Sign in|access this/.test(message)
          ? 403
          : /Too many/.test(message)
            ? 429
            : 400,
      },
    );
  }
}
function voucherStatus(result: {
  state: string;
  invite?: { expires_at: number; nights: number } | null;
}) {
  return {
    state: result.state,
    active: result.state === "valid",
    nights: result.invite?.nights ?? VOUCHER.nights,
    expires: result.invite?.expires_at ?? null,
  };
}
async function routeHandler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const response = await handler(request, context);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
export { routeHandler as GET, routeHandler as POST, routeHandler as PUT };
