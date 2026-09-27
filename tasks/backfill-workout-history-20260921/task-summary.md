# Task Mirror — backfill-workout-history-20260921

## Outcome: COMPLETE — 14 day blocks written to the madebymzm Google Sheet (sheets ONLY)

- **Scope**: 14 past workouts (2026-08-06 → 2026-09-19), spell-checked + deduped, written in the
  app's house format (banner / DD/MM/YYYY / headers / exercise rows / cool-down, cream+black
  formatting, merges). PocketBase intentionally NOT touched (user instruction: "insert only into
  google sheets — I'll work with the coach to fill in the correct data").
- **Sep 19**: REPLACE per user — old coach-plan block (Deadlift/Bench/Squat/Calf) deleted, replaced
  with actual workout (RDL 10kg, Deadlift 30kg, DB step-up 7.5kg, Weighted bridge 15kg,
  Wall sit/High plank/Crunches/Leg raise circuit ×3).
- **Files**: `backfill-data.json` (normalized 14-day dataset), `backfill.js` (zero-dep Node;
  `--dry-run`, `--write` sheets-only default, `--write --pb` also creates workout_days; `replace: true`
  per-day flag deletes the existing block first). Script env: sourced from `~/trainwithgouli/frontend.env`
  on `dev` + `GOOGLE_SA_KEY_FILE=$HOME/trainwithgouli/google_sa.json`.
- **Incident + fix**: findBlockSpan had an off-by-one — replace deleted rows 71-77 but left the
  block's banner at row 70 (orphan). Fixed the function (start now includes the banner row) and
  deleted the orphan row via `/tmp/fix-row70.js` (with a safety check). Verified final sheet:
  rows 64-69 = 18/09 block #2, row 70 = 20/09 banner, 14 new blocks at rows 70-248 (post-cleanup).
- **Verification**: full A60:H dump reviewed — all 14 blocks correct, pre-existing 8 blocks intact.

## ⚠️ Follow-up for coach session (PB untouched)
- PB still holds the OLD Sep 19 record (coach plan: Deadlift/Bench/Squat/Calf, done:true) and a
  Sep 20 record (Bench/Dips/Deadlift/Shoulder/Lateral/Shrugs) — both now differ from the sheet.
- `importClientHistory` is idempotent by (user,date) — it will SKIP Sep 19. To load the corrected
  Sep 19 data into PB, the existing Sep 19 workout_days record must be deleted first (coach, via
  PocketBase admin or a small script), then Import history re-run.
- /today-client may show a mismatch banner for Sep 19 (sheet vs PB names) — expected until reconciled.
