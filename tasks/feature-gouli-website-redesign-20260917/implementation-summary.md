# Implementation Summary: IRON/RED Redesign

**Task**: feature-gouli-website-redesign-20260917
**Branch**: feature/gouli-website-redesign-20260917
**Surface**: frontend/next (all 13 routes)

## What shipped

### New visual world: IRON/RED (replaces off-white brutalist + orange)
- Dark-only OKLCH token set in `globals.css`: iron-black bg `oklch(0.145 0.012 25)`, surface/surface-2, chalk ink, signal red accent `oklch(0.64 0.2 22)` → #ed4952, pure-black `--accent-ink` for text on red.
- Grit: fixed SVG feTurbulence noise film (~5% opacity) + static red radial glow at top edge.
- Type: Anton (display, next/font/google, weight 400 — single-weight font), Archivo (UI/body), Geist Mono (data). Headings styled via h1–h3 element selectors → every route inherits display type.

### Layout & components
- `Footer.tsx` (new) — global in root layout; brand + tagline, route links, mono copyright; sits at base on every route incl. auth.
- `Nav.tsx` (rewritten) — sticky, solid surface; **brand `trainwithgouli.` rightmost** in the top row; links left (desktop) / full-width scrollable row (mobile); `aria-current="page"` active state shown by red underline bar only (text stays foreground for small-text contrast); auth block between links and brand.
- `template.tsx` (new) — App Router template remounts per navigation → `.page-enter` 420ms opacity + 14px rise, ease-out-quart. Verified mid-flight (opacity 0.67, translateY 4.6px @150ms). `prefers-reduced-motion` → disabled.
- Home (rewritten) — verified Unsplash hero photo (HEAD-checked 200) at 25% opacity under black overlay; Anton stack headline "TRAIN WITH GOULI" (GOULI in red, clamp ≤6rem); auth-aware CTAs (red solid + outline); 3 section links as full-width hover-invert rows (red bg / black text / arrow nudge) — no card grid.
- Login/Signup (rewritten) — split-panel: desktop left brand panel with giant Anton statement ("Log in. / Lift heavy."), right centered form; mobile = brand bar + form. Red primary CTA, black ink, press scale(0.98).

### Token inheritance
Secondary routes (exercises, plans, days + new/edit pages, DaySetBuilder, PlanExerciseBuilder, YouTubeEmbed) required **zero markup changes** — they reference the same CSS vars and picked up the whole new world. Global replace: `hover:text-white` → `hover:text-[var(--accent-ink)]` for semantic consistency.

## Verification (headless Chromium, measured not assumed)
- `npm run build` clean (Next 16.2.9, TS strict, 13/13 routes).
- Ground-truth canvas-sampled WCAG contrast: body 16.8:1, muted 5.4:1, red on bg 5.4:1, red on surface 4.9:1, black ink on red 5.7:1 — all ≥ 4.5.
- No horizontal overflow at 375px (scrollWidth == viewport).
- Landmarks: nav + main + footer on every route; aria-current on active nav link; form labels + autocomplete attrs.
- Reduced-motion: animation-name none.

## Significant fix beyond scope
`globals.css` base element styles were **unlayered**, which in Tailwind v4 silently overrides `@layer utilities` — `text-[var(--accent-ink)]` (and the original code's `text-[var(--background)]` button labels) never applied; buttons rendered inherited-color text. Wrapped all base styles in `@layer base`. This bug predates the redesign.

## Notes
- No REL tooling in this repo (`deploy/rel-allocate.sh` absent) — commits reference task ID.
- Impeccable `context.mjs` reports NO_PRODUCT_MD (scans repo root); existing `frontend/next/PRODUCT.md` used as product context directly.
- Runtime env note: client bundle inlines NEXT_PUBLIC_SUPABASE_* at build time; local visual testing used the dev project URL + placeholder anon JWT (publishable key endpoint failed). No secrets committed; `.next` gitignored.
- Unverified visually by screenshot review (no image-viewing tool in this session) — verified via DOM/computed-style/canvas measurements instead.

## Senior polish pass

Impeccable `polish` + `product`-register critique of the shipped IRON/RED world. Detector (`detect.mjs`) clean on all touched files. Verdict: the redesign was solid; issues were concentrated in auth interaction states and a11y minutiae, not the visual system.

### Findings → fixes

**Functional**
1. **Auth errors were invisible** — `login`/`signup` server actions threw on Supabase error, dumping users on Next's default exception screen. Now redirect back to `/login?error=…` / `/signup?error=…`; pages (now async, reading `searchParams`) render the message in a `role="alert"` box (2px red border, 12% red tint, mono — no new color introduced).
2. **No submit pending state** — double-submit possible, zero feedback. New client `AuthSubmitButton` (`useFormStatus`): shows "Logging in…" / "Signing up…", disables while pending.
3. **No route loading feedback** — every page awaits Supabase and navigations hung silently. New global `app/loading.tsx`: indeterminate 3px red chalk-line at the top edge + mono "Loading…", `role="status"`, animation killed under reduced motion.

**Craft / a11y**
4. `color-scheme: dark` added to `:root` (dark-only world was leaking light scrollbars / white autofill / light controls) + `viewport` export in root layout (`themeColor #211b1d`, `colorScheme dark`) so mobile browser chrome matches.
5. **Cascade-layer bug (same class as the unlayered-base bug)**: `.nav-link` / `.page-enter` were unlayered and would silently beat Tailwind utilities. Moved custom classes into `@layer components`; keyframes and the reduced-motion override stay unlayered so the override still wins.
6. **Touch targets to 44px** (mobile-first brief): mobile nav link row (`py-3.5`, underline now reads as a tab indicator at the row's bottom edge), Log out / Sign up buttons (`min-h-11`), top-bar Log in and footer links (`py-3.5`/`py-3` on mobile, compact on desktop).
7. **Nested navigation landmarks removed** — mobile row no longer declares `role="navigation"` inside `<nav>`; the outer nav now carries `aria-label="Primary"`.
8. **Dead hover removed** on the brand wordmark (`hover:text-foreground` was a no-op); hover now brightens only the red dot (`--accent-strong`).
9. **Home row hover contrast**: section description no longer stays at `opacity-80` over the red invert (`group-hover:opacity-100` — full black on red, 5.7:1).
10. **Doc drift**: DESIGN.md accent token corrected to the shipped `oklch(0.64 0.2 22)` (#ed4952); `--accent-strong` / `--accent-ink` documented.

Also: `decoding="async"` on the hero image; metadata title template (`%s — trainwithgouli`) for future per-page titles.

### Verification
- `npm run build` clean (Next 16.2.9, TS strict, 13/13 routes).
- Error-box text is `--foreground` on 12% red tint over surface — well above 4.5:1.
- Reduced-motion override confirmed still unlayered → wins over `@layer components` animations.

### Not changed (deliberate)
- 420ms route transition kept — brief explicitly asked for smooth page animations; product-register 250ms guidance yields to the brand ask.
- No global `error.tsx` — auth (the common throw path) no longer throws; remaining throws are pre-existing authorization guards, out of polish scope.
