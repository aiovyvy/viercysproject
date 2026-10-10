import { EXTRAS } from "@/lib/catalog";

/**
 * Editorial stories for the optional extras in catalog.ts. Prices, units and
 * confirmation rules always come from EXTRAS. Extras are added on the review
 * step while booking; requests are confirmed by the team before the stay.
 */
type Story = {
  title: string;
  line: string;
  detail: string;
  photos: { src: string; alt: string }[];
};

const STORIES: Record<(typeof EXTRAS)[number]["id"], Story> = {
  sailing: {
    title: "Sunset sailing",
    line: "Leave the cliffs behind and watch the caldera turn gold from the water.",
    detail:
      "An evening on the water beneath the caldera walls, timed for the hour when the light softens. Priced per guest.",
    photos: [
      {
        src: "/images/santorini/sailing.jpg",
        alt: "A white motor yacht crossing the blue caldera below Santorini's cliffs",
      },
      {
        src: "/images/santorini/caldera-dusk.jpg",
        alt: "A tall ship crossing the caldera at dusk",
      },
    ],
  },
  dinner: {
    title: "A table for two",
    line: "A private dinner set for the hour when the sea goes quiet.",
    detail:
      "A romantic dinner for two, set as the day ends over the Aegean. Priced per couple.",
    photos: [
      {
        src: "/images/santorini/caldera-table.jpg",
        alt: "A small table and two chairs on a terrace above the caldera at dusk",
      },
      {
        src: "/images/santorini/blue-hour.jpg",
        alt: "Oia's cliffside houses lit at blue hour above the Aegean",
      },
    ],
  },
  spa: {
    title: "Spa ritual",
    line: "Warm stone, cool water and an unhurried hour that belongs to you.",
    detail:
      "An hour to slow down completely, for one guest at a time. Priced per guest.",
    photos: [
      {
        src: "/images/santorini/cliff-pools.jpg",
        alt: "Terraces stepping down the cliff edge toward a deep blue Aegean",
      },
      {
        src: "/images/santorini/stone-door.jpg",
        alt: "Weathered stone doorway with a red timber door and worn steps",
      },
    ],
  },
  breakfast: {
    title: "Breakfast in the sun",
    line: "Slow mornings, island produce and the whole horizon for company.",
    detail:
      "Breakfast for each guest, every morning of your stay. Added straight to your booking.",
    photos: [
      {
        src: "/images/santorini/sea-terrace.jpg",
        alt: "White terrace with linen sofas, potted olive trees and a wide sea view",
      },
      {
        src: "/images/santorini/parasols.jpg",
        alt: "Striped parasols above white terrace walls against a deep blue sky",
      },
    ],
  },
  transfer: {
    title: "Airport transfer",
    line: "Arrive without a second thought.",
    detail:
      "A private vehicle between the airport and VIERCYS, for up to four guests. Added straight to your booking.",
    photos: [
      {
        src: "/images/santorini/white-stair.jpg",
        alt: "Sculpted white stair descending between curved walls toward the caldera",
      },
    ],
  },
};

export const EXPERIENCES = EXTRAS.map((extra) => ({
  ...extra,
  ...STORIES[extra.id],
  instant: extra.status !== "pending-approval",
}));

export function confirmation(instant: boolean) {
  return instant
    ? "Added instantly when you book"
    : "Request while booking · our team confirms before your stay";
}
