# fix-today-client-empty-20260919 — todo

- [ ] Phase 1: Investigation — daysheet.ts, today-client page, TodayChecklist, sheets.ts, today.ts, admin.ts read; schema known (workout_days on dev02)
- [ ] Phase 2: Setup — worktree fix-today-client-empty-20260919 (branch fix-today-client-empty-20260919) exists, clean
- [ ] Phase 3: Implementation
  - [ ] lib/exercise.ts: carryOverByName + nameMultisetsEqual helpers
  - [ ] daysheet.ts saveDaySheet: upsert workout_days (service client, carry-over, sheet_row_start/sheet_order), fail-soft
  - [ ] today.ts: importSheetBlock(dayId) server action (owner-only, clearHistoryCache, rebuild, carry-over)
  - [ ] today-client/page.tsx: sheet mismatch detection (cached fetchClientHistory, today rows, name multiset compare)
  - [ ] TodayChecklist.tsx: mismatch banner + Import from sheet + Dismiss
  - [ ] Fixture check under tasks/fix-today-client-empty-20260919/
- [ ] Phase 4: Verify — npm install && npm run build clean; grep @supabase zero; implementation doc
- [ ] Phase 5: Commit + push branch (no version bump)
