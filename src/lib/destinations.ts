/**
 * The VIERCYS collection. Only Santorini has rooms and can be booked; the
 * others are concepts with no inventory or opening date. Photographs show
 * each real place, never a VIERCYS property (credits in README.md).
 */
export type Destination = {
  slug: string;
  name: string;
  country: string;
  region: string;
  coordinates: string;
  bookable: boolean;
  line: string;
  description: string;
  photo: { src: string; alt: string; caption: string; credit: string };
};

export const DESTINATIONS: Destination[] = [
  {
    slug: "santorini",
    name: "Santorini",
    country: "Greece",
    region: "Cyclades · Aegean Sea",
    coordinates: "36.4° N · 25.4° E",
    bookable: true,
    line: "Where the sea fills a volcano.",
    description:
      "The island curves around a flooded caldera. Whitewashed villages line its rim, and every evening the cliffs turn gold above the water. Our first address: twenty rooms in three types.",
    photo: {
      src: "/images/santorini/fira-sunset.jpg",
      alt: "The sun setting over the caldera, seen from Fira",
      caption: "Sunset over the caldera from Fira",
      credit: "Alexandros, CC BY 3.0",
    },
  },
  {
    slug: "boracay",
    name: "Boracay",
    country: "Philippines",
    region: "Western Visayas · Sibuyan Sea",
    coordinates: "11.9° N · 121.9° E",
    bookable: false,
    line: "White sand and a gentler rhythm.",
    description:
      "Powder-white sand, warm water and a slower island pace. A future chapter of the VIERCYS collection, inspired by the Philippine coast.",
    photo: {
      src: "/images/destinations/boracay.jpg",
      alt: "A thatched beach umbrella on Boracay's white sand beside turquoise water",
      caption: "White Beach, Boracay",
      credit: "Angelo Juan Ramos, CC BY 2.0",
    },
  },
  {
    slug: "amalfi",
    name: "Amalfi",
    country: "Italy",
    region: "Campania · Tyrrhenian Sea",
    coordinates: "40.6° N · 14.6° E",
    bookable: false,
    line: "Terraces stacked above the sea.",
    description:
      "Coastal terraces, sun-warmed stone and the blue Mediterranean. Our Italian destination remains a concept in development.",
    photo: {
      src: "/images/destinations/amalfi.jpg",
      alt: "Positano's hillside houses lit at dusk above the sea",
      caption: "Positano on the Amalfi Coast at dusk",
      credit: "JeCCo, CC BY 4.0",
    },
  },
  {
    slug: "bali",
    name: "Bali",
    country: "Indonesia",
    region: "Lesser Sunda Islands · Indian Ocean",
    coordinates: "8.5° S · 115.3° E",
    bookable: false,
    line: "Green terraces and quiet ritual.",
    description:
      "Tropical greenery, considered spaces and time to reconnect. A future island sanctuary, imagined through the VIERCYS philosophy.",
    photo: {
      src: "/images/destinations/bali.jpg",
      alt: "Layered green rice terraces and palms near Ubud, Bali",
      caption: "Rice terraces near Ubud, Bali",
      credit: "Vyacheslav Argenberg, CC BY 4.0",
    },
  },
];

export function destination(slug: string) {
  return DESTINATIONS.find((item) => item.slug === slug);
}
