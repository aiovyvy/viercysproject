import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation, Footer, Photo } from "../../experience";
import { photos } from "../../data";
const previews = {
  boracay: {
    name: "Boracay",
    country: "Philippines",
    image: photos.boracay,
    description:
      "White sand, warm water and a gentler island rhythm. A future chapter of the VIERCYS collection, inspired by the Philippine coast.",
  },
  amalfi: {
    name: "Amalfi",
    country: "Italy",
    image: photos.amalfi,
    description:
      "Coastal terraces, sun-warmed stone and the blue Mediterranean. Our Italian destination remains a concept in development.",
  },
  bali: {
    name: "Bali",
    country: "Indonesia",
    image: photos.bali,
    description:
      "Tropical greenery, considered spaces and time to reconnect. A future island sanctuary, imagined through the VIERCYS philosophy.",
  },
};
export default async function Preview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(slug in previews)) notFound();
  const destination = previews[slug as keyof typeof previews];
  return (
    <>
      <Navigation />
      <main id="main" className="inner-main">
        <p className="eyebrow">{destination.country} / Coming soon</p>
        <h1>
          {destination.name}.<br />
          <em>A horizon ahead.</em>
        </h1>
        <p className="lead">{destination.description}</p>
        <div className="property-banner">
          <Photo
            src={destination.image}
            alt={`${destination.name} destination inspiration`}
            priority
          />
        </div>
        <div className="notice">
          <h2>A preview of what may come.</h2>
          <p>
            This destination is not open for reservations. There is no seeded
            room inventory or opening date. These photographs illustrate a
            destination concept, not a real VIERCYS property.
          </p>
        </div>
        <Link className="text-link" href="/destinations">
          Back to the collection ↗
        </Link>
        <Link className="text-link" href="/book">
          Search our Santorini demo inventory ↗
        </Link>
      </main>
      <Footer />
    </>
  );
}
