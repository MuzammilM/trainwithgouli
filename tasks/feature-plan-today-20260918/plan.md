# Plan/Days/Today rework v2 — feature-plan-today-20260918 (PLANNING)

## Schema (APPLIED on dev02)
- DELETED empty legacy: workout_plans, plan_exercises, workout_sets, old workout_days
- workout_templates: name, exercises(json), created_by → read any authed, write coach
- workout_days: user(rel), date, exercises(json), notes, created_by, sheet_row_start(num), sheet_order(json) → read self||coach, create coach, update self||coach, delete coach
- Entry shape: {name, weight?, sets, reps, rest, done, coach_notes, client_notes, circuit}

## Pages
- /plan — coach template library (CRUD + reuse); clients read-only. Desc: "Reusable workout templates — build once, assign to any client."
- /days — history: client own, coach all (expand user, fail-soft names). Desc: "Workout history — every day you've trained."
- /today — ROLE REDIRECT: coach → /today-coach, client → /today-client
- /today-coach — assignment console. Desc: "Build and assign workouts — they land on your client's Today."
  - Client selector + date picker (default today)
  - Existing day for client+date: exercise list w/ client progress, edit exercises (PB-only after creation; sheet note), delete assignment
  - No day: build ad-hoc rows (exercise select/sets/reps/rest/coach notes) OR pick template → assign = create workout_days + appendDayBlock (8-col) + store rowStart/order
- /today-client — checklist. Desc: "Today's assigned workout — check off exercises as you go."
  - Focus mode (others 40%), strike on done, sets×reps accent chip, dnd reorder (@dnd-kit, circuits move as unit), create/dissolve circuits, client notes (PB + sheet col H best-effort), progress bar, auto-advance focus

## Sheet v2
8 cols: Date|Workouts|Weights|Repetition|Sets|Rest|Coach Notes|Client Notes; merges A:H; appendDayBlock returns first-exercise row

## Nav/home
Nav "Today" → /today; home CTAs: coach "Today's assignments", client "Today's workout", both + "Logbook"

## Verify
build clean; fixtures green (8-col); no DayBuilder/daysheet leftovers
## Release: 0.10.0
