import type { CategoryId } from "@/lib/catalog";
import type { StoryChapter } from "@/components/editorial/ScrollStory";

/**
 * Editorial presentation for the room detail pages. Facts (size, view,
 * capacity, amenities, rate) always come from CATEGORIES in catalog.ts; this
 * file only adds photography, mood and storytelling.
 *
 * Every photograph is a licensed image of Santorini, Greece used for
 * atmosphere. None depicts the fictional VIERCYS property, so captions describe
 * the setting rather than claiming to show the room. Sources: README.md.
 */
export type Photo = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  /** CSS object-position used when the photo is cropped. */
  focus?: string;
};

const PHOTOS = {
  courtyardDoor: {
    src: "/images/santorini/courtyard-door.jpg",
    alt: "Whitewashed courtyard wall with a blue-shuttered window and gate beneath a church dome",
    caption: "A courtyard in Firostefani, Santorini",
    credit: "Winniepix, CC BY 2.0",
    focus: "50% 60%",
  },
  whiteStair: {
    src: "/images/santorini/white-stair.jpg",
    alt: "Sculpted white stair descending between curved walls toward the caldera",
    caption: "Whitewashed steps toward the caldera",
    credit: "Klearchos Kapoutsis, CC BY 2.0",
    focus: "50% 65%",
  },
  stoneDoor: {
    src: "/images/santorini/stone-door.jpg",
    alt: "Weathered stone doorway with a red timber door and worn steps",
    caption: "Volcanic stone and lime plaster, Santorini",
    credit: "Klearchos Kapoutsis, CC BY 2.0",
    focus: "50% 55%",
  },
  chapelArch: {
    src: "/images/santorini/chapel-arch.jpg",
    alt: "White chapel facade with an arched blue-trimmed doorway",
    caption: "An island chapel's arched threshold",
    credit: "rawpixel, CC0",
    focus: "50% 70%",
  },
  parasols: {
    src: "/images/santorini/parasols.jpg",
    alt: "Striped parasols above white terrace walls against a deep blue sky",
    caption: "Terrace parasols against the Aegean sky",
    credit: "Klearchos Kapoutsis, CC BY 2.0",
    focus: "50% 50%",
  },
  seaTerrace: {
    src: "/images/santorini/sea-terrace.jpg",
    alt: "White terrace with linen sofas, potted olive trees and a wide sea view",
    caption: "A caldera-facing terrace, Santorini",
    credit: "rawpixel, CC0",
    focus: "50% 60%",
  },
  calderaTable: {
    src: "/images/santorini/caldera-table.jpg",
    alt: "A small table and two chairs on a terrace above the caldera at dusk",
    caption: "A table for two above the caldera",
    credit: "Klearchos Kapoutsis, CC BY 2.0",
    focus: "50% 62%",
  },
  cliffPools: {
    src: "/images/santorini/cliff-pools.jpg",
    alt: "Terraces stepping down the cliff edge toward a deep blue Aegean",
    caption: "Cliff-edge terraces above the Aegean",
    credit: "rawpixel, CC0",
    focus: "50% 70%",
  },
  oiaSunset: {
    src: "/images/santorini/oia-sunset.jpg",
    alt: "Oia's white houses and windmills glowing at sunset above the sea",
    caption: "Sunset over Oia, Santorini",
    credit: "kuhnmi, CC BY 2.0",
    focus: "60% 55%",
  },
  oiaEvening: {
    src: "/images/santorini/oia-evening.jpg",
    alt: "The sun setting over the Aegean beside the cliffside village of Oia",
    caption: "The last light over the Aegean",
    credit: "kuhnmi, CC BY 2.0",
    focus: "45% 50%",
  },
  calderaDusk: {
    src: "/images/santorini/caldera-dusk.jpg",
    alt: "The caldera at dusk with a tall ship crossing the water below the cliffs",
    caption: "The caldera at dusk from Imerovigli",
    credit: "Sgroey, CC BY 4.0",
    focus: "40% 50%",
  },
  calderaPool: {
    src: "/images/santorini/caldera-pool.jpg",
    alt: "An infinity edge on a caldera terrace with the cliffs of Imerovigli beyond",
    caption: "The caldera edge at Imerovigli",
    credit: "rawpixel, CC0",
    focus: "50% 60%",
  },
} satisfies Record<string, Photo>;


export type RoomEditorial = {
  /** Hero composition: an arched portrait beside the copy, or full-bleed. */
  hero: "arch" | "panorama" | "horizon";
  heroPhoto: Photo;
  mood: string;
  /** One-line hook used in comparisons and related-room cards. */
  hook: string;
  statement: string;
  atmosphere: string[];
  gallery: Photo[];
  chapters: StoryChapter[];
  bestFor: string;
};

