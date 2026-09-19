# Implementation Summary — feature-plan-today-20260918

Branch: `feature-plan-today-20260918` (worktree `~/workspace/worktrees/trainwithgouli/feature-plan-today-20260918`)
Build: `npm install && npm run build` — clean (Next 16.2.9, Turbopack, TS pass, 21 routes).
Fixture: `node tasks/feature-plan-today-20260918/parser-fixture-test.mjs` — ALL CHECKS PASSED.
Greps: `@supabase` zero; `DayBuilder`/`daysheet`/`DaySetBuilder` zero leftovers.

## 1. Sheet layer — `src/lib/google/sheets.ts`
- `appendDayBlock` now writes the 8-column format: banner + date-row merged A:H (`endColumnIndex: 8`); header row `Date|Workouts|Weights|Repetition|Sets|Rest|Coach Notes|Client Notes` (cream bg, bold); exercise rows carry coach_notes in col G and `''` in col H; cool-down merged A:H.
- **Returns** the 1-based row number of the FIRST exercise row (banner=1, date=2, header=3 → bannerRow+3); `0` when the updated range can't be parsed.
- New `updateClientNoteCell(sheetId, email, row, text)`: single-cell write to `H<row>` on the resolved tab (email-local-part tab, apostrophe-quoted); fully fail-soft (try/catch, never throws).
- `DayRow` gained optional `coach_notes`. `parseHistory`/`parseWeightKg`/`fetchClientHistory` unchanged (parser reads A:F, ignores the new columns safely).

## 2. /plan — template library (`src/app/plan/`)
- `page.tsx`: auth required. One-line muted description under h1. Coach: list (name, exercise count, updated date), New/Edit/Delete (delete uses `ConfirmSubmit` confirm dialog). Client (non-coach): read-only list + hint "Your coach builds plans here."
- `new/page.tsx` + `[id]/edit/page.tsx`: coach-only, shared `TemplateForm` client component — name + dynamic rows (exercise select from `exercises` collection, sets, reps, rest, coach notes) with add/remove/up-down reorder; rows serialized as JSON hidden field.
- Actions `src/lib/actions/templates.ts`: `createTemplate`, `updateTemplate` (useActionState signature), `deleteTemplate`. Coach role verified server-side; PB rules enforce coach-only writes. Entries stored in the exact schema shape (`done:false, client_notes:'', circuit:null`).

## 3. /days — history (`src/app/days/page.tsx`)
- Description "Workout history — every day you've trained." Client: own days (`filter user = me`); coach: all days with `expand=user` (try/catch → 'Athlete' fallback), newest first (`-date,-created`).
- Cards: formatted date (en-GB), done/total, first ~4 exercise names (done ones struck, muted). No feed/log UI.
- **Removed** the old log system (old `workout_days` schema had `user_id` + `workout_sets`; incompatible with the applied schema): deleted `days/new/page.tsx`, `days/[id]/page.tsx`, `lib/actions/days.ts`, `components/DaySetBuilder.tsx`.

## 4. /today — role redirect (`src/app/today/page.tsx`)
- Server page: `getAuthUser` → coach → `redirect('/today-coach')`; else `redirect('/today-client')`; unauth → `/login`. Nav "Today" href unchanged (`/today`).

## 5. /today-coach — assignment console
- Coach-only (non-coach → `/today-client`). Description under h1.
- Server page loads: roster `clients` (user token) + users record ids resolved by email via service client; `workout_templates`; `exercises` options; existing `workout_days` for the `?client=&date=` pair (defaults: first client, local today).
- `CoachDayConsole` (client component, keyed by client+date so state resets on navigation):
  - Client select + DD/MM/YYYY text date (ISO value); change → `router.push('/today-coach?client=&date=')`.
  - Existing day: live client progress (done/total + overall accent bar, per-exercise list), Edit mode = same row editor as template builder (weight/sets/reps/rest/coach notes, add/remove/up-down), save → `updateAssignment` (PB exercises JSON ONLY; muted note "Sheet copy stays as assigned — app is live source"), Delete assignment (confirm; PB delete only).
  - New day: "Start from template" picker prefills rows, or ad-hoc rows; save → `assignWorkout`.
