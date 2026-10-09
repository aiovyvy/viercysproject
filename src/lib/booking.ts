import { randomBytes } from "node:crypto";
import { db, transaction, hash, type Session } from "./db";
import {
  findInvite,
  redeemInvite,
  releaseInvite,
  INVITE_MESSAGES,
} from "./invites";
import {
  CATEGORIES,
  EXTRAS,
  CURRENCY,
  type Room,
  type ExtraSelection,
} from "./catalog";
import {
  validateSearch,
  nights,
  propertyToday,
  dayNumber,
  VOUCHER,
  type SearchInput,
} from "./policy";
export type Pricing = {
  rooms: {
    id: string;
    number: string;
    name: string;
    rate: number;
    nights: number;
    subtotal: number;
  }[];
  extras: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    status: string;
  }[];
  roomSubtotal: number;
  extrasSubtotal: number;
  voucher: VoucherCredit | null;
  /** Rates are tax-inclusive; kept at 0 for bookings stored before the voucher rule. */
  tax: number;
  total: number;
  pendingApprovalTotal: number;
};
export type VoucherCredit = {
  roomId: string;
  coveredNights: number;
  unusedNights: number;
  extraNights: number;
  allowancePerNight: number;
  upgradePerNight: number;
  upgradeTotal: number;
  discount: number;
};
export type Booking = SearchInput & {
  reference: string;
  name: string;
  email: string;
  phone: string;
  requests: string;
  room_count: number;
  roomIds: string[];
  allocations: { room_id: string; adults: number; children: number }[];
  extras: ExtraSelection[];
  pricing: Pricing;
  currency: string;
  status: string;
  payment_status: string;
  checkin_status: string;
  version: number;
  created_at: string;
  invite_id: string | null;
};
export type BookingInput = SearchInput & {
  roomIds: string[];
  extras?: ExtraSelection[];
  guest: { name: string; email: string; phone?: string };
  requests?: string;
  consent: boolean;
  idempotencyKey: string;
  /** Raw invitation token from the server-side cookie, never a client discount. */
  inviteToken?: string;
};
function assertSearch(input: SearchInput) {
  const error = validateSearch(input);
  if (error) throw new Error(error);
}
export function available(input: SearchInput, exclude = "") {
  assertSearch(input);
  return db()
    .prepare(
      "SELECT * FROM rooms room WHERE room.operational<>'maintenance' AND NOT EXISTS(SELECT 1 FROM booked_rooms slot JOIN bookings stay ON stay.reference=slot.reference WHERE slot.room_id=room.id AND stay.status='confirmed' AND stay.reference<>? AND stay.arrival<? AND stay.departure>?) AND NOT EXISTS(SELECT 1 FROM availability_blocks block WHERE block.room_id=room.id AND block.arrival<? AND block.departure>?) ORDER BY room.rate,room.number",
    )
    .all(
      exclude,
      input.departure,
      input.arrival,
      input.departure,
      input.arrival,
    ) as unknown as Room[];
}
export function allocation(input: SearchInput, rooms: Room[]) {
  if (
    rooms.length !== input.rooms ||
    new Set(rooms.map((room) => room.id)).size !== rooms.length
  )
    throw new Error("Select exactly the requested number of different rooms.");
  if (
    rooms.reduce((sum, room) => sum + room.capacity, 0) <
    input.adults + input.children
  )
    throw new Error(
      "The selected rooms do not fit your party. Add capacity or another room.",
    );
  let adults = input.adults - rooms.length,
    children = input.children;
  const slots = rooms.map((room) => ({
    room_id: room.id,
    adults: 1,
    children: 0,
    remaining: room.capacity - 1,
  }));
  for (const slot of slots) {
    const extra = Math.min(adults, slot.remaining);
    slot.adults += extra;
    slot.remaining -= extra;
    adults -= extra;
  }
  for (const slot of slots) {
    const extra = Math.min(children, slot.remaining);
    slot.children += extra;
    slot.remaining -= extra;
    children -= extra;
  }
  if (adults || children)
    throw new Error("The selected rooms do not fit your party.");
  return slots.map(({ room_id, adults, children }) => ({
    room_id,
    adults,
    children,
  }));
}
export function voucherCredit(
  stayNights: number,
  room: Pick<Room, "id" | "rate">,
): VoucherCredit {
  const allowancePerNight = CATEGORIES.find(
    (cat) => cat.id === VOUCHER.baseCategory,
  )!.rate;
  const coveredNights = Math.min(VOUCHER.nights, stayNights);
  const upgradePerNight = Math.max(0, room.rate - allowancePerNight);
  return {
    roomId: room.id,
    coveredNights,
    unusedNights: VOUCHER.nights - coveredNights,
    extraNights: stayNights - coveredNights,
    allowancePerNight,
    upgradePerNight,
    upgradeTotal: upgradePerNight * stayNights,
    discount: coveredNights * Math.min(room.rate, allowancePerNight),
  };
}
export function pricing(
  input: SearchInput,
  rooms: Room[],
  selected: ExtraSelection[] = [],
  withVoucher = false,
): Pricing {
  allocation(input, rooms);
  if (!Array.isArray(selected) || selected.length > EXTRAS.length)
    throw new Error("Choose valid extras.");
  const seen = new Set<string>();
  const extras = selected.map((selection) => {
    const item = EXTRAS.find((extra) => extra.id === selection.id);
    if (
      !item ||
      seen.has(selection.id) ||
      !Number.isInteger(selection.quantity) ||
      selection.quantity < 1 ||
      selection.quantity > 540
    )
      throw new Error("Invalid extra or quantity.");
    seen.add(selection.id);
    return {
      ...item,
      quantity: selection.quantity,
      unitPrice: item.price,
      subtotal: item.price * selection.quantity,
    };
  });
  const rows = rooms.map((room) => ({
    id: room.id,
    number: room.number,
    name: CATEGORIES.find((cat) => cat.id === room.category)!.name,
    rate: room.rate,
    nights: nights(input),
    subtotal: room.rate * nights(input),
  }));
  const roomSubtotal = rows.reduce((sum, item) => sum + item.subtotal, 0);
  const extrasSubtotal = extras
    .filter((extra) => extra.status === "confirmed-demo")
    .reduce((sum, item) => sum + item.subtotal, 0);
  const pendingApprovalTotal = extras
    .filter((extra) => extra.status === "pending-approval")
    .reduce((sum, item) => sum + item.subtotal, 0);
  const voucher = withVoucher ? voucherCredit(nights(input), rooms[0]) : null;
  return {
    rooms: rows,
    extras,
    roomSubtotal,
    extrasSubtotal,
    voucher,
    tax: 0,
    total: roomSubtotal + extrasSubtotal - (voucher?.discount ?? 0),
    pendingApprovalTotal,
  };
}
export function quote(
  input: SearchInput,
  ids: string[],
  extras: ExtraSelection[] = [],
  exclude = "",
  withVoucher = false,
) {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string"))
    throw new Error("Select valid physical rooms.");
  const rooms = available(input, exclude).filter((room) =>
    ids.includes(room.id),
  );
  if (rooms.length !== ids.length)
    throw new Error(
      "A selected room is no longer available. Please search again.",
    );
  return pricing(input, rooms, extras, withVoucher);
}
export function getBooking(reference: string): Booking | null {
  const row = db()
    .prepare("SELECT * FROM bookings WHERE reference=?")
    .get(reference) as Record<string, unknown> | undefined;
  if (!row) return null;
  const allocations = db()
    .prepare(
      "SELECT room_id,adults,children FROM booked_rooms WHERE reference=?",
    )
    .all(reference) as Booking["allocations"];
  return {
    ...row,
    rooms: Number(row.room_count),
    extras: JSON.parse(String(row.extras)),
    pricing: JSON.parse(String(row.pricing)),
    allocations,
    roomIds: allocations.map((slot) => slot.room_id),
  } as Booking;
}
export function authorize(reference: string, auth: Session | null) {
  const booking = getBooking(reference);
  if (
    !booking ||
    !auth ||
    (auth.kind !== "admin" &&
      !(auth.verified
        ? auth.subject === booking.email
        : auth.subject === reference))
  )
    throw new Error("Sign in with a verified link to access this reservation.");
  return booking;
}
export function createBooking(input: BookingInput) {
  assertSearch(input);
  if (
    !Array.isArray(input.roomIds) ||
    input.roomIds.some((id) => typeof id !== "string")
  )
    throw new Error("Select valid physical rooms.");
  if (input.consent !== true)
    throw new Error("Accept the demo payment terms and cancellation policy.");
  if (
    !input.guest ||
    typeof input.guest.name !== "string" ||
    input.guest.name.trim().length < 2 ||
    input.guest.name.length > 100
  )
    throw new Error("Enter your full name (2–100 characters).");
  const email = String(input.guest.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw new Error("Enter a valid email address.");
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(input.idempotencyKey))
    throw new Error("A valid checkout request key is required.");
  if (
    (input.requests?.length || 0) > 2000 ||
    (input.guest.phone?.length || 0) > 40
  )
    throw new Error("Shorten your phone number or special requests.");
  const useVoucher = input.inviteToken !== undefined;
  // The token is excluded so a retry after the voucher cookie is cleared still
  // matches the original request.
  const canonical = {
    ...input,
    inviteToken: undefined,
    useVoucher,
    guest: {
      name: input.guest.name.trim(),
      email,
      phone: input.guest.phone || "",
    },
  };
  const payloadHash = hash(JSON.stringify(canonical));
  return transaction(() => {
    const duplicate = db()
      .prepare(
        "SELECT reference,payload_hash FROM bookings WHERE idempotency_key=?",
      )
      .get(input.idempotencyKey) as
      { reference: string; payload_hash: string } | undefined;
    if (duplicate) {
      if (duplicate.payload_hash !== payloadHash)
        throw new Error(
          "This checkout request has already been used with different details. Start a new checkout.",
        );
      return getBooking(duplicate.reference)!;
    }
    const rooms = available(input).filter((room) =>
      input.roomIds.includes(room.id),
    );
    if (rooms.length !== input.roomIds.length)
      throw new Error(
        "A selected room was just reserved. Please search again.",
      );
    const allocations = allocation(input, rooms);
    if (useVoucher) {
      const { state } = findInvite(input.inviteToken);
      if (state !== "valid") throw new Error(INVITE_MESSAGES[state]);
    }
    const total = pricing(input, rooms, input.extras || [], useVoucher);
    const reference = "VRC-" + randomBytes(6).toString("hex").toUpperCase();
    db()
      .prepare(
        "INSERT INTO bookings(reference,idempotency_key,payload_hash,arrival,departure,adults,children,room_count,name,email,phone,requests,extras,pricing,currency) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        reference,
        input.idempotencyKey,
        payloadHash,
        input.arrival,
        input.departure,
        input.adults,
        input.children,
        input.rooms,
        canonical.guest.name,
        email,
        canonical.guest.phone,
        input.requests || "",
        JSON.stringify(input.extras || []),
        JSON.stringify(total),
        CURRENCY,
      );
    for (const slot of allocations)
      db()
        .prepare("INSERT INTO booked_rooms VALUES(?,?,?,?)")
        .run(reference, slot.room_id, slot.adults, slot.children);
    if (useVoucher)
      db()
        .prepare("UPDATE bookings SET invite_id=? WHERE reference=?")
        .run(redeemInvite(input.inviteToken!, reference), reference);
    db()
      .prepare("INSERT OR IGNORE INTO guests(email,name,phone) VALUES(?,?,?)")
      .run(email, canonical.guest.name, canonical.guest.phone);
    db()
      .prepare(
        "INSERT INTO payment_records(id,reference,status,amount,currency) VALUES(?,?,?,?,?)",
      )
      .run(reference + "-paid", reference, "demo-paid", total.total, CURRENCY);
    queueEmail(reference, "confirmation");
    return getBooking(reference)!;
  });
}
export function modify(
  reference: string,
  input: SearchInput & { roomIds?: string[] },
  auth: Session | null,
) {
  const original = authorize(reference, auth);
  if (
    original.status !== "confirmed" ||
    original.checkin_status !== "not-arrived"
  )
    throw new Error(
      "Only confirmed stays that have not checked in can be modified.",
    );
  assertSearch(input);
  if (auth?.kind !== "admin" && original.arrival <= propertyToday())
    throw new Error(
      "Contact staff to modify a stay starting today or earlier.",
    );
  return transaction(() => {
    const current = getBooking(reference)!;
    if (
      current.status !== "confirmed" ||
      current.checkin_status !== "not-arrived"
    )
      throw new Error("This reservation can no longer be modified.");
    const ids = input.roomIds || current.roomIds;
    const rooms = available(input, reference).filter((room) =>
      ids.includes(room.id),
    );
    if (rooms.length !== ids.length)
      throw new Error("Your rooms are unavailable on those dates.");
    const slots = allocation(input, rooms);
    const total = pricing(
      input,
      rooms,
      current.extras,
      Boolean(current.invite_id),
    );
    db().prepare("DELETE FROM booked_rooms WHERE reference=?").run(reference);
    db()
      .prepare(
        "UPDATE bookings SET arrival=?,departure=?,adults=?,children=?,room_count=?,pricing=?,version=version+1 WHERE reference=?",
      )
      .run(
        input.arrival,
        input.departure,
        input.adults,
        input.children,
        input.rooms,
        JSON.stringify(total),
        reference,
      );
    slots.forEach((slot) =>
      db()
        .prepare("INSERT INTO booked_rooms VALUES(?,?,?,?)")
        .run(reference, slot.room_id, slot.adults, slot.children),
    );
    if (total.total !== current.pricing.total)
      db()
        .prepare(
          "INSERT INTO payment_records(id,reference,status,amount,currency) VALUES(?,?,?,?,?)",
        )
        .run(
          `${reference}-adjustment-${current.version + 1}`,
          reference,
          "demo-adjustment",
          total.total - current.pricing.total,
          current.currency,
        );
    db().prepare("DELETE FROM itineraries WHERE reference=?").run(reference);
    queueEmail(reference, "modification");
    return getBooking(reference)!;
  });
}
export function cancel(
  reference: string,
  auth: Session | null,
  confirmed: boolean,
) {
  const booking = authorize(reference, auth);
  if (!confirmed) throw new Error("Confirm cancellation explicitly.");
  if (booking.status === "cancelled") return booking;
  if (
    booking.checkin_status === "checked-in" ||
    booking.checkin_status === "checked-out"
  )
    throw new Error("Contact staff for an in-progress stay.");
  if (
    auth?.kind !== "admin" &&
    dayNumber(booking.arrival) - dayNumber(propertyToday()) < 2
  )
    throw new Error(
      "Online cancellation closes two calendar days before arrival. Contact staff.",
    );
  return transaction(() => {
    const current = getBooking(reference)!;
    if (current.status === "cancelled") return current;
    if (
      current.checkin_status === "checked-in" ||
      current.checkin_status === "checked-out"
    )
      throw new Error("Contact staff for an in-progress stay.");
    db()
      .prepare(
        "UPDATE bookings SET status='cancelled',payment_status='demo-refunded',version=version+1 WHERE reference=?",
      )
      .run(reference);
    releaseInvite(reference);
    db()
      .prepare(
        "INSERT OR IGNORE INTO payment_records(id,reference,status,amount,currency) VALUES(?,?,?,?,?)",
      )
      .run(
        reference + "-refunded",
        reference,
        "demo-refunded",
        -current.pricing.total,
        booking.currency,
      );
    queueEmail(reference, "cancellation");
    return getBooking(reference)!;
  });
}
export function listBookings(auth: Session | null) {
  if (!auth) return [];
  const rows =
    auth.kind === "admin"
      ? db()
          .prepare("SELECT reference FROM bookings ORDER BY created_at DESC")
          .all()
      : db()
          .prepare(
            auth.verified
              ? "SELECT reference FROM bookings WHERE email=? ORDER BY created_at DESC"
              : "SELECT reference FROM bookings WHERE reference=?",
          )
          .all(auth.subject);
  return rows.map((row) => getBooking(String(row.reference))!);
}
export type EmailKind =
  "confirmation" | "modification" | "cancellation" | "reminder";
