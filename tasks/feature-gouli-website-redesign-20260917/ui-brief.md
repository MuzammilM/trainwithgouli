# UI Brief: TrainWithGouli IRON/RED redesign

## Task
feature-gouli-website-redesign-20260917 — full visual redesign of frontend/next (all routes).

## User brief
- Bold **black + red** themes; gritty, high-powered gym/coach energy (coach: Harish Gouli).
- Nav bar on top with **trainwithgouli brand on the RIGHT**.
- **Footer at the base** (was missing entirely).
- **Smooth animations when navigating between pages.**
- **Mobile-first** — most users on phones.

## Scene sentence (drives dark-first)
Athletes in a garage gym at 6am, chalk in the air, phone propped on a rack next to the bar — dim room, screen glare, sweat on the glass. The UI must read like gym signage under a single worklight: near-black surfaces, chalk-white type, one blood-red signal color.

## Decision: replace, not refine
The incumbent world (brutalist off-white + warning orange, Geist Mono everywhere) is replaced wholesale. The brief's black/red grit is a different identity; splitting the difference would produce neither.

## Visual world: IRON/RED
- **Color strategy**: Committed-to-drenched. Near-black iron surfaces carry ~85% of the page; one blood-red accent carries all action/selection states. No second decorative color, no gradients.
- **Palette (OKLCH)**: bg `oklch(0.145 0.012 25)`, surface `oklch(0.195 0.014 25)`, ink `oklch(0.945 0.012 60)`, muted `oklch(0.62 0.02 30)`, accent `oklch(0.576 0.215 22)` (blood red), border `oklch(0.32 0.015 25)`. Dark-only — no light scheme, no prefers-color-scheme fork.
- **Type**: Anton (display, gym-poster condensed) for headings/brand; Archivo (sans) for UI/body; Geist Mono for data/numbers. Loaded via next/font/google — same mechanism the app already uses.
- **Texture**: fixed SVG-noise (feTurbulence) overlay at ~4% opacity + faint red top glow. Static, GPU-free.
- **Imagery**: verified Unsplash gym photography (HEAD-checked 200) with heavy dark overlay in the logged-out home hero.
- **Motifs**: hard offset red shadows on hover, slash `/` as brand separator, full-row hover-invert on section links.

## Motion
- Page transitions: `app/template.tsx` remount-per-route entrance (opacity + 14px rise, 420ms, ease-out-quart). No config changes needed; works on every navigation.
- Micro: nav underline grow, button press scale(0.98), link invert on hover.
- `prefers-reduced-motion`: all animation disabled → instant.

## Surfaces touched
1. `globals.css` — tokens, dark base, element styles, keyframes (downstream pages inherit the whole world via existing var() references)
2. `layout.tsx` — fonts, metadata, global Footer
3. `components/Footer.tsx` — new
4. `template.tsx` — new (route transitions)
5. `components/Nav.tsx` — brand right, active states, mobile row
6. `app/page.tsx` — hero + section rows
7. `app/login`, `app/signup` — split-panel gritty auth
8. `DESIGN.md` — rewritten for IRON/RED

## Deviations / notes
- Impeccable `context.mjs` reports NO_PRODUCT_MD (it scans repo root); product context lives at `frontend/next/PRODUCT.md` and was read directly. Skipping `init` — a second root PRODUCT.md would duplicate it.
- REL tooling (`deploy/rel-allocate.sh`) does not exist in this repo yet; commits reference the task ID instead of a REL tag.
- Bans respected: no gradient text, no side-stripes, no eyebrow kickers, no numbered scaffolding, no hero-metric template, no identical card grid (home sections are hover-invert rows).
