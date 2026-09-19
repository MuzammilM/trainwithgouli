# feature-plan-tag-filters-20260919 — Implementation

## Task
Port the DayBuilder exercise-picker UX (body-part tag chips + search) into the Plan template form via a shared `ExercisePicker` component.

## Files changed
- **NEW** `frontend/next/src/components/ExercisePicker.tsx` — shared client component: body-part chips (BODY_PARTS from `@/lib/body-parts`), "Search exercises…" input, filtered select. Props: `{ exercises, selectedName, onSelect(name, exercise?), name? }`. Select value is the exercise NAME; onSelect passes the full record so callers keep id/youtube_url. Callers own the persisted form field.
- `frontend/next/src/components/DayBuilder.tsx` — refactored to use ExercisePicker. Same chips/search/filter behavior; hidden `exercise[]` input and "Form video ↗" link unchanged. Exports `DayBuilder`, `Exercise`, `HistoryRow` unchanged (DayBuilderForm unaffected).
- `frontend/next/src/components/TemplateForm.tsx` — plain per-row `<select>` replaced with ExercisePicker (own search + chips per row, chips flex-wrap). Rows still serialize into the hidden `entries` JSON field — no server-action change needed.
- `frontend/next/src/app/plan/new/page.tsx`, `frontend/next/src/app/plan/[id]/edit/page.tsx` — exercises query now fetches `fields: 'id,name,body_part'` so tag chips can filter (previously id,name only).

## Behavior notes
- TemplateForm submits via hidden `entries` JSON (not exercise[] FormData arrays); picker's onSelect updates row state which the hidden field mirrors — server actions untouched.
- DayBuilder select now keyed by name (mapped back to id/youtube_url in handleSelect) — functionally identical.
- Minor layout note: in DayBuilder the chip/search row now renders inside the exercise column (col-span-4 on desktop) instead of full-width below the grid; mobile (col-span-12) is unchanged. Chips/search/filter behavior identical.
- Styling matches IRON/RED: 2px var(--border) borders, var(--surface) bg, mono chip text, red active chip.

## Verification
- `npm install && npm run build` — clean (all routes compiled).
- `grep @supabase` in frontend/next — 0 hits.
- DayBuilder exports unchanged: `DayBuilder`, `Exercise`, `HistoryRow`.
- Not verified: runtime browser interaction (no dev server run); PocketBase `exercises.body_part` is a select field returning arrays (already consumed this way by /today-coach).
