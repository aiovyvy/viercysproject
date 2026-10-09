import Link from "next/link";
import { Navigation, Footer, Photo } from "../experience";
import { photos } from "../data";
import { CATEGORIES, money } from "@/lib/catalog";
export default function Santorini() {
  return (
    <>
      <Navigation />
      <main id="main" className="inner-main">
        <p className="eyebrow">GREECE / OUR FIRST ADDRESS</p>
        <h1>
          Santorini.
          <br />
          <em>A slower kind of beautiful.</em>
        </h1>
        <p className="lead">
          An imagined retreat where pale limestone meets the Aegean. Twenty
          intimate spaces, one considered philosophy: give every moment room to
          breathe.
        </p>
        <Link className="closing-cta" href="/book">
          Book your stay <span>↗</span>
        </Link>
        <div className="property-banner">
          <Photo
            src={photos.hero}
            alt="Santorini whitewashed terraces overlooking the Aegean"
            priority
          />
        </div>
        <div className="category-list">
          {CATEGORIES.map((room) => (
            <article key={room.id}>
              <p className="eyebrow">
                {room.inventory} PHYSICAL ROOMS / {room.tier}
              </p>
              <h2>{room.name}</h2>
              <p>
                {room.description}
                <br />
                {room.size} m² · {room.view} · Up to {room.capacity} guests
                <br />
                Sample rate {money(room.rate)} per night before 13% tax.
              </p>
              <Link className="text-link" href={"/rooms/" + room.id}>
                Explore this room category ↗
              </Link>
            </article>
          ))}
        </div>
        <div className="notice">
          <h2>A concept you can explore.</h2>
          <p>
            VIERCYS is a fictional hotel. The local demo stores exactly 20
            unique rooms and checks availability before saving simulated
            reservations. Category features and rates are illustrative;
            temporary editorial photographs do not depict an operating VIERCYS
            property.
          </p>
          <p>
            Every child counts toward capacity. Up to five rooms can be
            allocated to a booking, with at least one adult in each. Online
            cancellation until two calendar days before arrival; payments and
            refunds are simulated.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