export const ROOM_EDITORIAL: Record<CategoryId, RoomEditorial> = {
  essential: {
    hero: "arch",
    heroPhoto: PHOTOS.courtyardDoor,
    mood: "Morning light · Courtyard calm",
    hook: "Intimate, sunlit and wrapped around a quiet courtyard.",
    statement:
      "A small room that feels like a secret: thick limestone walls, cool floors and a courtyard that holds the morning sun.",
    atmosphere: [
      "The Essential Room is our most personal space. Everything is close at hand and nothing is superfluous. A queen bed, a rain shower and a terrace that opens onto the courtyard.",
      "Mornings start slowly here. Coffee on the terrace, the sound of the village waking beyond the walls, and the day's plans made at whatever pace you choose.",
    ],
    gallery: [
      PHOTOS.courtyardDoor,
      PHOTOS.whiteStair,
      PHOTOS.stoneDoor,
      PHOTOS.chapelArch,
      PHOTOS.parasols,
    ],
    chapters: [
      {
        title: "Walls that keep the island's rhythm",
        body: "Lime-washed stone stays cool through the afternoon heat and warm into the evening, the way island houses have always been built.",
        photo: PHOTOS.stoneDoor,
      },
      {
        title: "A courtyard of your own pace",
        body: "Your terrace opens onto the courtyard rather than the cliff edge. It is a sheltered, private-feeling place to read, rest or plan the day.",
        photo: PHOTOS.courtyardDoor,
      },
      {
        title: "The island beyond the walls",
        body: "Step out of the courtyard and Santorini opens up: whitewashed lanes, stone stairways and the caldera beyond.",
        photo: PHOTOS.whiteStair,
      },
    ],
    bestFor: "Couples and solo travellers who spend their days exploring.",
  },
  signature: {
    hero: "horizon",
    heroPhoto: PHOTOS.parasols,
    mood: "Aegean blue · Terrace living",
    hook: "Generous living space with its own terrace facing the sea.",
    statement:
      "Room to breathe, and a terrace that turns the Aegean into the main living room.",
    atmosphere: [
      "The Signature Suite gives you nearly twice the space of an Essential Room. There is a king bed, a sofa bed for a third guest and a sea terrace that becomes the centre of the day.",
      "Breakfast in the shade, an afternoon with a book, the slow change of blues as the light moves across the water. The suite is designed to be lived in, not just slept in.",
    ],
    gallery: [
      PHOTOS.parasols,
      PHOTOS.seaTerrace,
      PHOTOS.calderaTable,
      PHOTOS.cliffPools,
      PHOTOS.whiteStair,
    ],
    chapters: [
      {
        title: "A terrace that faces the sea",
        body: "The suite's sea terrace looks out across the Aegean, so the horizon is the first and last thing you see each day.",
        photo: PHOTOS.seaTerrace,
      },
      {
        title: "Space for three",
        body: "A king bed and a sofa bed mean a friend, or a child, can join without anyone feeling squeezed.",
        photo: PHOTOS.parasols,
      },
      {
        title: "Evenings outdoors",
        body: "As the heat fades, the terrace becomes a dining room for two. Simple, quiet and entirely yours.",
        photo: PHOTOS.calderaTable,
      },
    ],
    bestFor: "Couples who want space, or a small group of three.",
  },
  grand: {
    hero: "panorama",
    heroPhoto: PHOTOS.oiaSunset,
    mood: "Golden hour · Panoramic sea",
    hook: "Our most spacious sanctuary, with a panoramic sea view.",
    statement:
      "Sixty-eight square metres and a panoramic sea view: a place to gather, or to disappear.",
    atmosphere: [
      "The Grand Sanctuary is our largest room. A king bed and twin beds sleep up to four, and a lounge gives everyone a place to be together or apart.",
      "Its private terrace takes in the full sweep of the sea, at its most beautiful when the sun drops toward the horizon and the whitewash turns gold.",
    ],
    gallery: [
      PHOTOS.oiaSunset,
      PHOTOS.calderaDusk,
      PHOTOS.oiaEvening,
      PHOTOS.calderaPool,
      PHOTOS.seaTerrace,
    ],
    chapters: [
      {
        title: "The whole horizon",
        body: "A panoramic sea view frames the private terrace, so the sunset belongs to you rather than to a crowd.",
        photo: PHOTOS.oiaEvening,
      },
      {
        title: "A lounge for gathering",
        body: "A lounge alongside the sleeping area gives families and friends room to share an evening together.",
        photo: PHOTOS.calderaDusk,
      },
      {
        title: "Considered for four",
        body: "A king bed and twin beds mean four guests sleep well, with space left over for slow mornings.",
        photo: PHOTOS.calderaPool,
      },
    ],
    bestFor: "Families and friends travelling together, up to four guests.",
  },
};

/** Groups the real catalog amenities so they read as considered details. */
export const AMENITY_GROUPS: {
  title: string;
  icon: AmenityIcon;
  items: string[];
}[] = [
  {
    title: "Sleep",
    icon: "bed",
    items: ["Queen bed", "King bed", "Twin beds", "Sofa bed"],
  },
  {
    title: "Outdoors & views",
    icon: "terrace",
    items: ["Courtyard terrace", "Sea terrace", "Private terrace", "Sea view"],
  },
  { title: "Living", icon: "lounge", items: ["Lounge"] },
  { title: "Bathing", icon: "shower", items: ["Rain shower"] },
  {
    title: "Comfort",
    icon: "climate",
    items: ["Air conditioning", "Wi-Fi"],
  },
];

export type AmenityIcon = "bed" | "terrace" | "lounge" | "shower" | "climate";
