# Milestone 2: Homepage composition, cinematic interactions, final invitation

Branch `ux-rebuild` (base commit `58eac78`, uncommitted M1 + M2 changes).
Before: `before-home-*`. After: `after-home-*` and the `*-sheet.png` contact sheets.
All screenshots come from the same dev server on :3000.

## The homepage as one day on the island

| # | Section | Light | Treatment |
| --- | --- | --- | --- |
| 1 | Arrival (hero) | Day | Photo opens out of an arch on load; huge editorial headline; Book a stay + Explore rooms; full-width date bar straight to room choice (desktop) |
| 2 | Arch passage | Day | Existing scroll-scrubbed WebGL/2.5D journey kept; its last frame is now a caldera terrace instead of the living room |
| 3 | Plan your stay | Limestone | Three numbered steps beside a date form card; guided booking link for first-timers; honest invitation/simulation note |
| 4 | Philosophy (#story) | Ivory | Asymmetric editorial: statement, three stepped principles, two layered photos drifting at different scroll speeds |
| 5 | Rooms & suites | Ivory | Three arch "slats", one per category. The chosen one opens wide and the rest stay slim. ARIA tabs (arrow/Home/End), hover preview on desktop, vertical accordion on phones. Facts read from the catalog |
| 6 | Destination | Deep Aegean | Santorini spotlight (arched sunset photo zooms as it scrolls); "Next horizons" shows Boracay, Amalfi and Bali greyscale and clearly not bookable, and they colour on hover |
| 7 | Experiences | Ivory | Editorial list from the real extras (prices, units, instant vs. confirmed-by-team); a pinned photo changes as you hover each row; inline photos on phones |
| 8 | Final invitation | Blue hour | Pinned full-screen Oia at blue hour that opens out of an arch on arrival; large headline, Book a stay + Explore rooms & suites, three reassurance facts, simulation disclosure |

Booking is reachable from the header, the hero (two ways), the phone quick-book bar, the plan section, every room panel and the finale.

## Removed

- The generic living-room photo (`public/images/suite.jpg` deleted). It no longer appears anywhere.
- `SuitePreview` and its labels "Editorial stock photography", "Nightly demo rate" and "Physical inventory".
- The pinned horizontal destinations gallery, which left near-empty screens on desktop.

## Motion and accessibility

- Scroll-linked effects use CSS `animation-timeline` (progressive enhancement). Browsers without it get the static layout.
- `prefers-reduced-motion`: no entrance, parallax, arch reveals, pinning or crossfades. The journey uses its existing static mode.
- GSAP drives only the hero's scroll fade. CSS entrance animations sit on child elements, so the two never fight over one element (see the hero regression test in `tests/home.spec.ts`).

## New photography (credited in README.md)

`blue-hour.jpg` (kuhnmi, CC BY 2.0), `fira-sunset.jpg` (Alexandros, CC BY 3.0), `sailing.jpg` (rawpixel, CC0).

## Known limits

- Boracay, Amalfi and Bali still use the older stock images (sandcastle, beach umbrellas). They are slated for the Destinations work in Milestone 3.
- Spa ritual uses a cliff-terrace image; a spa or treatment-room image should be supplied.
