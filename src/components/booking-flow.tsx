"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navigation, Footer } from "@/app/experience";
import { useData, api, Feedback, ApiError, VOUCHER_EVENT } from "./journey";
import { Calendar } from "./calendar";
import "./journey.css";
import "./booking-flow.css";
import {
  CATEGORIES,
  CURRENCY,
  EXTRAS,
  money,
  type ExtraSelection,
  type Room,
} from "@/lib/catalog";
import {
  addDays,
  cancelOnlineUntil,
  canCancelOnline,
  dayNumber,
  formatDate,
  nights,
  propertyToday,
  searchQuery,
  validateSearch,
  POLICY,
  type SearchInput,
} from "@/lib/policy";
import type { Booking, Pricing, VoucherCredit } from "@/lib/booking";

export type VoucherStatus = {
  state: string;
  unusable: boolean;
  message: string | null;
  active: boolean;
  nights: number;
  expires: number | null;
};
const GUIDE_KEY = "viercys-booking-guide-v1";
const STEPS = ["Dates & guests", "Room", "Review & confirm"];
function guideSteps(voucher: boolean) {
  return [
    {
      target: "dates",
      title: "Choose your dates",
      body: voucher
        ? "Pick a check-in date. Three nights are already selected — that is what your voucher covers."
        : "Pick a check-in date and how many nights you would like to stay.",
    },
    {
      target: "room",
      title: "Pick a room",
      body: voucher
        ? "Essential Rooms are fully covered. Larger rooms show the exact extra cost before you choose."
        : "Each room shows who it sleeps and the full price for your dates.",
    },
    {
      target: "details",
      title: "Review and confirm",
      body: "Check the price breakdown, add your name and email, then confirm. This is a demo: no real payment is taken.",
    },
  ];
}
function readGuideDone() {
  try {
    return window.localStorage.getItem(GUIDE_KEY) === "done";
  } catch {
    return true;
  }
}
function saveGuideDone() {
  try {
    window.localStorage.setItem(GUIDE_KEY, "done");
  } catch {}
}

