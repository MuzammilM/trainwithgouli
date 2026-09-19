# Plan/Days/Today rework — feature-plan-today-20260918

## Schema (applied on dev02 by orchestrator)
- DELETED empty legacy collections: workout_plans, plan_exercises, workout_sets, old workout_days (schema diverged from code; DayBuilder save path was broken anyway)
- NEW workout_templates: name (text), exercises (json), created_by (relation users, cascade); rules: read = any authed, write = coach
- NEW workout_days: user (relation, cascade), date (date), exercises (json), notes (text), created_by (relation), sheet_row_start (number), sheet_order (json); rules: read = self||coach, create = coach, update = self||coach, delete = coach

## Exercise entry shape (exercises JSON array, both templates and days)
{ name, weight?, sets, reps, rest, done: bool, coach_notes: string, client_notes: string, circuit: string|null }

## Sheet format v2
Headers: Date|Workouts|Weights|Repetition|Sets|Rest|Coach Notes|Client Notes (8 cols, cream bg)
Banner/date merges A:H; exercise rows 8 cols; client-notes col written on save (best-effort); appendDayBlock returns first-exercise row number.

## Build scope
1. sheets.ts: 8-col appendDayBlock + return rowStart; updateClientNoteCell helper
2. /plan: coach template library (CRUD + assign to client+date → creates workout_days + sheet block); clients read-only
3. /days: workout history for self (client) / all (coach)
4. /today: assigned-workout checklist — focus mode, strike on done, highlighted sets×reps, @dnd-kit drag reorder (circuits move as unit), circuits create/remove UI, per-exercise client notes, progress bar, server actions (toggle/reorder/saveNote), best-effort sheet note sync
5. Remove DayBuilder + old daysheet action; home CTAs → "Today's workout"/"Logbook"
6. One-line page descriptions on Plan/Days/Today (+Clients/Leaderboard/Profile for consistency)
7. Fixture tests updated for 8-col format; all green
