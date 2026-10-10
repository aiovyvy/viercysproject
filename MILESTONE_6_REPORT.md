# VIERCYS Milestone 6 ? local implementation

Implemented on `ux-rebuild` in the existing Next.js project. The local checkpoint `checkpoint-milestone-6-before` points to `661a024`. Existing untracked design references and room images were left alone and excluded from the milestone commit. No deployment, push, backend change or dependency installation was performed.

## Scroll scenes

| Scene | Before | Implemented behavior |
| --- | --- | --- |
| Arrival | Existing GSAP / Three.js arch entrance | Preserved, including phone fallback, reverse scrolling and booking bypass. Refresh priority accounts for downstream scene positions. |
| Courtyard | No dedicated arrival reveal | An architectural viewport opens with scroll as the image moves from a close crop to its full composition. |
| Philosophy | Static principles beside a collage | Three earth, sea and hospitality chapters activate imagery, architectural wipes and chapter numbers using the existing ScrollStory component. |
| Rooms | Hover preview and clickable architectural panels | Desktop scrolling selects Essential, Signature and Grand Sanctuary, opening their panels and updating copy, rate and links together. Tabs retain click and keyboard control. Phones show three vertical image-and-content chapters. |
| Experiences | Hover-controlled imagery | Viewport activation selects the photograph, wipe, text treatment and chapter counter. Mobile keeps each photograph inline. Existing catalogue prices and confirmation language remain intact. |
| Horizon | Static destination portrait | Scroll opens the Santorini architectural frame. Boracay, Amalfi and Bali retain Coming Soon labels and no reservation claims. |
| Sunset | CSS view-timeline-dependent finale | GSAP opens the blue-hour panorama and shifts its color treatment and depth. Copy and booking controls remain available throughout. |

The practical planning form precedes the entrance, leaving the seven resort scenes connected. The header booking link remains accessible. No hover is required for primary storytelling.

## Secondary pages and reuse

About and Rooms retain their existing distinct layouts and receive architectural image wipes through the shared ScrollStory enhancement. Philosophy retains its existing material/earth/sea sequences and receives the chapter enhancement. Destinations receives per-destination window reveals. Experiences receives reveals around its existing swipe galleries, without duplicating the experience catalogue. Contact, FAQ, account, staff and booking forms were not redesigned.

## Files changed

- `src/app/experience.tsx`: scene order, courtyard and philosophy composition.
- `src/app/destinations/page.tsx`: architectural destination windows.
- `src/app/experiences/page.tsx`: existing gallery reveals.
- `src/components/cinematic/ArchitecturalJourney.tsx`: refresh priority for the existing pin.
- `src/components/editorial/ScrollReveal.tsx`: reusable scoped GSAP mask/depth enhancement and cleanup.
- `src/components/editorial/story.module.css`: chapter image wipes and readable inactive text.
- `src/components/home/RoomsShowcase.tsx`: scroll selection, retained tabs and mobile chapters.
- `src/components/home/Experiences.tsx`: observer activation and chapter progress.
- `src/components/home/FinalInvitation.tsx`: blue-hour reveal.
- `src/components/home/home.module.css`: responsive scene styles; removes competing CSS finale animations.
- `src/components/room/room.module.css`: breadcrumb touch target raised to 48px after regression testing found a borderline animated 44px target.
- `tests/milestone6.spec.ts`: parked-pointer scroll transformations, room and experience activation, 390px/320px layouts and screenshots.
- `MILESTONE_6_REPORT.md`: delivery evidence and limitations.

## Browser evidence

Chromium ran the real production application. Automated tests park the mouse at `(0, 0)`, sample actual computed clip paths at three scroll positions, assert room selection and experience chapter changes, and capture screenshots. Desktop room captures wait for the panel transition to settle.

- `test-results/milestone6-scenes/`: desktop, 390px and 320px beginning/midpoint/end captures for courtyard, horizon and sunset; all philosophy and experience chapters.
- `test-results/final/`: final regression screenshots, including three desktop rooms and all mobile room chapters.
- `test-results/architecture-3d.png`: preserved entrance running with a real WebGL canvas.

The before column above is supported by the checkpoint source (including the original hover handlers); baseline browser screenshots were not captured. These are automated Chromium checks and reviewed captures, not physical-device or cross-browser certification.

## Verification and limits

- Production build, TypeScript and ESLint pass.
- All 19 existing unit tests pass, including booking, voucher, inventory and provider fallback tests.
- Final production-build end-to-end run: **60 passed (2.4 minutes)**, exit code 0, including three new Milestone 6 cases. The 48px breadcrumb fix passes the full layout check.
- Reduced-motion checks confirm no entrance pinning or WebGL and readable content/working tabs. Masks are applied only when motion is permitted; without JavaScript their default presentation is fully visible.
- Existing axe checks pass across guest, editorial, room, reservation and staff pages with no serious or critical violations.
- No new animation library, video or continuously running 3D scene was introduced. Existing image sizing/lazy loading is retained. Chapter observers disconnect and GSAP contexts revert on unmount/media changes. Hardware frame rates and Lighthouse scores were not measured.

During verification, downstream masks initially measured before entrance pinning; ordered refresh corrected this and computed-style browser assertions pass. A rebuild during an earlier running test server invalidated that run; final verification uses a fixed production build. The Windows Playwright-managed server stalled at teardown, so final verification uses the same test configuration and isolated test database with a separately managed local server and a temporary reuse-server configuration. That temporary configuration is excluded from the commit and removed afterward.
