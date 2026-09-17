# Implementation Summary — feature-coach-hero-20260917

## Task
"The Coach" hero band on the home page (P7) — placeholder content, IRON/RED world.

## What shipped
- `frontend/next/src/content/coach.ts` — `COACH_PLACEHOLDER` const (kicker, name, bio, 3 stats, CTA). Comment: "PLACEHOLDER — replace with real coach data". One-file swap later.
- `frontend/next/src/app/page.tsx` — new `<section aria-labelledby="coach-heading">` directly after the hero, before the section-link rows. Server component, no client JS.
- `frontend/next/src/app/globals.css` — `.coach-outline-word` in `@layer components` (tokens only): low-opacity outlined "Gouli" background word via `-webkit-text-stroke`, `color-mix` at 10% foreground, decorative + aria-hidden + pointer-events-none.

## Design decisions
- Anton stacked headline: "The Coach" (chalk) / "Harish Gouli" (accent red), `clamp(2.75rem, 11vw, 6rem)` — same scale as the existing hero h1, ≤6rem ceiling, stacks cleanly at 375px.
- Bio in Geist Mono, `--muted`, max-w-xl, `text-pretty` — matches hero paragraph treatment.
- Stat strip: bordered 2px `<dl>` grid — divided columns (`divide-x`) on desktop, stacked (`divide-y`) on mobile. Small mono uppercase labels + Anton values. Deliberately NOT the banned hero-metric card template.
- CTA: red solid → `/signup` (route doesn't exist yet — per brief; placeholder band).
- No photo dependency; no new animation (inherits page-enter only), so `prefers-reduced-motion` is respected by default.

## Verification
- `npm install && npm run build` — clean, all routes compile.
- SSR check: `next start` + curl — section markup present in `/` HTML (coach-heading, outline word, stats, CTA, /signup).
- Visual verification at breakpoints deferred to orchestrator (per task brief).

## Notes / deviations
- Impeccable `context.mjs` reported `NO_PRODUCT_MD`; skipped init (out of task scope) — DESIGN.md used as design authority.
- No todowrite tool available in session; checklist mirrored to `tasks/feature-coach-hero-20260917/todo.md`.
- No version bump, no version.js touch, no .env access.
