import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Navigation, Footer } from "@/app/experience";
import { CATEGORIES, category, money } from "@/lib/catalog";
import {
  POLICY,
  VOUCHER,
  addDays,
  formatDate,
  nights,
  propertyToday,
  searchFrom,
  searchQuery,
  validateSearch,
} from "@/lib/policy";
import { available } from "@/lib/booking";
import { AMENITY_GROUPS, ROOM_EDITORIAL } from "@/lib/rooms-editorial";
import { RoomGallery } from "@/components/room/RoomGallery";
import { ScrollStory } from "@/components/editorial/ScrollStory";
import { RoomCompare } from "@/components/editorial/RoomCompare";
import { RoomDock } from "@/components/room/RoomDock";
import { AmenityIcon } from "@/components/room/AmenityIcon";
import styles from "@/components/room/room.module.css";
export async function generateMetadata({
  params,
}: {
  params: Promise<{
    category: string;
  }>;
}) {
  const room = category((await params).category);
  return {
    title: room
      ? `${room.name} | VIERCYS Santorini`
      : "Room not found | VIERCYS",
    description: room?.description,
  };
}
export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const id = (await params).category;
  const room = category(id);
  if (!room) notFound();
  const editorial = ROOM_EDITORIAL[room.id];
  const search = searchFrom(await searchParams);
  const query = searchQuery(search);
  const error = validateSearch(search);
  const free = error
    ? []
    : (await available(search)).filter((item) => item.category === room.id);
  const party = search.adults + search.children;
  const fits = room.capacity * search.rooms >= party;
  const stay = error ? 0 : nights(search);
  const bookable = !error && fits && free.length >= search.rooms;
  // A clear match goes straight to review with real, currently free rooms;
  // the server re-checks everything there. Otherwise show every option.
  const bookHref = bookable
    ? `/book/details?${query}&roomIds=${free
        .slice(0, search.rooms)
        .map((item) => item.id)
        .join(",")}`
    : error
      ? `/book?${query}`
      : `/book/rooms?${query}`;
  const base = category(VOUCHER.baseCategory)!;
  const upgrade = room.rate - base.rate;
  const today = propertyToday();
  const amenityGroups = AMENITY_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      (room.amenities as readonly string[]).includes(item),
    ),
  })).filter((group) => group.items.length > 0);
  const others = CATEGORIES.filter((item) => item.id !== room.id);
  return (
    <>
      <Navigation />
      <main id="main" className={styles.page} data-tier={room.id}>
        <section
          id="room-hero"
          className={styles.hero}
          data-layout={editorial.hero}
          aria-labelledby="room-title"
        >
          <div className={styles.heroMedia}>
            <Image
              src={editorial.heroPhoto.src}
              alt={editorial.heroPhoto.alt}
              fill
              preload
              sizes={
                editorial.hero === "arch"
                  ? "(max-width: 860px) 100vw, 46vw"
                  : "100vw"
              }
              style={{ objectPosition: editorial.heroPhoto.focus }}
            />
          </div>
          <div className={styles.heroCopy}>
            <nav aria-label="Breadcrumb" className={styles.crumbs}>
              <Link href={`/rooms?${query}`}>Rooms &amp; Suites</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{room.name}</span>
            </nav>
            <p className={styles.mood}>{editorial.mood}</p>
            <h1 id="room-title">{room.name}</h1>
            <p className={styles.heroLead}>{room.description}</p>
            <dl className={styles.facts}>
              <div>
                <dt>Space</dt>
                <dd>{room.size} m²</dd>
              </div>
              <div>
                <dt>View</dt>
                <dd>{room.view}</dd>
              </div>
              <div>
                <dt>Sleeps</dt>
                <dd>Up to {room.capacity}</dd>
              </div>
            </dl>
            <div className={styles.heroActions}>
              <p className={styles.heroRate}>
                <span>From</span> {money(room.rate)}
                <small>per night, taxes included</small>
              </p>
              <a className={styles.primary} href="#reserve">
                Book a stay
              </a>
              <a className={styles.ghost} href="#gallery">
                View photographs
              </a>
            </div>
          </div>
        </section>

        <div className={styles.layout}>
          <div className={styles.overview}>
            <section aria-labelledby="atmosphere-title">
              <p className={styles.kicker} id="atmosphere-title">
                The atmosphere
              </p>
              <p className={styles.statement}>{editorial.statement}</p>
              <div className={styles.atmosphere}>
                <figure className={styles.archFigure}>
                  <div className={styles.archReveal}>
                    <Image
                      src={editorial.gallery[1].src}
                      alt={editorial.gallery[1].alt}
                      fill
                      sizes="(max-width: 860px) 80vw, 28vw"
                      style={{ objectPosition: editorial.gallery[1].focus }}
                    />
                  </div>
                  <figcaption>{editorial.gallery[1].caption}</figcaption>
                </figure>
                <div className={styles.atmosphereText}>
                  {editorial.atmosphere.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <p className={styles.bestFor}>
                    <strong>Ideal for</strong> {editorial.bestFor}
                  </p>
                </div>
              </div>
            </section>

            <section
              className={styles.amenities}
              aria-labelledby="amenities-title"
            >
              <p className={styles.kicker}>In the room</p>
              <h2 id="amenities-title">Considered details</h2>
              <ul className={styles.amenityGroups}>
                {amenityGroups.map((group) => (
                  <li key={group.title}>
                    <AmenityIcon name={group.icon} />
                    <h3>{group.title}</h3>
                    <p>{group.items.join(" · ")}</p>
                  </li>
                ))}
              </ul>
              <p className={styles.spaceNote}>
                {room.size} m² · {room.view} view · up to {room.capacity}{" "}
                guests, including children · {room.inventory} rooms of this kind
              </p>
            </section>
          </div>

          <aside
            id="reserve"
            className={styles.reserve}
            aria-labelledby="reserve-title"
          >
            <div className={styles.reserveCard}>
              <p className={styles.kicker}>Reserve</p>
              <h2 id="reserve-title">
                {money(room.rate)} <small>/ night</small>
              </h2>
              <p className={styles.reserveSub}>
                Taxes included. Extras are optional.
              </p>
              <form
                method="get"
                action={`/rooms/${room.id}#reserve`}
                className={styles.dates}
              >
                <label>
                  <span>Check-in</span>
                  <input
                    type="date"
                    name="arrival"
                    defaultValue={search.arrival}
                    min={today}
                    max={addDays(today, POLICY.horizonDays)}
                    required
                  />
                </label>
                <label>
                  <span>Check-out</span>
                  <input
                    type="date"
                    name="departure"
                    defaultValue={search.departure}
                    min={addDays(today, 1)}
                    max={addDays(today, POLICY.horizonDays)}
                    required
                  />
                </label>
                <label>
                  <span>Adults</span>
                  <select name="adults" defaultValue={String(search.adults)}>
                    {Array.from({ length: 10 }, (_, n) => n + 1).map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Children</span>
                  <select
                    name="children"
                    defaultValue={String(search.children)}
                  >
                    {Array.from({ length: 9 }, (_, n) => n).map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <input type="hidden" name="rooms" value={search.rooms} />
                <button type="submit" className={styles.check}>
                  Check these dates
                </button>
              </form>
              <div className={styles.result} role="status">
                {error ? (
                  <p className={styles.warn}>{error}</p>
                ) : !fits ? (
                  <p className={styles.warn}>
                    The {room.name} sleeps up to {room.capacity}. For {party}{" "}
                    guests, add a room or compare larger rooms.
                  </p>
                ) : free.length < search.rooms ? (
                  <p className={styles.warn}>
                    {free.length === 0
                      ? `This room is fully booked for ${formatDate(search.arrival)} – ${formatDate(search.departure)}.`
                      : `Only ${free.length} of this room ${free.length === 1 ? "is" : "are"} free on these dates.`}{" "}
                    Try other dates or see every room.
                  </p>
                ) : (
                  <>
                    <p className={styles.available}>
                      <span aria-hidden="true" />
                      Available · {free.length} of {room.inventory} free
                    </p>
                    <p className={styles.total}>
                      {formatDate(search.arrival)} –{" "}
                      {formatDate(search.departure)} · {stay} night
                      {stay === 1 ? "" : "s"}
                      <strong>
                        {money(room.rate * stay * search.rooms)} total
                      </strong>
                    </p>
                  </>
                )}
              </div>
              <Link className={styles.primary} href={bookHref}>
                {bookable ? "Book a stay" : "See all rooms for these dates"}
              </Link>
              <p className={styles.voucher}>
                {upgrade === 0
                  ? "Invited guest? Your three complimentary nights fully cover this room."
                  : `Invited guest? Your three complimentary nights cover the Essential rate. Here you pay only the ${money(upgrade)} nightly difference for those nights.`}
              </p>
              <p className={styles.fine}>
                Free online cancellation until two days before arrival. VIERCYS
                is a fictional hotel for a classroom project: stays and payments
                are simulated and nothing is charged.
              </p>
            </div>
          </aside>
        </div>

        <section
          id="gallery"
          className={styles.gallery}
          aria-labelledby="gallery-title"
        >
          <header className={styles.sectionHead}>
            <p className={styles.kicker}>Photographs</p>
            <h2 id="gallery-title">The mood of the {room.name}</h2>
            <p>
              Photographs of Santorini chosen to show the light, materials and
              views that shape this room. They are not photos of the property
              itself.
            </p>
          </header>
          <RoomGallery photos={editorial.gallery} roomName={room.name} />
        </section>

        <section className={styles.storyBand} aria-labelledby="story-title">
          <header className={styles.sectionHead}>
            <p className={styles.kicker}>Why this room</p>
            <h2 id="story-title">Three reasons to stay</h2>
          </header>
          <ScrollStory chapters={editorial.chapters} />
        </section>

        <section className={styles.compare} aria-labelledby="compare-title">
          <header className={styles.sectionHead}>
            <p className={styles.kicker}>Rooms &amp; Suites</p>
            <h2 id="compare-title">Find the right room</h2>
          </header>
          <RoomCompare current={room.id} query={query} />
          <ul className={styles.related}>
            {others.map((item) => {
              const other = ROOM_EDITORIAL[item.id];
              return (
                <li key={item.id}>
                  <Link
                    href={`/rooms/${item.id}?${query}`}
                    className={styles.relatedCard}
                  >
                    <div className={styles.relatedPhoto}>
                      <Image
                        src={other.heroPhoto.src}
                        alt=""
                        fill
                        sizes="(max-width: 760px) 100vw, 45vw"
                        style={{ objectPosition: other.heroPhoto.focus }}
                      />
                    </div>
                    <div className={styles.relatedBody}>
                      <p className={styles.mood}>{other.mood}</p>
                      <h3>{item.name}</h3>
                      <p>{other.hook}</p>
                      <p className={styles.relatedMeta}>
                        {item.size} m² · sleeps {item.capacity} · from{" "}
                        {money(item.rate)}
                        <span aria-hidden="true">→</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <RoomDock name={room.name} rate={money(room.rate)} />
      <Footer />
    </>
  );
}