export function queueEmail(reference: string, kind: EmailKind) {
  const booking = getBooking(reference)!;
  db()
    .prepare(
      "INSERT OR IGNORE INTO email_attempts(id,reference,version,kind,html) VALUES(?,?,?,?,?)",
    )
    .run(
      `${reference}-${booking.version}-${kind}`,
      reference,
      booking.version,
      kind,
      "",
    );
}
export function emailStatuses(reference: string) {
  return db()
    .prepare(
      "SELECT id,kind,status,error,attempts,provider_id FROM email_attempts WHERE reference=? ORDER BY rowid DESC",
    )
    .all(reference);
}
export type ItineraryInput = {
  interests: string;
  pace: string;
  budget: string;
};
export function defaultItinerary(booking: Booking, input: ItineraryInput) {
  const days = Array.from({ length: nights(booking) }, (_, index) => ({
    date: new Date((dayNumber(booking.arrival) + index) * 86400000)
      .toISOString()
      .slice(0, 10),
    morning: `${booking.children ? "A family-friendly, " : ""}${input.pace === "slow" ? "An unhurried" : "A fresh"} morning and a coastal walk.`,
    afternoon: input.interests.includes("food")
      ? "Explore village dining ideas; confirm menus and opening times locally."
      : input.interests.includes("wellness")
        ? "Quiet time and a self-guided stretch with the sea in view."
        : "Explore island architecture and village paths at your own pace.",
    evening:
      input.budget === "low"
        ? "Enjoy a self-guided sunset walk and choose a casual local meal. Confirm costs locally."
        : "Find a sunset viewpoint and leave time for dinner. All activities are suggestions.",
  }));
  return {
    source: "deterministic-demo",
    preferences: input,
    party: { adults: booking.adults, children: booking.children },
    days,
    bookedExtras: booking.pricing.extras.filter(
      (extra) => extra.status === "confirmed-demo",
    ),
    requestedExtras: booking.pricing.extras.filter(
      (extra) => extra.status === "pending-approval",
    ),
    notice:
      "Suggestions are not reservations. Verify access, opening times and costs locally.",
  };
}
export function saveItinerary(reference: string, content: unknown) {
  const encoded = JSON.stringify(content);
  if (encoded.length > 50000) throw new Error("Itinerary is too large.");
  db()
    .prepare(
      "INSERT INTO itineraries(reference,content) VALUES(?,?) ON CONFLICT(reference) DO UPDATE SET content=excluded.content,updated_at=CURRENT_TIMESTAMP",
    )
    .run(reference, encoded);
}
export function loadItinerary(reference: string) {
  const row = db()
    .prepare("SELECT content FROM itineraries WHERE reference=?")
    .get(reference);
  return row ? JSON.parse(String(row.content)) : null;
}
