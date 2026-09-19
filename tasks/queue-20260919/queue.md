# Queue 2026-09-19

| # | Item | Type | Priority | Status | Task ID |
|---|------|------|----------|--------|---------|
| Q-1 | Profile alias + leaderboard display choice | feature | medium | pending | feature-profile-alias-20260919 |
| Q-2 | /today-client empty after coach assigns via /today-coach | fix | high | pending | fix-today-client-empty-20260919 |

## Q-1 — Profile alias
- users += `alias` (text ≤40, optional), `board_display` (select alias|name; missing = alias)
- addClient form: optional coach-set alias → users record (service client)
- /profile: edit alias + choose "show alias / show my name" (name forced when no alias)
- Leaderboard: alias when set && preference=alias; else name/local-part
- Privacy: alias is what other users see on the board

## Q-2 — today-client empty (root cause known)
- saveDaySheet (DayBuilder) writes sheet ONLY; /today-client reads workout_days records
- Fix: saveDaySheet upserts workout_days for (client user, date): exercises rebuilt from rows
  (done:false, circuit:null, client_notes:''), carry over done/client_notes by exercise-name
  match on re-save; store sheet_row_start + sheet_order from appendDayBlock return
- Resolve client users id via service client by email
- Verify: assign for madebymzm → PB record exists → /today-client renders checklist

## Run order
Q-2 first (active bug blocking client testing), then Q-1.
