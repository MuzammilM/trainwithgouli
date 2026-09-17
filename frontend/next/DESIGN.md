# Design: TrainWithGouli — IRON/RED

## Direction
Dark-first iron gym. Near-black surfaces, chalk-white type, one blood-red signal color. Gritty and high-powered — gym signage under a single worklight, not a SaaS dashboard. Replaces the previous off-white brutalist system wholesale.

## Scene
Athletes in a garage gym at 6am: chalk dust, phone propped on the rack, dim room. The screen must glare-read: black on, everything else off.

## Color (OKLCH, dark-only — no light scheme)
| Token | Value | Use |
|-------|-------|-----|
| `--background` | `oklch(0.145 0.012 25)` | Page base — iron black, faint warm |
| `--surface` | `oklch(0.195 0.014 25)` | Cards, panels, nav, inputs |
| `--surface-2` | `oklch(0.235 0.016 25)` | Raised/hover surfaces |
| `--foreground` | `oklch(0.945 0.012 60)` | Chalk white — all text |
| `--muted` | `oklch(0.62 0.02 30)` | Secondary text, placeholders (≥4.5:1) |
| `--accent` | `oklch(0.576 0.215 22)` | Blood red — actions, selection, focus only |
| `--border` | `oklch(0.32 0.015 25)` | Hairlines, 2px control borders |

Strategy: Committed. Red is never decoration — it marks the current action, the active nav state, and the focus ring. Body text never uses red.

## Typography
- **Anton** — display/brand. Condensed, uppercase, poster weight. Headings + wordmark only.
- **Archivo** — UI/body sans. Labels, buttons, prose.
- **Geist Mono** — data: weights, reps, dates, notes.
- Scale is fixed-rem (product register); headings styled via element selectors (h1–h3) so every route inherits.

## Texture & imagery
- Fixed SVG-noise overlay (feTurbulence data URI, ~4% opacity) over the whole app; zero animation cost.
- Faint red radial glow at the top edge (static).
- Home hero: verified Unsplash gym photo under a black overlay + noise.
- Motifs: hard offset red shadow on hover lifts; `/` slash in the wordmark: `trainwithgouli` + red `.`

## Components
- **Buttons**: rectangular, 2px border, uppercase bold. Primary = red bg / black text; secondary = outline, hover invert to red.
- **Inputs**: dark surface, 2px border, red focus ring (3px, offset 2px). Placeholders at `--muted`.
- **Cards/panels**: 2px border, no radius, `--surface` bg. Hover: hard red offset shadow + border lift — never nested.
- **Nav**: sticky top bar, brand on the RIGHT (`trainwithgouli.` in Anton). Links left with grow-underline hover; active route gets a red block behind the label. Mobile: links drop to a full-width scrollable row under the top bar.
- **Footer**: global (in root layout) — brand + tagline, route links, mono copyright. Sits at the base on every route including auth.

## Motion
- Route changes: `app/template.tsx` remounts per navigation → 420ms opacity + 14px rise, `cubic-bezier(0.25, 1, 0.5, 1)`. Every page, no JS library.
- Micro-transitions only (state, not choreography): nav underline grow (180ms), button press `scale(0.98)` (100ms), hover inverts (150ms).
- `@media (prefers-reduced-motion: reduce)` — all animation off, instant.

## Accessibility
- Contrast: body ≥7:1 on base; muted ≥4.5:1; red accent ≥4.5:1 on black for text use.
- Focus-visible: 3px red ring, offset 2px, on every interactive element.
- Semantic landmarks: nav / main / footer on every route; form labels; aria-current on active nav link.
