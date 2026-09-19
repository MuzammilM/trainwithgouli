# Task: feature-plan-today-20260918

## Checklist
- [x] Phase 1: Investigation — read spec (dispatch prompt; plan.md was missing), all affected files, existing patterns
- [x] Phase 2: Setup — worktree feature-plan-today-20260918 (branch feature-plan-today-20260918)
- [x] Phase 3: Implementation
  - [x] 1. Sheet layer: sheets.ts 8-col format, appendDayBlock returns first exercise row, updateClientNoteCell, fixture test ALL PASS
  - [x] 2. /plan template library (coach CRUD, client read-only)
  - [x] 3. /days history (client own / coach all)
  - [x] 4. /today role redirect
  - [x] 5. /today-coach assignment console + assignWorkout action
  - [x] 6. /today-client checklist (focus mode, dnd, circuits, notes, progress)
  - [x] 7. Cleanup: deleted DayBuilder/DayBuilderForm/DaySetBuilder/daysheet/days actions + old days routes; home CTAs; page descriptions
- [x] Phase 4: Verify (build clean, fixture pass, greps zero) + commit

## Notes
- plan.md was missing from tasks dir; dispatch prompt is authoritative spec (see implementation-summary.md).
- Schema already applied on dev02 PocketBase; coded against it exactly.
- Old days log system (workout_sets-based) removed as incompatible with the new workout_days schema.
