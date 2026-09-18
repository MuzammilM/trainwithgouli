# Implementation Summary — Coach Hero v2

**Task:** feature-coach-hero-v2-20260918
**Branch:** feature-coach-hero-v2-20260918
**Surface:** Home page (`/`) coach band, between hero and section link rows.

## What shipped

Replaced the placeholder "The Coach" band with a two-zone IRON/RED poster section:

- **Left (content, ~55%):** mono eyebrow → stacked Anton name (HARISH chalk / GOULI red, clamp ≤6rem) → mono roles line → bio (max 46ch) → CTA pair (red solid `Start training` with lucide ArrowRight → `/login`; 2px outline `View programs` → `/plans`) → 5-item credential strip (lucide icons: Medal, Trophy, Users, HeartPulse, Clock3) as a 1px hairline grid (2-col mobile → 5-col desktop), 5th cell spans 2 on mobile to avoid an orphan.
- **Right (photo, ~45%):** `/images/coach-gouli.jpg` cropped `object-[center_20%]` (head + medals), aspect 4/5 desktop / 16/10 mobile. Subdued without grayscale: 35% `--background` darken overlay + left-edge gradient fade into the page + 2px accent-red offset frame (`::after`, +12px, slack preserved against overflow-hidden). Anton background-word stack (MMA/BJJ/STRENGTH/REHAB, accent at 7%, aria-hidden) printed above the photo, right-clipped. Two mono side annotations, `hidden lg:block`, aria-hidden.
- **Bottom hairline row:** `CUSTOM TRAINING. REAL RESULTS.` / `MYSORE, INDIA`, spans section under both zones — on mobile it lands after the photo per spec.
- All copy in `src/content/coach.ts` as typed `COACH` const ("PLACEHOLDER-FREE — real content v1"); icons referenced by name, mapped in page.tsx. Server component; no client JS.
- New CSS confined to `@layer components` (`.coach-photo-frame::after`, `.coach-bg-words`); old `.coach-outline-word` removed. No new motion (page-enter covers entrance).

## Design-direction calls

1. Photo subdual via warm near-black (`--background`) overlays, not pure black and not grayscale — gi stays blue per brief.
2. Background words placed **above** the darkened photo (spec: "behind/above") — behind would be invisible under an opaque image.
3. Red discipline per DESIGN.md: red only on GOULI, primary CTA, photo frame; credential icons are muted.
4. Mobile ordering is pure DOM order (content → photo → hairline) — no reordering hacks.

## Verify

- `npm run build` — clean (Next 16.2.9).
- SSR HTML (`next start` + curl `/`) contains: coach-gouli.jpg, HARISH/GOULI, all five credentials, both CTAs, side notes, footer row.
- No version files touched; no .env access.

## Unverifiable

- Exact visual crop of the photo at `center 20%` and overlay balance were validated by reasoning over the 1080×1080 asset, not by screenshot — worth one human eyeball pass at 375px and 1440px.
