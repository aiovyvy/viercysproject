"use client";
import { useState } from "react";
import { ClassInviteManager } from "./admin-class-invites";
import { InviteManager } from "./admin-invites";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell, useData, api, Feedback } from "./journey";
import type { Booking } from "@/lib/booking";
import { money, type Room } from "@/lib/catalog";
import { propertyToday, addDays, dayNumber } from "@/lib/policy";
type Dashboard = {
  emails: Record<
    string,
    {
      id: string;
      kind: string;
      status: string;
      error: string | null;
      attempts: number;
      provider_id: string | null;
    }[]
  >;
  emailConfigured: boolean;
  blocks: {
    id: string;
    room_id: string;
    arrival: string;
    departure: string;
    reason: string;
  }[];
  payments: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    created_at: string;
  }[];
  rooms: Room[];
  bookings: Booking[];
  role: string;
  currency: string;
  today: string;
  report: { occupiedRooms: number; demoRevenue: number; upcoming: number };
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  "demo-paid": "Simulated payment",
  "demo-refunded": "Simulated refund",
  "demo-adjustment": "Simulated adjustment",
  "not-arrived": "Not arrived",
  "demo-prechecked": "Pre-checked in (demo)",
  "checked-in": "Checked in",
  "checked-out": "Checked out",
};
function statusLabel(value: string) {
  return STATUS_LABELS[value] ?? value;
}
export function StaffLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell
      title="Staff sign-in."
      eyebrow="Staff only"
      back={{ href: "/", label: "Home" }}
    >
      <p>
        Staff access is separate from guest access. Local demo credentials are
        generated into the private data/demo-staff.json file by the seed script.
        Production requires configured credentials; no default password is
        shipped.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api(
              "/api/admin/login",
              Object.fromEntries(new FormData(event.currentTarget)),
            );
            router.refresh();
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Could not sign in.",
            );
            setBusy(false);
          }
        }}
      >
        <div className="j-fields">
          <label>
            Staff username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Staff password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
        </div>
        <button className="j-button" disabled={busy}>
          Sign in to staff portal
        </button>
        <Feedback error={error} />
      </form>
    </Shell>
  );
}
export function StaffDashboard() {
  const router = useRouter();
  const result = useData<Dashboard>("/api/admin/dashboard");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState("reservations");
  const [error, setError] = useState("");
  const [calendarDate, setCalendarDate] = useState(propertyToday());
  const [reportStart, setReportStart] = useState(propertyToday());
  const [reportEnd, setReportEnd] = useState(addDays(propertyToday(), 30));
  const data = result.data;
  async function action(url: string, body: unknown) {
    setError("");
    try {
      await api(url, body);
      result.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Staff action failed.");
    }
  }
  const bookings =
    data?.bookings.filter(
      (booking) =>
        (!status || booking.status === status) &&
        [booking.reference, booking.name, booking.email, booking.arrival].some(
          (value) => value.toLowerCase().includes(filter.toLowerCase()),
        ),
    ) || [];
  return (
    <Shell title="Staff dashboard." eyebrow="Staff only">
      <Feedback error={result.error || error} loading={result.loading} />
      {data && (
        <>
          <p>
            Signed in as {data.role}. Date-based availability and operational
            statuses are shown separately.
          </p>
          <div className="j-metrics">
            <div>
              <strong>{data.report.occupiedRooms}/20</strong>Date-based
              occupancy today
            </div>
            <div>
              <strong>{data.report.upcoming}</strong>Upcoming reservations
            </div>
            <div>
              <strong>{money(data.report.demoRevenue, data.currency)}</strong>
              Confirmed demo revenue, all dates
            </div>
          </div>
          <div className="j-row">
            <div className="j-tabs">
              {[
                "reservations",
                "invitations",
                "inventory",
                "calendar",
                "guests",
                "reports",
              ].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={view === tab}
                  onClick={() => setView(tab)}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="j-button secondary"
              onClick={async () => {
                await api("/api/logout", {});
                router.refresh();
              }}
            >
              Staff sign out
            </button>
          </div>
          {view === "invitations" && (
            <>
              <InviteManager manager={data.role === "manager"} />
              {data.role === "manager" && <ClassInviteManager />}
            </>
          )}
          {view === "reservations" && (
            <>
              <div className="j-fields">
                <label>
                  Search reservation, guest, email or arrival
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </label>
                <label>
                  Reservation status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              </div>
              <div className="j-table-wrap">
                <table className="j-table">
                  <thead>
                    <tr>
                      <th>Reservation</th>
                      <th>Guest</th>
                      <th>Dates & rooms</th>
                      <th>Status / payment</th>
                      <th>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.reference}>
                        <td>
                          <Link href={"/booking/" + booking.reference}>
                            {booking.reference}
                          </Link>
                        </td>
                        <td>
                          {booking.name}
                          <br />
                          {booking.email}
                          <br />
                          {booking.phone}
                        </td>
                        <td>
                          {booking.arrival} – {booking.departure}
                          <br />
                          {booking.pricing.rooms
                            .map((room) => room.number)
                            .join(", ")}
                          <br />
                          {booking.adults} adults / {booking.children} children
                        </td>
                        <td>
                          {statusLabel(booking.status)}
                          <br />
                          {statusLabel(booking.payment_status)}
                          <br />
                          {statusLabel(booking.checkin_status)}
                          <br />
                          {booking.invite_id ? "Demo voucher" : "No voucher"}
                          <br />
                          {money(booking.pricing.total, booking.currency)}
                        </td>
                        <td>
                          <select
                            className="j-input"
                            aria-label={"Arrival status " + booking.reference}
                            value={
                              booking.checkin_status === "demo-prechecked"
                                ? "not-arrived"
                                : booking.checkin_status
                            }
                            disabled={booking.status !== "confirmed"}
                            onChange={(e) =>
                              action("/api/admin/reservation", {
                                reference: booking.reference,
                                status: e.target.value,
                              })
                            }
                          >
                            <option value="not-arrived">Not arrived</option>
                            <option value="checked-in">Check in</option>
                            <option value="checked-out">Check out</option>
                          </select>
                          <Link
                            className="text-link"
                            href={"/booking/" + booking.reference}
                          >
                            Modify / cancel
                          </Link>

                          <ConfirmationEmail
                            booking={booking}
                            events={data.emails[booking.reference] || []}
                            configured={data.emailConfigured}
                            refresh={result.refresh}
                          />
                          {data.role === "manager" && (
                            <button
                              type="button"
                              className="j-button secondary"
                              onClick={() =>
                                action("/api/admin/reminder", {
                                  reference: booking.reference,
                                })
                              }
                            >
                              Prepare reminder email
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bookings.length === 0 && <p>No matching reservations.</p>}
            </>
          )}
          {view === "guests" && (
            <section>
              <h2>Guest directory</h2>
              <label className="j-label">
                Search guest name or email
                <input
                  className="j-input"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </label>
              {Array.from(new Set(bookings.map((b) => b.email))).map(
                (email) => {
                  const stays = bookings.filter((b) => b.email === email);
                  return (
                    <article className="j-panel" key={email}>
                      <h3>{stays[0].name}</h3>
                      <p>
                        {email} · {stays[0].phone || "No phone provided"}
                      </p>
                      <p>{stays.length} reservation(s)</p>
                      {stays.map((b) => (
                        <p key={b.reference}>
                          <Link href={"/booking/" + b.reference}>
                            {b.reference}
                          </Link>{" "}
                          · {b.arrival} – {b.departure} ·{" "}
                          {statusLabel(b.status)}
                        </p>
                      ))}
                    </article>
                  );
                },
              )}
            </section>
          )}
          {view === "inventory" && data.blocks.length > 0 && (
            <section className="j-panel">
              <h2>Availability blocks</h2>
              {data.blocks.map((block) => (
                <div className="j-row" key={block.id}>
                  <p>
                    {block.room_id} · {block.arrival} – {block.departure} ·{" "}
                    {block.reason}
                  </p>
                  {data.role === "manager" && (
                    <button
                      className="j-button secondary"
                      type="button"
                      onClick={() =>
                        action("/api/admin/remove-block", { id: block.id })
                      }
                    >
                      Remove block
                    </button>
                  )}
                </div>
              ))}
            </section>
          )}
          {view === "inventory" && (
            <>
              <h2>Twenty physical rooms.</h2>
              <p>
                Cleaning and occupied are housekeeping states. Only maintenance
                excludes the room from new availability searches. Date-based
                booking conflicts are always checked separately.
              </p>
              <div className="j-table-wrap">
                <table className="j-table">
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Category</th>
                      <th>Capacity / nightly sample rate</th>
                      <th>Operational state</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rooms.map((room) => (
                      <tr key={room.id}>
                        <td>{room.number}</td>
                        <td>{room.category}</td>
                        <td>
                          {room.capacity} guests ·{" "}
                          {money(room.rate, data.currency)}
                        </td>
                        <td>
                          <select
                            className="j-input"
                            aria-label={"Operational status " + room.number}
                            value={room.operational}
                            onChange={(e) =>
                              action("/api/admin/room", {
                                id: room.id,
                                status: e.target.value,
                              })
                            }
                          >
                            {[
                              "ready",
                              "cleaning",
                              "occupied",
                              "maintenance",
                            ].map((state) => (
                              <option key={state}>{state}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.role === "manager" && (
                <form
                  className="j-panel"
                  onSubmit={(event) => {
                    event.preventDefault();
                    action(
                      "/api/admin/block",
                      Object.fromEntries(new FormData(event.currentTarget)),
                    );
                  }}
                >
                  <h2>Date-specific availability block</h2>
                  <div className="j-fields">
                    <label>
                      Room
                      <select name="roomId">
                        {data.rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.number}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Reason
                      <input name="reason" required maxLength={200} />
                    </label>
                    <label>
                      Block begins
                      <input name="arrival" type="date" required />
                    </label>
                    <label>
                      Block ends
                      <input name="departure" type="date" required />
                    </label>
                  </div>
                  <button className="j-button">
                    Create availability block
                  </button>
                </form>
              )}
            </>
          )}
          {view === "calendar" && (
            <>
              <h2>14-day reservation calendar</h2>
              <label className="j-label">
                Calendar begins
                <input
                  className="j-input"
                  type="date"
                  value={calendarDate}
                  onChange={(e) => setCalendarDate(e.target.value)}
                  required
                />
              </label>
              <div className="j-table-wrap">
                {Number.isFinite(dayNumber(calendarDate)) &&
                  data.rooms.map((room) => (
                    <div key={room.id}>
                      <p>
                        Room {room.number} · Operational: {room.operational}
                      </p>
                      <div className="j-calendar">
                        {Array.from({ length: 14 }, (_, index) => {
                          const date = addDays(calendarDate, index);
                          const blocked =
                            data.blocks.some(
                              (block) =>
                                block.room_id === room.id &&
                                block.arrival <= date &&
                                block.departure > date,
                            ) || room.operational === "maintenance";
                          const occupied = data.bookings.some(
                            (booking) =>
                              booking.status === "confirmed" &&
                              booking.roomIds.includes(room.id) &&
                              booking.arrival <= date &&
                              booking.departure > date,
                          );
                          return (
                            <span
                              key={date}
                              className={
                                occupied ? "occupied" : blocked ? "blocked" : ""
                              }
                            >
                              {date.slice(5)}
                              <br />
                              {occupied
                                ? "Reserved"
                                : blocked
                                  ? "Unavailable block"
                                  : "No reservation"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
          {view === "reports" && (
            <>
              <h2>Demo occupancy & revenue report</h2>
              <div className="j-fields">
                <label>
                  Report start
                  <input
                    type="date"
                    value={reportStart}
                    onChange={(e) => setReportStart(e.target.value)}
                  />
                </label>
                <label>
                  Report end
                  <input
                    type="date"
                    value={reportEnd}
                    onChange={(e) => setReportEnd(e.target.value)}
                  />
                </label>
              </div>
              <Report data={data} start={reportStart} end={reportEnd} />
              <h2>Simulated payment records</h2>
              <div className="j-table-wrap">
                <table className="j-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment, index) => (
                      <tr key={index}>
                        <td>{payment.reference}</td>
                        <td>{statusLabel(String(payment.status))}</td>
                        <td>{money(payment.amount, payment.currency)}</td>
                        <td>{payment.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </Shell>
  );
}
function Report({
  data,
  start,
  end,
}: {
  data: Dashboard;
  start: string;
  end: string;
}) {
  const length = dayNumber(end) - dayNumber(start);
  if (!Number.isFinite(length) || length <= 0 || length > 730)
    return <p role="alert">Choose a report range of 1–730 days.</p>;
  const bookings = data.bookings.filter(
    (booking) =>
      booking.status === "confirmed" &&
      booking.arrival < end &&
      booking.departure > start,
  );
  const occupied = bookings.reduce(
    (sum, booking) =>
      sum +
      (Math.min(dayNumber(end), dayNumber(booking.departure)) -
        Math.max(dayNumber(start), dayNumber(booking.arrival))) *
        booking.rooms,
    0,
  );
  const roomRevenue = bookings.reduce(
    (sum, booking) =>
      sum +
      (Math.min(dayNumber(end), dayNumber(booking.departure)) -
        Math.max(dayNumber(start), dayNumber(booking.arrival))) *
        booking.pricing.rooms.reduce((rate, room) => rate + room.rate, 0),
    0,
  );
  return (
    <div className="j-summary">
      <p>
        {occupied} occupied room-nights / {length * 20} possible room-nights
      </p>
      <p>
        {((occupied / (length * 20)) * 100).toFixed(1)}% reservation occupancy
      </p>
      <p>
        {money(roomRevenue, data.currency)} demo room revenue for nights in the
        period, excluding extras/tax
      </p>
      <p>
        {bookings.length} overlapping confirmed reservations. All figures are
        simulated, not actual hotel revenue.
      </p>
    </div>
  );
}

function ConfirmationEmail({
  booking,
  events,
  configured,
  refresh,
}: {
  booking: Booking;
  events: Dashboard["emails"][string];
  configured: boolean;
  refresh: () => void;
}) {
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const event = events.find(
    (item) =>
      item.id === `${booking.reference}-${booking.version}-confirmation`,
  );
  const accepted =
    event &&
    ["accepted", "sent", "delivered", "sending", "delayed", "bounced"].includes(
      event.status,
    );
  return (
    <div>
      <p>
        Confirmation email:{" "}
        {event?.status === "demo-preview"
          ? "Not sent"
          : event?.status || "Not prepared"}
        {event ? ` - ${event.attempts} attempt(s)` : ""}
      </p>
      {event?.provider_id && (
        <small>Provider reference: {event.provider_id}</small>
      )}
      {event?.error && <p role="status">{event.error}</p>}
      {!configured && (
        <p>Email sending is not configured. Reservation saved.</p>
      )}
      {accepted && <p>Already submitted; duplicate sending is disabled.</p>}
      {booking.status === "confirmed" && !accepted && (
        <button
          type="button"
          className="j-button secondary"
          disabled={!configured || busy}
          onClick={() => setReview(true)}
        >
          Review confirmation email
        </button>
      )}
      {review && (
        <div className="j-panel">
          <p>
            Send one confirmation for {booking.reference} to {booking.email}? No
            other reservation will be emailed.
          </p>
          <button
            type="button"
            className="j-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await api("/api/admin/confirmation-email", {
                  reference: booking.reference,
                  confirmReference: booking.reference,
                });
                setReview(false);
                refresh();
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Email could not be sent.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Sending..." : "Send this confirmation"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setReview(false)}
          >
            Cancel email
          </button>
          <Feedback error={error} />
        </div>
      )}
    </div>
  );
}
