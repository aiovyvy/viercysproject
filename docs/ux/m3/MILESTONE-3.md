# Milestone 3: Philosophy, About, Destinations, Experiences, Rooms and navigation

Branch `ux-rebuild`. Before: `before-*` (commit `3ae690e`). After: `after-*` and `scroll-*`
(viewport frames captured while scrolling, so scroll-driven states are real).

## One design system

Rooms, homepage and every new page now share the same parts instead of copying them:

| Shared piece | Where | Used by |
| --- | --- | --- |
| Tokens (`--deep`, `--sand`, `--serif`, `--sans`…) | `globals.css` `:root` | everything |
| `ui.module.css` (page type, kicker, buttons, text links, section heads) | `components/editorial` | room, home, all editorial pages (via `composes`) |
| `EditorialHero` (full-bleed or arched) | `components/editorial` | Philosophy, Rooms, Experiences, Destinations, About, Santorini, previews |
| `ScrollStory` (pinned photo that changes per chapter) | `components/editorial` | room pages, Rooms, Philosophy, About, Santorini |
| `ChapterRail` (sticky chapter index + progress) | `components/editorial` | Philosophy, Experiences |
| `SwipeGallery` (scroll-snap carousel, buttons) | `components/editorial` | Experiences |
| `RoomCompare` (catalog-driven table) | `components/editorial` | room pages, Rooms |
| `StaySearch` (native date form) | `components/editorial` | homepage, Rooms |
| `sections.module.css` (bands, closing invitation, fact rows) | `components/editorial` | all editorial pages |
| `SiteHeader` / `SiteFooter` + one site map (`links.ts`) | `components/site` | every page |
| Content: `destinations.ts`, `experiences.ts`, `credits.ts` | `lib` | homepage and pages read the same data |

Removed duplicates: `RoomStory` (now `ScrollStory`), the room-page comparison table, the
homepage's own experience/destination arrays, the old global header/footer code.

## Navigation

- **Desktop (≥1100px):** Rooms & Suites · Destinations · Experiences · Our Philosophy inline, a
  **More** panel (About VIERCYS, Santorini, Contact, FAQ, Concierge, Find my booking, plus a
  Santorini feature), My VIERCYS and Book a stay.
- **Phones/tablets:** a full-screen menu in four groups (Stay, Discover, Help, Your stay),
  Home link, and Book a stay. It fits one screen at 390px and 320px, traps focus, closes with
  Escape (focus returns to the toggle) or Close.
- **Footer:** the same four groups plus Legal (Privacy, Terms, Accessibility, Photo credits)
  and one disclosure line.

## Pages and their scroll storytelling (hover is never required)

| Page | Experience |
| --- | --- |
| **Our Philosophy** (new) | Chapter rail with progress; 1) arch opens to a full-width view; 2) stone and sea panels slide together; 3) the "slow luxury" sentence lights up word by word as it is read; 4) hospitality told through real features in a pinned-photo story; 5) photo pulls back to the horizon; 6) four materials at staggered scroll depths |
| **Rooms & Suites** (new, `/rooms`) | One pinned-photo chapter per room with facts and links; catalog comparison table; date search |
| **Experiences** (new) | "How it works" (instant vs. requests, real rules); one chapter per extra with a swipe/button gallery that unveils from an arch, real price and unit |
| **Destinations** | Index with status; full-screen panels that hold, then stack. Santorini: "Open for booking". Others: "Future destination · Reservations unavailable", no booking button |
| **Destination previews** | Editorial hero, explicit "cannot be booked", rest of the collection |
| **About** | Arched hero, the idea + live numbers from data, "How we host" pinned story, honest "Behind the brand" (what is real vs. simulated) |
| **Santorini** | Island story (accurate general geography), three rooms, practical "Good to know" |
| **Contact, FAQ, Privacy, Terms, Accessibility** | Calm editorial header and one readable column; FAQ accordions; no motion |
| **Photo credits** (new) | Every image with creator and licence |

Motion is CSS scroll timelines plus IntersectionObserver. Without support, or with
`prefers-reduced-motion`, every chapter is static and fully visible (tested).

## Photography

New licensed destination photos: Boracay (Angelo Juan Ramos, CC BY 2.0), Positano/Amalfi
(JeCCo, CC BY 4.0), Ubud/Bali (Vyacheslav Argenberg, CC BY 4.0), olive wood (rawpixel, CC0).
The sandcastle, beach-umbrella and Bali stock images were deleted.

## Honesty

Main pages carry no "demo" labels. The fictional/simulated disclosure appears in the footer,
at the end of each editorial page, on About ("Behind the brand"), on Santorini ("Good to
know"), on destination previews, and in the booking/payment flow (unchanged).
