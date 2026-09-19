# feature-days-backfill-20260919 — Implementation Notes

## Task
Q-3: Backfill `/days` history from a client's Google Sheet (past data only, per client, coach-triggered).

## Files changed
- `frontend/next/src/lib/history.ts` (new) — pure, unit-testable helpers: `HistoryRow` type, `parseDdMmYyyy` (day-first DD/MM/YYYY → ISO, validates real calendar dates), `groupHistoryByDate` (groups rows by date preserving sheet order; accepts ISO or DD/MM/YYYY; skips unparseable dates). No `server-only`, no googleapis.
- `frontend/next/src/lib/google/sheets.ts` — `HistoryRow` + `parseDdMmYyyy` moved to `lib/history.ts` and re-exported (no caller changes). `parseHistory` now also reads columns G/H into optional `coach_notes` / `client_notes` (8-column house format).
- `frontend/next/src/lib/actions/clients.ts` — new server action `importClientHistory(clientId)`.
- `frontend/next/src/components/ImportHistoryButton.tsx` (new) — client component: confirm + pending state + result line.
- `frontend/next/src/app/clients/page.tsx` — renders `<ImportHistoryButton>` per client row.
- `tasks/feature-days-backfill-20260919/history-fixture-test.mjs` (new) — fixture test.

## Contracts

### `importClientHistory(clientId): Promise<ImportHistoryResult>`
- Coach-only (`getAuthUser` role check). Loads the `clients` record; must belong to this coach (`client.coach === user.id`), else `forbidden`.
- Errors (fail-fast, before any write): `forbidden`, `client-not-found`, `no-sheet` (no `sheet_id`), `user-not-found` (no users record for the client email), `service-error` (service client unavailable), `sheet-error` (fetchClientHistory threw).
- Client's `users` id resolved via **service client** filtered by email (user tokens can't enumerate users).
- History fetched via `fetchClientHistory(sheet_id, email)` (5-min cached, tab = email local part).
- Rows grouped by date (`groupHistoryByDate`): DD/MM/YYYY → ISO YYYY-MM-DD day-first; unparseable dates skipped.
- Per date group:
  - Skip (never overwrite) if a `workout_days` record already exists for (user, date). Existing dates compared on `String(date).slice(0, 10)` (PB date fields serialize with time).
  - Else create: `{ user, date (ISO), exercises: rows in sheet order → { name, weight, sets, reps, rest, done: true, coach_notes, client_notes, circuit: null }, created_by: coach id, sheet_row_start: null, sheet_order: names array }`. `done: true` because past days are history.
  - Fail-soft per date: a create failure is collected as `"<date>: could not create the day record"` and does not abort remaining dates.
- Returns `{ ok: true, imported, skipped, errors }`; revalidates `/clients` and `/days`.
- Note: `use server` files may only export async functions — the error-message map lives in the client component, not in `clients.ts`.

### UI (`ImportHistoryButton`)
- Small secondary-styled button per client row on `/clients` (coach view only — page already redirects non-coaches).
- Confirm step via `window.confirm` (existing `ConfirmSubmit` uses the same pattern but is submit-form-bound; this is a button-triggered action, so a local confirm is used).
- Disabled while pending (`useTransition`), label "Importing…".
- After run shows: `Imported N days, skipped M (already existed)` (+ error list if any), or a friendly error message for the failure code.

### `/days`
- No changes. Imported records render through the existing path: `normalizeEntries` → `done: true` entries show struck-through; ISO dates format via `formatDay`.

## Verification
- `node tasks/feature-days-backfill-20260919/history-fixture-test.mjs` — all checks pass (valid/invalid dates, day-first ordering, split-block merge, invalid-date skip, ISO passthrough, empty input).
- `npm run build` clean (frontend/next).
- Zero `@supabase` references in `frontend/next/src`.

## Not verifiable here
- Live run against dev02 PocketBase + a real Google Sheet (requires service-account creds and a sheet shared with the SA). Schema `workout_days` (user, date, exercises, notes, created_by, sheet_row_start, sheet_order) already exists on dev02 per task context.
