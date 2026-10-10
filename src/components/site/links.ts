/**
 * Site map shared by the header menu and the footer, so both always offer
 * the same pages. `footer` overrides the label where the footer is terser.
 */
export type SiteLink = { label: string; href: string; footer?: string };

export const NAV_GROUPS: { title: string; links: SiteLink[] }[] = [
  {
    title: "Stay",
    links: [
      { label: "Rooms & Suites", href: "/rooms" },
      { label: "Destinations", href: "/destinations" },
      { label: "Experiences", href: "/experiences" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Our Philosophy", href: "/philosophy" },
      { label: "About VIERCYS", href: "/about", footer: "About" },
      { label: "Santorini", href: "/santorini" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Concierge", href: "/concierge" },
    ],
  },
  {
    title: "Your stay",
    links: [
      { label: "My VIERCYS", href: "/my-stay" },
      { label: "Find my booking", href: "/lookup" },
    ],
  },
];

/** Shown inline in the desktop header; everything else sits under More. */
export const PRIMARY_LINKS = ["/rooms", "/destinations", "/experiences", "/philosophy"];

export const LEGAL_LINKS: SiteLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Photo credits", href: "/credits" },
];
