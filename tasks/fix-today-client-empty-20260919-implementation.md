# fix-today-client-empty-20260919 — Implementation

Task: /today-client was empty after a coach assigned a workout via DayBuilder
(/today-coach) because `saveDaySheet` wrote the Google Sheet ONLY — no
`workout_days` record existed for the client to render.

Branch: `fix-today-client-empty-20260919` (worktree
`~/workspace/worktrees/trainwithgouli/fix-today-client-empty-20260919`)

## Files changed

| File | Change |
|---|---|
| `frontend/next/src/lib/exercise.ts` | Added `carryOverByName(prev, next)` (carry done/client_notes by exercise-name first-match, consumed on match, circuit reset to null for all) and `nameMultisetsEqual(a, b)` (order/case/whitespace-insensitive name multiset compare). |
| `frontend/next/src/lib/actions/daysheet.ts` | `saveDaySheet` now upserts a `workout_days` record after `appendDayBlock` succeeds. |
| `frontend/next/src/lib/actions/today.ts` | New `importSheetBlock(dayId)` server action (owner-only sheet import). |
| `frontend/next/src/app/today-client/page.tsx` | Sheet-vs-DB mismatch detection on page load. |
| `frontend/next/src/components/TodayChecklist.tsx` | Mismatch banner with Import/Dismiss actions. |
| `tasks/fix-today-client-empty-20260919/fixture-check.mjs` | Fixture assertions for the two new pure helpers (passes). |
| `tasks/fix-today-client-empty-20260919/todo.md` | Task checklist. |

## Contracts

### saveDaySheet (daysheet.ts)
- Sheet write first (unchanged). `appendDayBlock` returns the 1-based first
  exercise row number → captured as `rowStart`.
- Resolve client users-record id via `serviceClient()` filtering
  `users` by `email = <client email>` (the same clients-record email the
  lookup already used). No users record → `console.warn`, sheet save kept,
  no workout_days write, redirect still happens (log-and-continue).
- Upsert `workout_days` by `(user=<users id>, date=<form date ISO>)`:
  - Existing record → exercises rebuilt from saved rows with
    `carryOverByName(normalizeEntries(existing.exercises), fresh)` (done +
    client_notes carried by name, first match; circuit null);
    `sheet_row_start = rowStart` (kept as-is when rowStart is 0);
    `sheet_order = names array of this save`.
  - No record → create `{ user, date, exercises: fresh (done:false,
    coach_notes from row, client_notes:'', circuit:null),
    created_by: current user id, sheet_row_start: rowStart>0 ? rowStart : null,
    sheet_order }`.
- Entire PB upsert wrapped in try/catch: sheet already succeeded → PB failure
  logs a warning and the save still redirects to `/today-coach?saved=1`.
- Uses the service (superuser) client because the coach's user token cannot
  write the client's `workout_days` row (API rule: self||coach-of-user is not
  expressible for create; service client bypasses rules).

### importSheetBlock(dayId) (today.ts)
- Owner-only via `getOwnDay` (day.user must equal auth user) — non-owner throws.
- Resolves the client's `clients` record by the auth user's email; no
  `sheet_id` → `{ ok:false, message }` (fail-soft).
- Calls `clearHistoryCache(sheet_id)` then `fetchClientHistory(sheet_id, email)`
  so direct sheet edits are visible immediately (bypasses the 5-min cache).
- Filters rows whose `date === today` (local timezone ISO; parseHistory already
  normalizes DD/MM/YYYY → ISO).
- Rebuilds entries from block rows, `carryOverByName` against the DB record's
  current exercises (done/client_notes preserved), sets `sheet_order` to the
  block names, keeps `sheet_row_start` untouched.
- Sheet read failure → `{ ok:false, message }`, no throw. Success →
  `revalidatePath('/today-client')`, `{ ok:true }`.

### /today-client mismatch detection (page.tsx)
- Only when a day record exists. Resolves the client's clients-record by user
  email (same pattern as the old today page); no sheet_id or fetch failure →
  skip silently (no banner).
- One `fetchClientHistory` call per page load — served from the shared 5-min
  cache when warm (cheap; shared with other pages).
- Compares the multiset of sheet exercise names for today (DD/MM/YYYY rows
  parsed by parseHistory) against the DB record's exercise names via
  `nameMultisetsEqual`. Mismatch → `sheetMismatch=true` + `sheetCount`/`dbCount`
  passed into TodayChecklist.

### TodayChecklist banner
- Rendered above the checklist: IRON/RED accent border
  (`border-[var(--accent)]`), text: "This workout was changed in the Google
  Sheet (N exercises there vs M here)."
- [Import from sheet] → `importSheetBlock(dayId)`; on ok hides the banner
  (page revalidates server-side); on failure shows the message inline.
- [Dismiss] → client-side hide only (state, not persisted).
- Import button disabled + "Importing…" while in flight.

## Verification
- `npm install && npm run build` — clean (no errors/warnings; /today-client
  compiles as dynamic server-rendered route).
- `grep @supabase` in frontend/next/src — zero matches.
- `node tasks/fix-today-client-empty-20260919/fixture-check.mjs` — all
  assertions pass (carry-over semantics, duplicate-name consumption,
  case-insensitivity, multiset compare).
- Not verifiable here: live PocketBase upsert against dev02 and live Google
  Sheets read/write (requires service creds + SA key at runtime). Contracts
  above define expected behavior; queue.md's manual verify step
  (assign for madebymzm → PB record exists → /today-client renders) should be
  run after deploy.

## Schema (dev02, pre-existing — no migration needed)
workout_days: user (relation users), date (date), exercises (json), notes,
created_by, sheet_row_start (number optional), sheet_order (json string[]
optional). Entry shape: { name, weight?, sets, reps, rest, done, coach_notes,
client_notes, circuit }.
