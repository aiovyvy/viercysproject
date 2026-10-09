export const CATEGORIES = [
  {
    id: "essential",
    name: "Essential Room",
    tier: "Economy",
    capacity: 2,
    inventory: 10,
    rate: 18000,
    size: 24,
    view: "Courtyard",
    description: "An intimate limestone retreat for unhurried island mornings.",
    amenities: [
      "Queen bed",
      "Rain shower",
      "Wi-Fi",
      "Air conditioning",
      "Courtyard terrace",
    ],
    photo: "/images/santorini/courtyard-door.jpg",
  },
  {
    id: "signature",
    name: "Signature Suite",
    tier: "Deluxe",
    capacity: 3,
    inventory: 6,
    rate: 32000,
    size: 42,
    view: "Aegean sea",
    description: "Generous living space and a terrace facing the Aegean.",
    amenities: [
      "King bed",
      "Sofa bed",
      "Sea terrace",
      "Rain shower",
      "Wi-Fi",
      "Air conditioning",
    ],
    photo: "/images/santorini/parasols.jpg",
  },
  {
    id: "grand",
    name: "Grand Sanctuary",
    tier: "VIP",
    capacity: 4,
    inventory: 4,
    rate: 52000,
    size: 68,
    view: "Panoramic sea",
    description:
      "Our most spacious sanctuary, designed for a considered escape.",
    amenities: [
      "King bed",
      "Twin beds",
      "Private terrace",
      "Sea view",
      "Lounge",
      "Wi-Fi",
      "Air conditioning",
    ],
    photo: "/images/santorini/oia-sunset.jpg",
  },
] as const;
export const EXTRAS = [
  {
    id: "dinner",
    name: "Romantic dinner",
    price: 14000,
    status: "pending-approval",
    unit: "per couple",
  },
  {
    id: "sailing",
    name: "Sunset sailing",
    price: 9000,
    status: "pending-approval",
    unit: "per guest",
  },
  {
    id: "spa",
    name: "Spa ritual",
    price: 8500,
    status: "pending-approval",
    unit: "per guest",
  },
  {
    id: "breakfast",
    name: "Breakfast",
    price: 2200,
    status: "confirmed-demo",
    unit: "per guest per morning",
  },
  {
    id: "transfer",
    name: "Airport transfer",
    price: 6000,
    status: "confirmed-demo",
    unit: "per vehicle, up to 4 guests",
  },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type Room = {
  id: string;
  number: string;
  category: CategoryId;
  capacity: number;
  rate: number;
  operational: string;
};
export type ExtraSelection = { id: string; quantity: number };
export const CURRENCY = process.env.NEXT_PUBLIC_DEMO_CURRENCY || "EUR";
export function money(cents: number, currency = CURRENCY) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(
    cents / 100,
  );
}
export function category(id: string) {
  return CATEGORIES.find((item) => item.id === id);
}
