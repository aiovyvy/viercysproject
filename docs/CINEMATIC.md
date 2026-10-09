# Cinematic architecture implementation

The photographic hero remains. ArchitecturalJourney adds a custom scroll-controlled spatial sequence. (The former SuitePreview was replaced by the homepage RoomsShowcase in Milestone 2.)

## Desktop spatial sequence

On viewports at least 900px wide with a fine pointer and no reduced-motion preference, the architectural section pins for 2.5 viewport heights. GSAP's scrubbed timeline directly controls a perspective camera dolly through two extruded limestone arches. The arch openings are physical geometry, not an empty decorative rectangle. Procedural mineral-grain and bump maps, masonry joints, beveled edges, floor and moving directional sunlight produce depth and shadows. Local architectural photography remains behind the transparent WebGL renderer. The final portion transitions to local interior photography and a direct availability link. Scrolling upward reverses camera, sunlight, photo scale and narrative transitions.

The photograph is a composited background, not a photogrammetric model of an actual building. The geometry represents fictional architectural inspiration; do not describe the images as VIERCYS property photographs.

The sequence follows the hero directly. Booking stays reachable throughout through the header button, the sticky mobile button and the section's Skip to booking link. No animation controls forms, payments or guest/admin pages.

## Fallbacks and performance

- Phones, tablets and coarse pointers without a reduced-motion preference get the same pinned, scroll-scrubbed timeline, rendered as a 2.5D colonnade: three CSS arch masks at different depths scale at different rates (`--arch-start`, `--arch-speed`), so nearer arches pass first. The pin is 1.8 viewport heights on narrow screens. The Three.js chunk is never requested.
- Reduced motion (any screen) uses a static vertical layout with the same story, photographs and room link: no pinning and no canvas.
- Desktop WebGL failure or context loss retains the photographic composition and a scrubbed spatial 2D arch mask. The React error boundary prevents a canvas failure from removing booking controls.
- Canvas uses demand rendering: GSAP invalidates a frame when its progress changes. There is no permanent render loop, orbit control, random rotating ornament or scroll-jacking.
- Device pixel ratio is capped at 1.5; geometry is reused, the procedural material map is 128px, and directional shadows use one 1024px map. Renderer-owned GPU resources are disposed on unmount.
- Responsive Image components load local photographs at appropriate viewport sizes. GSAP invalidates responsive measurements and reverts pinning and inline styles when the media query changes.
- The default is a static photographic composition while the lazy-loaded scene initializes, so loading the GPU bundle does not create an empty viewport.

## Asset manifest and replacement guidance

Existing files are temporary editorial stock photographs recorded in README.md, not original property photographs. Keep their provenance and licensing review when replacing them. Approve art direction and rights before treating any replacement as property photography.

| Path | Usage | Replacement needed |
| --- | --- | --- |
| public/images/santorini.jpg | Opening hero, Santorini gallery and island setting preview | Limestone cliffside retreat in warm natural light with readable blue sea; landscape crop, preferably 2400px wide |
| public/images/architecture.jpg | Photographic courtyard behind 3D limestone arch; architecture preview | A coherent sunlit courtyard facing the sea, open central horizon and limestone walls; landscape crop, preferably 2400px wide |
| public/images/santorini/caldera-table.jpg | Final frame of the passage ("Twenty rooms") | Licensed CC BY 2.0 terrace photo (see README); replace with an approved VIERCYS terrace or suite image |
| public/images/boracay.jpg | Coming-soon Boracay gallery | Tropical shoreline establishing photograph, at least 1600px wide |
| public/images/amalfi.jpg | Coming-soon Amalfi gallery | Coastal architecture establishing photograph, at least 1600px wide |
| public/images/bali.jpg | Coming-soon Bali gallery | Quiet tropical architectural/landscape establishing photograph, at least 1600px wide |

Replace photographs at those paths and update descriptive alt text in experience.tsx, destination/property pages, ArchitecturalJourney.tsx and src/lib/rooms-editorial.ts. Homepage and room photographs describe the Santorini setting, not the fictional property. Actual category galleries require separate approved Essential, Signature and Grand room images.

The homepage RoomsShowcase reads names, rates, sizes and capacities from CATEGORIES in src/lib/catalog.ts, so it never keeps a competing price list or implies availability before a date search.

## Verification

Automated coverage is in tests/cinematic.spec.ts:
- Desktop loads an actual WebGL canvas in 3D mode, scrubs forward, reverses progress, and retains a direct booking jump without horizontal document overflow.
- A 390px touch viewport scrubs the 2.5D passage past 30% progress with no canvas and reaches the rooms link.
- Reduced motion on phone and desktop has no pin-spacer and no canvas, and the rooms link is visible.

Component ESLint passed during implementation. Global TypeScript/build and browser results are reported by the repository milestone checks; do not treat this document as evidence those checks passed.

Manual inspection should capture the arch before/halfway/after the dolly, reverse the scroll, compare courtyard and suite frames, test viewport resize and blocked WebGL, navigate category tabs by arrow keys, and check mobile touch targets. Frame-rate and GPU behavior depend on the actual device; no measured universal FPS claim is made.