- `assignWorkout` (`lib/actions/today.ts`): coach-only; builds entries (`done:false, client_notes:'', circuit:null`); resolves client users record id via service client by email (clear error if missing); creates `workout_days {user, date, exercises, created_by, sheet_order: names}`; appends `appendDayBlock` to the client's sheet (clients record `sheet_id` + email; entries carry coach_notes) → stores returned rowStart in `sheet_row_start`. Sheet failure: record kept, `sheet_row_start=null`, warning "Saved in-app; sheet sync failed — check SA has Editor access on the client's sheet."

## 6. /today-client — checklist
- Server: own day for today (user token, `user = "<id>"`, local-timezone ISO date). None → "No workout assigned today." (+ coach link to /today-coach). Coaches may view via direct link; toggle actions are owner-only (server verifies `record.user === auth user` before ANY write).
- `TodayChecklist`: cards with custom accent checkbox, name strike+dim when done, sets×reps chip (accent bg, black text, bold), rest chip muted, weight line, coach notes muted italic, auto-grow client notes textarea saved on blur (`saveClientNote`), circuit badge via dashed group frame labeled "CIRCUIT — round through, then rest".
- FOCUS MODE: tap card → focused (accent ring, full opacity), others opacity-40; one at a time; tap focused to unfocus; checking focused card auto-advances to next unchecked.
- PROGRESS: accent bar + "3/6" counter on top.
- DND: `@dnd-kit/core` + `@dnd-kit/sortable` (+ `@dnd-kit/utilities`) added to package.json; PointerSensor with 8px activation constraint (touch-friendly), grip handle (⠿) with `touch-none`. Circuits move as a unit (`circuitBlock` expands the dragged index to the contiguous same-circuit run; insertion never splits another group — lonely halves auto-dissolve via `dissolveLonelyCircuits`). Persisted via `reorder(dayId, fullExercisesArray)`.
- CIRCUITS: focused card gets "Group with next" (focused + next unchecked non-circuit card → shared `cN` next free id); "Ungroup" on focused circuit member; a circuit reduced to 1 member dissolves (id removed from both when 2-member).
- Server actions (`lib/actions/today.ts`, user token): `toggleDone(id, index)`, `reorder(id, exercises)`, `saveClientNote(id, index, note)` — all verify `day.user === user.id`. `saveClientNote` also mirrors to the sheet: if `sheet_row_start && sheet_order` → `row = sheet_row_start + sheet_order.indexOf(name)` (first match), `updateClientNoteCell(...H...)` inside try/catch — never blocks. Optimistic checkbox; `revalidatePath('/today-client')` (+ `/today-coach`).

## 7. Cleanup + polish
- Deleted: `DayBuilder.tsx`, `DayBuilderForm.tsx`, `DaySetBuilder.tsx`, `lib/actions/daysheet.ts`, `lib/actions/days.ts`, `days/new`, `days/[id]` (all imports fixed; zero leftovers).
- Home CTAs (mobile + desktop, logged-in): coach → "Today's assignments" (/today), client → "Today's workout" (/today); second CTA "Logbook" (/days).
- One-line muted descriptions under h1 on: /plan, /days, /today-coach, /today-client, /clients ("Coach-managed clients and their Google Sheets."), /leaderboard ("Biggest lifts across the crew."), /profile ("Your account details." — keeps the email display).

## Behavior contracts
- Sheet write path: `assignWorkout` → PB create first (record survives sheet failure), then sheet append, then `sheet_row_start` update. Sheet is best-effort; app is the live source.
- Client writes are owner-only and verified server-side; PB rules (self||coach read, coach create, coach delete) are the second layer.
- `sheet_order` is frozen at assign time (SHEET order); later coach edits change PB only, so client-note mirroring keeps mapping to the original sheet rows.
- Duplicate exercise names in `sheet_order`: `indexOf` first match (per spec).

## Unverifiable here
- Live PocketBase rule behavior and real Google Sheets writes (no dev02 credentials exercised in this session); covered by fixture test + build only.
- DND/circuit interactions on real touch devices — implemented per spec, not device-tested.
