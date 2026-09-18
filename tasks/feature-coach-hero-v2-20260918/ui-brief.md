# UI Brief — Coach Hero v2 (HARISH GOULI band)

**Task:** feature-coach-hero-v2-20260918
**Surface:** Home page (`/`), between hero and section link rows — replaces the old placeholder coach band.
**Mode:** Persuade (brand register). IRON/RED world per `frontend/next/DESIGN.md`.

## Direction calls

1. **Photo subdual (no grayscale).** The gi blue must survive. Three-layer treatment on the photo container:
   - (a) overall darken: `color-mix(--background 35%, transparent)` — near-black warm, matches the iron base better than pure black;
   - (b) left-edge fade: `linear-gradient(to right, --background 0%, transparent 45%)` so the photo dissolves into the page on the content side;
   - (c) 2px accent-red offset frame behind the photo (`::after`, translated +12/+12px, container keeps 12px slack so `overflow-hidden` doesn't clip it) — the gritty poster motif, consistent with DESIGN.md's hard offset red shadows.
   - Crop: `object-[center_20%]` keeps head + medals in frame at 4/5 (desktop) and 16/10 (mobile).

2. **Background word stack ABOVE the photo** (z-20, accent red at ~7% opacity, right-aligned, clipped by the zone's `overflow-hidden`). "Behind/above" per mockup — above guarantees visibility over the darkened photo and reads as print on the poster. `aria-hidden`.

3. **Mobile ordering is DOM order:** single-column grid — content zone (eyebrow → name stack → roles → bio → CTA pair full-width → credential 2-col strip), then photo (16/10), then the hairline footer row spanning the section. No absolute-positioned side notes below `lg`.

4. **Red discipline.** DESIGN.md reserves red for signal: red appears only in GOULI (brand name treatment, same as hero), the primary CTA, and the photo frame. Credential icons are muted, NOT red.

5. **Credential strip = hairline grid, not cards.** `gap-px` on a `--border`-colored grid → true 1px dividers that wrap cleanly (2 cols mobile → 5 cols desktop = divide-x equivalent). 5th cell spans 2 on mobile to avoid an orphan.

6. **Typography.** Name stack Anton clamp(3rem, 10vw, 6rem), leading 0.9 — HARISH chalk over GOULI red. Roles + eyebrow + footer in Geist Mono. h2 = name stack; h3 = credential labels (globals already force Anton uppercase on h3 — on-brand at small sizes).

7. **No new motion.** `page-enter` covers entrance; honors prefers-reduced-motion by inheritance.
