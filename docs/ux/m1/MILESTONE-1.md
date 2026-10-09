# Milestone 1: Room detail redesign and photography

Branch `ux-rebuild`. Before screenshots: base commit `58eac78`, dev server on :3000.
After screenshots: same server, with this milestone's working-tree changes.

## Reference analysis (`/design-references`, art direction only, not used on the site)

| Reference | What makes it work | Where it informs VIERCYS |
| --- | --- | --- |
| 01 cinematic entrance: volcanic-stone arch framing a travertine terrace and sea | Dark arch as foreground frame; warm low sun; stone + teak + linen; deep layered perspective | Arched image frames throughout; homepage arrival (M2) |
| 02 architectural corridor: lit white arch gate at blue hour, sea and pool beyond | Threshold composition; blue/rose dusk vs warm lamplight; olive trees and terracotta | Thresholds as a recurring motif; final booking CTA mood (M2) |
| 03 essential suite: vaulted ivory bedroom, French doors to a plunge pool | Soft vaulted plaster, natural oak, linen; light from one opening | Essential: intimacy, morning light, limestone palette |
| 04 signature suite: cave tunnel framing a turquoise pool and the caldera | Tunnel arch leading the eye to blue; strong centre axis | Signature: Aegean blue, terrace living |
| 05 grand sanctuary: cave lounge at sunset, pool and daybed | Monochrome sand plaster lit gold; generous horizontal space | Grand: golden hour, panoramic composition |
| 06 sunset booking: infinity pool and caldera at sunset | Horizon line, glowing sun, calm loungers | Grand hero; homepage final invitation (M2) |

**Shared language:** arches as frames, one light source, sand/ivory/plaster against Aegean blue, natural materials, and asymmetric compositions with deep perspective.

## Art direction (applied in M1)

- **Type:** Cormorant Garamond for display (editorial, high contrast), Inter for text, labels and forms (17px body). Loaded with `next/font` as `--font-display` / `--font-text`.
- **Palette:** existing ivory `#f3eee5`, limestone `#ebe3d6`, deep Aegean `#17303a`, sand `#c6ad85`. Each tier adds one accent: olive (Essential), Aegean (Signature), bronze (Grand).
- **Shape:** the arch (`border-radius: 999px 999px 0 0`) is the signature motif, used on the hero portrait, the atmosphere image, the first gallery tile and the story frame.
- **Motion:** used only where it adds meaning. The Essential hero opens like an arch; the atmosphere image opens on scroll; the story photo changes with the chapter; the lightbox moves image to image. Reduced motion turns all of this off. Scroll-linked effects are progressive enhancement through CSS `animation-timeline`.

## What changed on the room pages

1. **Hero:** three compositions in one system. Essential has an arched portrait beside the copy on limestone. Signature is a full-bleed Aegean-blue image with copy on the left. Grand is a full-bleed sunset panorama with centred copy. Each shows the name, description, space/view/sleeps, nightly rate and Book a Stay.
2. **Atmosphere:** a statement line, an arch image revealed on scroll, two paragraphs and "Ideal for", all derived from catalog facts.
3. **Considered details:** real catalog amenities grouped into Sleep, Outdoors & views, Living, Bathing and Comfort, with fine-line icons. Nothing added.
4. **Reserve card:** sticky on desktop, inline on phone. Native date and guest form (works without JS). Shows live availability and the stay total. A clear match goes straight to review with real free room IDs; the server re-checks there. If the party doesn't fit or the room is sold out, it explains why and links to all rooms. It also shows an honest voucher note and the fictional/simulated disclosure.
5. **Gallery:** asymmetric arched mosaic opening a full-screen `<dialog>` lightbox with prev/next, arrow keys, swipe, thumbnails, Escape, a counter, and caption plus credit on every photo.
6. **Why this room:** a dark Aegean band with three chapters. On desktop the pinned arched photo changes per chapter; on phones each chapter has its own photo.
7. **Find the right room:** a comparison table (current room highlighted) and two related-room cards that keep the guest's dates.
8. **Phone dock:** the room name, rate and Book a Stay slide in after the hero and step aside while the reserve card is on screen. The generic quick-book bar is hidden on room pages.
9. **Photography:** the generic living room (`suite.jpg`) and the repeated stock trio are gone from room pages and from the booking step's room cards. Twelve licensed Santorini photos (CC BY / CC0) are credited in README.md and in the lightbox.

## Still needed: original VIERCYS imagery

No openly licensed photos of Santorini cave-suite interiors were found, so the room pages use real Santorini architecture and views and say so. To show the rooms themselves, generate or commission these. Keep one consistent light direction per tier, no people, no brand marks.

| Image | Use | Size |
| --- | --- | --- |
| Essential: vaulted limestone bedroom, queen bed in linen, arched window, morning light | Essential hero + gallery | 2400×3000 (4:5) |
| Essential: rain shower in lime plaster niche | Gallery | 2000×1500 |
| Essential: small courtyard terrace, two chairs, bougainvillea | Gallery / story | 2000×2500 |
| Signature: living area with king bed and sofa bed, view through arched doors to sea terrace | Signature hero | 3200×1800 (16:9) |
| Signature: sea terrace with linen loungers and Aegean horizon, midday | Gallery / story | 2400×1600 |
| Grand: lounge in sculpted plaster at golden hour | Grand hero | 3200×1800 |
| Grand: twin-bed room for children/friends | Gallery | 2000×1500 |
| Grand: private terrace at sunset, panoramic sea | Gallery / story | 2400×1600 |

Note: `public/images/rooms/` (untracked, not used anywhere) holds amateur snapshots with no recorded source. Do not use them.

## Not yet in scope (later milestones)

The homepage (`ArchitecturalJourney`, `SuitePreview`) still uses `suite.jpg` and the old typography. That's Milestone 2. Navigation grouping is Milestone 3.