export function BookingShell({
  step,
  title,
  back,
  children,
}: {
  /** 0–2 booking steps, 3 = confirmed, -1 = no stepper (manage stay). */
  step: number;
  title: string;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const voucher = useData<VoucherStatus>("/api/invite");
  const refreshVoucher = voucher.refresh;
  useEffect(() => {
    window.addEventListener(VOUCHER_EVENT, refreshVoucher);
    return () => window.removeEventListener(VOUCHER_EVENT, refreshVoucher);
  }, [refreshVoucher]);
  const [guide, setGuide] = useState<number | null>(null);
  useEffect(() => {
    if (step === 0 && !readGuideDone()) queueMicrotask(() => setGuide(0));
  }, [step]);
  const steps = guideSteps(!!voucher.data?.active);
  function closeGuide() {
    saveGuideDone();
    setGuide(null);
  }
  return (
    <>
      <Navigation />
      <main
        id="main"
        className="book-main"
        data-guide={guide === null ? undefined : steps[guide].target}
      >
        {(back || (step >= 0 && step < 3)) && (
          <div className="book-top">
            {back ? (
              <Link className="book-back" href={back.href}>
                <span aria-hidden="true">←</span> {back.label}
              </Link>
            ) : (
              <span />
            )}
            {step >= 0 && step < 3 && guide === null && (
              <button
                type="button"
                className="book-guide-open"
                onClick={() => setGuide(0)}
              >
                Show booking guide
              </button>
            )}
          </div>
        )}
        {step >= 0 && (
          <nav aria-label="Booking progress">
            <ol className="book-steps">
              {STEPS.map((label, index) => (
                <li
                  key={label}
                  aria-current={index === step ? "step" : undefined}
                  className={
                    (index < step ? "done " : "") +
                    (guide === index ? "guided" : "")
                  }
                >
                  <span className="book-step-number" aria-hidden="true">
                    {index < step ? "✓" : index + 1}
                  </span>
                  <span>
                    <span className="sr-only">
                      Step {index + 1} of {STEPS.length}:{" "}
                    </span>
                    {label}
                    {index < step && <span className="sr-only"> (done)</span>}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {guide !== null && (
          <section className="book-guide" aria-label="Booking guide">
            <p className="book-guide-count">
              Guide · step {guide + 1} of {steps.length}
            </p>
            <h2>{steps[guide].title}</h2>
            <p>{steps[guide].body}</p>
            <div className="book-guide-dots" aria-hidden="true">
              {steps.map((item, index) => (
                <span
                  key={item.target}
                  className={index === guide ? "on" : ""}
                />
              ))}
            </div>
            <div className="book-guide-actions">
              <button
                type="button"
                className="book-text-button"
                onClick={closeGuide}
              >
                Skip guide
              </button>
              <span>
                {guide > 0 && (
                  <button
                    type="button"
                    className="book-button secondary"
                    onClick={() => setGuide(guide - 1)}
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  className="book-button"
                  onClick={() =>
                    guide + 1 < steps.length
                      ? setGuide(guide + 1)
                      : closeGuide()
                  }
                >
                  {guide + 1 < steps.length ? "Next" : "Start booking"}
                </button>
              </span>
            </div>
          </section>
        )}
        <h1>{title}</h1>
        {voucher.data?.active && step >= 0 && step < 3 && (
          <p className="book-voucher" role="note">
            <strong>Demo voucher applied.</strong> {voucher.data.nights}{" "}
            complimentary Essential Room nights. Extra nights and upgrades are
            optional and always shown before you confirm.
          </p>
        )}
        {voucher.data?.unusable && step >= 0 && step < 3 && (
          <p className="book-voucher warn" role="note">
            <strong>Your voucher can&rsquo;t be used.</strong>{" "}
            {voucher.data.message} Prices on this page are the standard demo
            rate; nothing is booked or charged until you confirm.
          </p>
        )}
        {children}
        <p className="book-footnote">
          VIERCYS is a fictional hotel created for a classroom demonstration.
          Prices are simulated in {CURRENCY}; no real payment, travel or
          accommodation is booked.
        </p>
      </main>
      <Footer />
    </>
  );
}

function Counter({
  label,
  noun = label.toLowerCase().replace(/s$/, ""),
  hint,
  value,
  min,
  max,
  name,
  onChange,
}: {
  label: string;
  /** Singular used in "Add one …" button names. */
  noun?: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  name: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="book-counter" role="group" aria-label={label}>
      <div>
        <span className="book-counter-label">{label}</span>
        {hint && <span className="book-counter-hint">{hint}</span>}
      </div>
      <div className="book-counter-controls">
        <button
          type="button"
          aria-label={`Remove one ${noun}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <output aria-live="polite" aria-label={`${label}: ${value}`}>
          {value}
        </output>
        <button
          type="button"
          aria-label={`Add one ${noun}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export function DatesStep({ initial }: { initial: SearchInput }) {
  const router = useRouter();
  const today = propertyToday();
  const horizon = addDays(today, POLICY.horizonDays);
  const [arrival, setArrival] = useState(initial.arrival);
  const [departure, setDeparture] = useState(initial.departure);
  const [adults, setAdults] = useState(initial.adults);
  const [children, setChildren] = useState(initial.children);
  const [rooms, setRooms] = useState(initial.rooms);
  const [error, setError] = useState("");
  const alert = useRef<HTMLDivElement>(null);
  const search = { arrival, departure, adults, children, rooms };
  const stay = nights(search);
  const party = adults + children;
  const neededRooms = Math.min(5, Math.ceil(party / 4));
  function setNights(count: number) {
    if (Number.isFinite(dayNumber(arrival)))
      setDeparture(addDays(arrival, count));
    setError("");
  }
  function changeArrival(value: string) {
    setArrival(value);
    // Keep the chosen length of stay when the check-in date moves.
    if (Number.isFinite(stay) && stay > 0 && /^\d{4}-\d{2}-\d{2}$/.test(value))
      setDeparture(addDays(value, stay));
    setError("");
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = validateSearch(search);
    if (message) {
      setError(message);
      requestAnimationFrame(() => alert.current?.focus());
      return;
    }
    router.push("/book/rooms?" + searchQuery(search));
  }
  return (
    <form className="book-form" onSubmit={submit} noValidate>
      <fieldset className="book-card book-dates">
        <legend>When would you like to stay?</legend>
        <div className="book-date-row">
          <div className="book-field">
            <label htmlFor="book-arrival">Check-in</label>
            <div className="book-date-input">
              <input
                id="book-arrival"
                type="date"
                min={today}
                max={horizon}
                value={arrival}
                onChange={(e) => changeArrival(e.target.value)}
                aria-invalid={!!error && /date|check|year|past/i.test(error)}
              />
              <Calendar
                value={arrival}
                onChange={changeArrival}
                min={today}
                max={horizon}
                label="check-in"
              />
            </div>
          </div>
          <div className="book-field">
            <label htmlFor="book-departure">Check-out</label>
            <div className="book-date-input">
              <input
                id="book-departure"
                type="date"
                min={addDays(today, 1)}
                max={horizon}
                value={departure}
                onChange={(e) => {
                  setDeparture(e.target.value);
                  setError("");
                }}
                aria-invalid={!!error && /date|check|year|night/i.test(error)}
              />
              <Calendar
                value={departure}
                onChange={(value) => {
                  setDeparture(value);
                  setError("");
                }}
                min={addDays(today, 1)}
                max={horizon}
                label="check-out"
              />
            </div>
          </div>
        </div>
        <div className="book-nights" role="group" aria-label="Length of stay">
          {[3, 4, 5, 7].map((count) => (
            <button
              type="button"
              key={count}
              aria-pressed={stay === count}
              onClick={() => setNights(count)}
            >
              {count} nights
            </button>
          ))}
        </div>
        <p className="book-help" aria-live="polite">
          {Number.isFinite(stay) && stay > 0
            ? `${stay} night${stay === 1 ? "" : "s"} · ${formatDate(arrival)} to ${formatDate(departure)}`
            : "Choose a check-out date after check-in."}
          {Number.isFinite(stay) &&
            stay > 3 &&
            ` · nights beyond the first three are charged at the room rate`}
        </p>
      </fieldset>
      <fieldset className="book-card">
        <legend>Who is coming?</legend>
        <Counter
          label="Adults"
          hint="Age 13+"
          name="adults"
          value={adults}
          min={1}
          max={10}
          onChange={(value) => {
            setAdults(value);
            setError("");
          }}
        />
        <Counter
          label="Children"
          noun="child"
          hint="Age 0–12 · count toward room capacity"
          name="children"
          value={children}
          min={0}
          max={8}
          onChange={(value) => {
            setChildren(value);
            setError("");
          }}
        />
        <Counter
          label="Rooms"
          hint="Essential sleeps 2 · Signature 3 · Grand 4"
          name="rooms"
          value={rooms}
          min={1}
          max={5}
          onChange={(value) => {
            setRooms(value);
            setError("");
          }}
        />
        {party > rooms * 4 && (
          <div className="book-inline-note">
            <p>
              A party of {party} needs at least {neededRooms} rooms (the largest
              room sleeps 4).
            </p>
            {
              <button
                type="button"
                className="book-button secondary"
                onClick={() => {
                  setRooms(neededRooms);
                  setError("");
                }}
              >
                Use {neededRooms} rooms
              </button>
            }
          </div>
        )}
        {rooms === 1 && party === 3 && (
          <p className="book-help">
            Three guests fit in a Signature Suite or Grand Sanctuary, or choose
            2 rooms.
          </p>
        )}
        {rooms === 1 && party === 4 && (
          <p className="book-help">
            Four guests fit in a Grand Sanctuary, or choose 2 rooms.
          </p>
        )}
      </fieldset>
      {error && (
        <div ref={alert} className="book-error" role="alert" tabIndex={-1}>
          <p>{error}</p>
        </div>
      )}
      <div className="book-actionbar">
        <button className="book-button primary" type="submit">
          See available rooms
        </button>
      </div>
    </form>
  );
}

type Availability = {
  rooms: Room[];
  currency: string;
  voucher: VoucherStatus;
  categories: ((typeof CATEGORIES)[number] & {
    remaining: number;
    stayTotal: number;
    due: number;
    voucher: VoucherCredit | null;
  })[];
};
function stayLine(search: SearchInput) {
  const party = `${search.adults} adult${search.adults === 1 ? "" : "s"}${search.children ? `, ${search.children} child${search.children === 1 ? "" : "ren"}` : ""}`;
  return `${formatDate(search.arrival)} – ${formatDate(search.departure)} · ${nights(search)} nights · ${party}${search.rooms > 1 ? ` · ${search.rooms} rooms` : ""}`;
}
export function RoomsStep({
  search,
  initialError,
}: {
  search: SearchInput;
  initialError: string | null;
}) {
  const router = useRouter();
  const response = useData<Availability>(
    "/api/availability?" + searchQuery(search),
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const data = response.data;
  const party = search.adults + search.children;
  const multi = search.rooms > 1;
  const chosen = data
    ? Object.entries(counts).flatMap(([id, count]) =>
        data.rooms.filter((room) => room.category === id).slice(0, count),
      )
    : [];
  const chosenCapacity = chosen.reduce((sum, room) => sum + room.capacity, 0);
  const complete = chosen.length === search.rooms && chosenCapacity >= party;
  function go(roomIds: string[]) {
    router.push(
      "/book/details?" + searchQuery(search) + "&roomIds=" + roomIds.join(","),
    );
  }
  return (
    <>
      <div className="book-summary-line">
        <p>{stayLine(search)}</p>
        <Link href={"/book?" + searchQuery(search)}>Change</Link>
      </div>
      <Feedback
        error={initialError || response.error}
        loading={!initialError && response.loading}
      />
      {initialError && (
        <Link
          className="book-button secondary"
          href={"/book?" + searchQuery(search)}
        >
          Change dates or guests
        </Link>
      )}
      {!initialError && data && data.rooms.length === 0 && (
        <div className="book-error" role="status">
          <h2>Fully booked on these dates.</h2>
          <p>
            All 20 rooms are reserved for at least one of these nights. Try
            different dates — nothing has been held or charged.
          </p>
          <Link className="book-button" href={"/book?" + searchQuery(search)}>
            Choose other dates
          </Link>
        </div>
      )}
      {!initialError && data && data.rooms.length > 0 && (
        <>
          {data.voucher.active &&
            data.categories.find(
              (cat) => cat.id === "essential" && cat.remaining === 0,
            ) && (
              <div className="book-voucher warn" role="note">
                <p>
                  <strong>
                    Essential Rooms, which your voucher fully covers, are sold
                    out for these dates.
                  </strong>{" "}
                  Try other dates to stay for €0, or choose a larger room and
                  pay only the difference shown.
                </p>
                <p>
                  <Link href={"/book?" + searchQuery(search)}>
                    Choose other dates
                  </Link>
                </p>
              </div>
            )}
          {multi && (
            <p className="book-help">
              Choose {search.rooms} rooms with space for all {party} guests.
              {data.voucher.active &&
                " Your voucher applies to one room; other rooms are charged at their rate."}
            </p>
          )}
          <div className="book-rooms">
            {data.categories.map((cat, index) => {
              const fits = multi || cat.capacity >= party;
              const soldOut = cat.remaining === 0;
              const count = counts[cat.id] || 0;
              const others = chosen.length - count;
              return (
                <article className="book-room" key={cat.id}>
                  <div className="book-room-photo">
                    <Image
                      src={cat.photo}
                      alt={`${cat.name}: editorial inspiration image`}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 700px) 100vw, 33vw"
                    />
                    <span className="book-room-tier">{cat.tier}</span>
                  </div>
                  <div className="book-room-body">
                    <h2>{cat.name}</h2>
                    <p className="book-room-facts">
                      Sleeps up to {cat.capacity} · {cat.size} m² · {cat.view}{" "}
                      view
                    </p>
                    <ul className="book-room-amenities">
                      {cat.amenities.slice(0, 4).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="book-room-price">
                      {soldOut ? (
                        <p className="book-room-due">
                          Sold out for these dates
                        </p>
                      ) : cat.voucher ? (
                        <>
                          <p className="book-room-due">
                            {cat.due === 0
                              ? "Fully covered by your voucher"
                              : `You pay ${money(cat.due, data.currency)}`}
                          </p>
                          <p>
                            {money(cat.rate, data.currency)} per night ×{" "}
                            {nights(search)} ={" "}
                            {money(cat.stayTotal, data.currency)}, minus voucher{" "}
                            {money(cat.voucher.discount, data.currency)}
                          </p>
                          {cat.voucher.upgradePerNight > 0 && (
                            <p>
                              Includes upgrade of{" "}
                              {money(
                                cat.voucher.upgradePerNight,
                                data.currency,
                              )}{" "}
                              per night over the Essential rate.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="book-room-due">
                            {money(cat.stayTotal, data.currency)} for{" "}
                            {nights(search)} nights
                          </p>
                          <p>{money(cat.rate, data.currency)} per night</p>
                        </>
                      )}
                    </div>
                    {!soldOut && (
                      <p className="book-room-left">
                        {cat.remaining} of {cat.inventory} available for your
                        dates
                      </p>
                    )}
                    {!fits && !soldOut && (
                      <p className="book-room-warning">
                        Too small for {party} guests. Choose a larger room or{" "}
                        <Link
                          href={"/book?" + searchQuery({ ...search, rooms: 2 })}
                        >
                          book 2 rooms
                        </Link>
                        .
                      </p>
                    )}
                    {multi ? (
                      <Counter
                        label={`${cat.name} rooms`}
                        name={"count-" + cat.id}
                        value={count}
                        min={0}
                        max={Math.min(cat.remaining, search.rooms - others)}
                        onChange={(value) =>
                          setCounts({ ...counts, [cat.id]: value })
                        }
                      />
                    ) : (
                      <button
                        type="button"
                        className="book-button primary"
                        disabled={!fits || soldOut}
                        onClick={() =>
                          go([
                            data.rooms.find((room) => room.category === cat.id)!
                              .id,
                          ])
                        }
                      >
                        Select {cat.name}
                      </button>
                    )}
                    <Link
                      className="book-text-link"
                      href={`/rooms/${cat.id}?${searchQuery(search)}`}
                    >
                      Photos and full details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          {multi && (
            <div className="book-actionbar sticky">
              <p aria-live="polite">
                {chosen.length} of {search.rooms} rooms selected · sleeps{" "}
                {chosenCapacity} of {party} guests
              </p>
              <button
                type="button"
                className="book-button primary"
                disabled={!complete}
                onClick={() => go(chosen.map((room) => room.id))}
              >
                Continue
              </button>
            </div>
          )}
          <p className="book-help">
            Not sure?{" "}
            <Link
              className="book-text-link"
              href={`/compare?${searchQuery(search)}&categories=essential,signature,grand`}
            >
              Compare the three rooms side by side
            </Link>
          </p>
        </>
      )}
    </>
  );
}

export function DetailsStep({
  search,
  roomIds,
}: {
  search: SearchInput;
  roomIds: string[];
}) {
  const router = useRouter();
  const storageKey =
    "viercys-checkout-" + roomIds.join(",") + "-" + search.arrival;
  const [extras, setExtras] = useState<ExtraSelection[]>([]);
  const [error, setError] = useState("");
  const [voucherLost, setVoucherLost] = useState("");
  // Set when this exact checkout was already confirmed (Back button).
  const [completed, setCompleted] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestKey, setRequestKey] = useState("");
  const [quotedPayload, setQuotedPayload] = useState("");
  const alert = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let key = "";
    try {
      key = window.sessionStorage.getItem(storageKey) || "";
    } catch {}
    // crypto.randomUUID needs a secure context; classroom phones reach the
    // demo over plain http on the LAN, where only getRandomValues exists.
    key ||= Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    try {
      window.sessionStorage.setItem(storageKey, key);
    } catch {}
    let done = "";
    try {
      done =
        window.sessionStorage.getItem("viercys-completed-" + storageKey) || "";
    } catch {}
    queueMicrotask(() => {
      setRequestKey(key);
      setCompleted(done);
    });
  }, [storageKey]);
  const payload = { ...search, roomIds, extras };
  const body = JSON.stringify(payload);
  const quote = useData<{ pricing: Pricing; currency: string }>(
    "/api/quote",
    payload,
  );
  useEffect(() => {
    if (quote.data) queueMicrotask(() => setQuotedPayload(body));
  }, [quote.data, body]);
  function setExtra(id: string, quantity: number) {
    setExtras((current) => [
      ...current.filter((item) => item.id !== id),
      ...(quantity > 0 ? [{ id, quantity }] : []),
    ]);
  }
  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setBusy(true);
    setError("");
    const values = new FormData(form);
    try {
      const result = await api<{ booking: Booking }>("/api/bookings", {
        ...payload,
        guest: {
          name: values.get("name"),
          email: values.get("email"),
          phone: values.get("phone"),
        },
        requests: values.get("requests"),
        consent: values.get("consent") === "on",
        useVoucher: !!quote.data?.pricing.voucher,
        idempotencyKey: requestKey,
      });
      try {
        window.sessionStorage.removeItem(storageKey);
        window.sessionStorage.setItem(
          "viercys-completed-" + storageKey,
          result.booking.reference,
        );
      } catch {}
      router.push("/booking/" + result.booking.reference + "?success=1");
    } catch (error) {
      if (error instanceof ApiError && error.code === "voucher_unavailable") {
        // Never retry with a dead voucher and never charge silently:
        // re-price at the standard rate and require a fresh confirmation.
        setVoucherLost(error.message);
        quote.refresh();
        window.dispatchEvent(new Event(VOUCHER_EVENT));
      } else {
        setError(
          error instanceof Error
            ? error.message
            : "Could not confirm your stay.",
        );
      }
      setBusy(false);
      requestAnimationFrame(() => alert.current?.focus());
    }
  }
  const ready =
    !busy &&
    !quote.loading &&
    !quote.error &&
    !!quote.data &&
    !!requestKey &&
    quotedPayload === body;
  const rooms = quote.data?.pricing.rooms ?? [];
  if (completed)
    return (
      <section className="book-card" aria-labelledby="done-heading">
        <h2 id="done-heading">You&rsquo;ve already booked this stay.</h2>
        <p>
          Booking {completed} is confirmed. Going back doesn&rsquo;t book it
          again.
        </p>
        <p className="stay-actions">
          <Link className="book-button primary" href={"/booking/" + completed}>
            View your booking
          </Link>
          <Link className="book-button" href="/book">
            Book another stay
          </Link>
        </p>
      </section>
    );
  if (roomIds.length === 0)
    return (
      <section className="book-card" aria-labelledby="no-room-heading">
        <h2 id="no-room-heading">Choose a room first.</h2>
        <p>
          This step needs a room. Pick one for {formatDate(search.arrival)} –{" "}
          {formatDate(search.departure)}.
        </p>
        <Link
          className="book-button primary"
          href={"/book/rooms?" + searchQuery(search)}
        >
          Choose a room
        </Link>
      </section>
    );
  return (
    <div className="book-details">
      <section className="book-card" aria-labelledby="stay-heading">
        <h2 id="stay-heading">Your stay</h2>
        <dl className="book-stay">
          <div>
            <dt>Dates</dt>
            <dd>
              {formatDate(search.arrival)} – {formatDate(search.departure)} ·{" "}
              {nights(search)} nights
            </dd>
          </div>
          <div>
            <dt>Guests</dt>
            <dd>
              {search.adults} adult{search.adults === 1 ? "" : "s"}
              {search.children ? `, ${search.children} children` : ""}
            </dd>
          </div>
          <div>
            <dt>Room{rooms.length > 1 ? "s" : ""}</dt>
            <dd>
              {rooms.length
                ? rooms
                    .map((room) => `${room.name} (no. ${room.number})`)
                    .join(", ")
                : "…"}
            </dd>
          </div>
        </dl>
        <p className="book-change-links">
          <Link href={"/book?" + searchQuery(search)}>Change dates</Link>
          <Link href={"/book/rooms?" + searchQuery(search)}>Change room</Link>
        </p>
      </section>
      <Feedback error={quote.error} loading={quote.loading && !quote.data} />
      {quote.error && (
        <Link
          className="book-button"
          href={"/book/rooms?" + searchQuery(search)}
        >
          Choose another room
        </Link>
      )}
      {quote.data && (
        <PriceSummary
          pricing={quote.data.pricing}
          currency={quote.data.currency}
        />
      )}
      <form className="book-form" onSubmit={confirm}>
        <fieldset className="book-card">
          <legend>Your details</legend>
          <p className="book-help">
            No account needed. We use your email only to show and manage this
            demo booking.
          </p>
          <div className="book-field">
            <label htmlFor="guest-name">Full name</label>
            <input
              id="guest-name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="book-field">
            <label htmlFor="guest-email">Email address</label>
            <input
              id="guest-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </div>
          <div className="book-field">
            <label htmlFor="guest-phone">
              Phone <span className="book-optional">(optional)</span>
            </label>
            <input
              id="guest-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
            />
          </div>
          <div className="book-field">
            <label htmlFor="guest-requests">
              Special requests <span className="book-optional">(optional)</span>
            </label>
            <textarea id="guest-requests" name="requests" maxLength={2000} />
          </div>
        </fieldset>
        <details className="book-card book-extras">
          <summary>
            Add optional experiences{" "}
            <span className="book-optional">
              {extras.length
                ? `(${extras.length} added)`
                : "(not covered by the voucher)"}
            </span>
          </summary>
          {EXTRAS.map((item) => (
            <div className="book-extra" key={item.id}>
              <div>
                <p className="book-extra-name">{item.name}</p>
                <p className="book-help">
                  {money(item.price, quote.data?.currency)} {item.unit} ·{" "}
                  {item.status === "pending-approval"
                    ? "request only, not charged now"
                    : "added to the simulated total"}
                </p>
              </div>
              <Counter
                label={item.name}
                name={"extra-" + item.id}
                value={
                  extras.find((extra) => extra.id === item.id)?.quantity || 0
                }
                min={0}
                max={20}
                onChange={(value) => setExtra(item.id, value)}
              />
            </div>
          ))}
        </details>
        <div className="book-card book-payment">
          <p>
            <strong>Demo payment — nothing is charged.</strong> We never ask for
            card details.
          </p>
          {canCancelOnline(search.arrival) ? (
            <p>
              Free online cancellation until{" "}
              <strong>{formatDate(cancelOnlineUntil(search.arrival))}</strong>.
            </p>
          ) : (
            <p className="book-short-notice">
              <strong>Short-notice stay:</strong> online cancellation is not
              available for arrival on {formatDate(search.arrival)}. To cancel,
              ask the front desk (<Link href="/contact">Contact</Link>).
            </p>
          )}
          <label className="book-check">
            <input name="consent" type="checkbox" required />
            <span>
              I understand this is a simulated booking and agree to the demo
              cancellation policy and to storing these details for the
              demonstration.
            </span>
          </label>
        </div>
        {voucherLost && (
          <div ref={alert} className="book-error" role="alert" tabIndex={-1}>
            <p>
              <strong>Your voucher couldn&rsquo;t be applied.</strong>{" "}
              {voucherLost}
            </p>
            <p>
              Nothing has been booked or charged. The price above is now the
              standard demo rate
              {quote.data
                ? ` (${money(quote.data.pricing.total, quote.data.currency)})`
                : ""}
              . To book at that price, tap Confirm again.
            </p>
            <p className="book-change-links">
              <Link href={"/book/rooms?" + searchQuery(search)}>
                Choose a different room
              </Link>
              <Link href="/">Back to home</Link>
            </p>
          </div>
        )}
        {error && (
          <div
            ref={voucherLost ? undefined : alert}
            className="book-error"
            role="alert"
            tabIndex={-1}
          >
            <p>{error}</p>
            {/room|reserved|available/i.test(error) && (
              <>
                <p>Nothing has been booked or charged.</p>
                <Link href={"/book/rooms?" + searchQuery(search)}>
                  Choose another room
                </Link>
              </>
            )}
          </div>
        )}
        <div className="book-actionbar sticky">
          <p>
            {quote.data
              ? `Amount due: ${money(quote.data.pricing.total, quote.data.currency)}`
              : "Calculating price…"}
          </p>
          <button
            className="book-button primary"
            type="submit"
            disabled={!ready}
          >
            {busy
              ? "Confirming…"
              : quote.data && ready
                ? `Confirm demo reservation · ${money(quote.data.pricing.total, quote.data.currency)}`
                : "Confirm demo reservation"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function PriceSummary({
  pricing,
  currency,
  title = "Price breakdown",
}: {
  pricing: Pricing;
  currency: string;
  title?: string;
}) {
  const voucher = pricing.voucher;
  const coveredRoom = voucher
    ? pricing.rooms.find((room) => room.id === voucher.roomId)
    : undefined;
  return (
    <section className="book-card book-price" aria-label={title}>
      <h2>{title}</h2>
      <dl>
        {pricing.rooms.map((room) => (
          <div key={room.id}>
            <dt>
              {room.name} · room {room.number}
              <span>
                {room.nights} night{room.nights === 1 ? "" : "s"} ×{" "}
                {money(room.rate, currency)}
              </span>
            </dt>
            <dd>{money(room.subtotal, currency)}</dd>
          </div>
        ))}
        {voucher && (
          <div className="book-price-voucher">
            <dt>
              Demo voucher
              <span>
                {voucher.coveredNights} night
                {voucher.coveredNights === 1 ? "" : "s"} at the Essential rate (
                {money(voucher.allowancePerNight, currency)})
              </span>
            </dt>
            <dd>−{money(voucher.discount, currency)}</dd>
          </div>
        )}
        {pricing.extras.map((extra) => (
          <div key={extra.id}>
            <dt>
              {extra.name} × {extra.quantity}
              <span>
                {extra.status === "pending-approval"
                  ? "Request only — not included in the total"
                  : "Optional extra"}
              </span>
            </dt>
            <dd>
              {extra.status === "pending-approval" ? (
                <s>{money(extra.subtotal, currency)}</s>
              ) : (
                money(extra.subtotal, currency)
              )}
            </dd>
          </div>
        ))}
        {pricing.tax > 0 && (
          <div>
            <dt>Tax (recorded before rates became tax-inclusive)</dt>
            <dd>{money(pricing.tax, currency)}</dd>
          </div>
        )}
        <div className="book-price-total">
          <dt>Simulated amount due</dt>
          <dd>{money(pricing.total, currency)}</dd>
        </div>
      </dl>
      {voucher && (
        <ul className="book-price-notes">
          {voucher.upgradePerNight > 0 && coveredRoom && (
            <li>
              {coveredRoom.name} upgrade:{" "}
              {money(voucher.upgradePerNight, currency)} per night above the
              Essential rate on all {coveredRoom.nights} nights.
            </li>
          )}
          {voucher.extraNights > 0 && (
            <li>
              {voucher.extraNights} night{voucher.extraNights === 1 ? "" : "s"}{" "}
              beyond the voucher {voucher.extraNights === 1 ? "is" : "are"}{" "}
              charged at the room rate.
            </li>
          )}
          {voucher.unusedNights > 0 && (
            <li>
              {voucher.unusedNights} voucher night
              {voucher.unusedNights === 1 ? "" : "s"} unused. Unused nights have
              no cash value and cannot be saved for later.
            </li>
          )}
          {pricing.rooms.length > 1 && (
            <li>
              The voucher covers one room; other rooms are charged in full.
            </li>
          )}
        </ul>
      )}
      <p className="book-help">
        Rates include taxes. Sample prices in {currency}; no real charge.
      </p>
    </section>
  );
}
