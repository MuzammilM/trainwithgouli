# Implementation Summary — feature-fuzzy-exercise-picker-20260926

## User Request
Replace the exercise drop-down in the coach's daily workout builder with a fuzzy search + dropdown (combobox).

## Changed Files
- `frontend/next/src/components/ExercisePicker.tsx` — ONLY file modified (176 insertions, 37 deletions). Consumers `DayBuilder.tsx` and `TemplateForm.tsx` untouched.

## What Was Built
1. **Combobox**: native `<select>` replaced by a text input (`role="combobox"`) with an absolutely-positioned dropdown listbox. Input shows the committed exercise name; typing fuzzy-filters.
2. **Fuzzy scorer** (inline, zero new deps): case-insensitive subsequence match — every query char must appear in order. Scoring: +2 per consecutive-run extension, +3 word-start (index 0 or after non-alphanumeric), +1 per char, +8 starts-with, +4 contains. Ties broken alphabetically. Top 10 matches shown.
3. **Chips**: body-part chip buttons unchanged; they filter the pool first, fuzzy query applies on top (same combine semantics as before).
4. **Keyboard**: ArrowDown/ArrowUp open + move highlight (clamped, scrollIntoView nearest), Enter selects highlighted (preventDefault while open — never submits the surrounding form), Escape closes and restores the committed selection. Click/tap selects.
5. **Mobile**: dropdown rows `min-h-[40px]`, listbox `max-h-64` scrollable, same dark theme tokens (border-2, var(--border)/var(--surface), highlight = var(--surface-2) + accent text), no hover-only affordances. Option `onMouseDown` preventDefault keeps focus on input so tap-select works without blur races.
6. **A11y**: role=combobox + aria-expanded/aria-controls/aria-activedescendant/aria-autocomplete="list" on input; role=listbox + role=option + aria-selected; "No matches" row is a plain non-selectable li.
7. **Contract preserved**: props `{ exercises, selectedName, onSelect(name, exercise?), name? }` unchanged; `commit()` calls `onSelect(exerciseName, exercises.find((e) => e.name === exerciseName))` exactly as before. Callers keep owning persisted fields (hidden inputs / serialized entries JSON).
8. **Edge cases**: empty query → all exercises (respecting active chip); no matches → non-selectable "No matches" row; dropdown opens on focus and typing, closes on selection/blur/Escape; blur reverts input to committed selection (native-select-like). External `selectedName` changes sync to the input via render-time prop-adjustment (not setState-in-effect).

## Verification
- `npm ci` from existing lockfile in worktree (no new packages).
- `npm run build` ✓ — compiled + typechecked; DayBuilder/TemplateForm typecheck against unchanged contract.
- `npm run lint` — ExercisePicker.tsx clean. 4 errors / 10 warnings remain but ALL are pre-existing on main in untouched files (today-coach/page.tsx unescaped entity, TodayChecklist.tsx setState-in-effect, VersionPill.tsx impure render, lib/actions/clients.ts + lib/google/resolve-client.ts unused vars).
- Next.js 16.2.9 bundled docs checked per frontend/next/AGENTS.md — no deprecations affecting this client component (no data fetching, standard React state/events).

## Deviations / Notes
- One lint-driven deviation during implementation: initial draft synced `selectedName` → input via useEffect; eslint-config-next 16 (React Compiler rules) flagged setState-in-effect. Replaced with the official render-time adjustment pattern (`prevSelected` state compare during render).
- No REL tag was allocated in task context; commit follows repo conventional style (`feat: ...`) without a Release line.
- No version.js touch, no cache busting (Next.js app hashes its own assets; no static HTML/JS/CSS changed), not pushed — orchestrator handles merge/push/deploy.

## Commit
- Branch: `feature/fuzzy-exercise-picker` (worktree: /Users/muzammil/workspace/worktrees/trainwithgouli/feature-fuzzy-exercise-picker)
- Commit: `9f05936` — "feat: ExercisePicker fuzzy search combobox replaces native select" (parent e6977cb "release: 0.12.3")
