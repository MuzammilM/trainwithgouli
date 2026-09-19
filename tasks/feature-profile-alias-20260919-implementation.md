# feature-profile-alias-20260919 — Implementation Contract

Task Q-1 (queue-20260919): profile alias + leaderboard display choice.
Schema (already applied on dev02 PocketBase): `users.alias` (text, max 40, optional), `users.board_display` (select ["alias","name"], optional; API-created selects may lose their default — missing/empty is treated as "alias" everywhere in code). users updateRule = self; cross-user reads via service client only.

## Files changed

- `frontend/next/src/lib/actions/clients.ts`
- `frontend/next/src/components/AddClientForm.tsx`
- `frontend/next/src/lib/actions/profile.ts`
- `frontend/next/src/components/ProfileForm.tsx`
- `frontend/next/src/app/profile/page.tsx`
- `frontend/next/src/app/leaderboard/page.tsx`

## Behavior contracts

### Alias sanitization (shared rule, duplicated in both server actions)
`sanitizeAlias(raw)` = collapse all whitespace runs to single spaces, trim, hard-cap at 40 chars. Empty after sanitize → stored as empty string. No error is raised for over-length input; it is silently truncated to 40 (matches the DB column cap).

### addClient (coach flow)
- `AddClientForm` gains an optional `alias` text input, label "Leaderboard alias (optional)", `maxLength=40`.
- `addClient` reads `formData.alias`, sanitizes it.
- **New users record** (service-client create): `alias` is written with the sanitized value (empty string when the coach left it blank).
- **Existing users record**: alias is backfilled ONLY when the record currently has no alias (`getOne` then conditional `update` via service client). A self-chosen alias is never overwritten by a coach re-adding the client. Backfill failure is swallowed — the client add itself never fails because of alias.

### /profile (self flow)
- Page prefills `alias` (raw record value) and `boardDisplay` (record value normalized: anything ≠ 'name' → 'alias', covering the stripped-default case).
- `ProfileForm` adds:
  - alias input (editable, `maxLength=40`), controlled so the display-preference radios react live.
  - radio group `board_display`: "Show my alias" (value `alias`) | "Show my real name" (value `name`). Both radios are **disabled when the alias field is empty**, with the muted hint "Set an alias first to control board display." Default checked: `alias` unless stored value is `name`.
- `updateProfile` saves `name`, `mobile`, `alias`, `board_display` via the user's own token (self-update, allowed by updateRule). Server-side enforcement: if sanitized alias is empty, `board_display` is forced to `'alias'` regardless of form input — the client-side disable is UX only, the server is the gate.

### Leaderboard display-name resolution
- Service-client users lookup fields extended to `email,name,alias,board_display`.
- Resolution per user: `board = alias if (alias non-empty AND board_display !== 'name') else name`. Missing/empty `board_display` counts as NOT 'name' → alias wins (stripped-default safe).
- Fallback chain unchanged: resolved board name → email local-part → raw email. Rendered in the Lifter column.

## Privacy note
The leaderboard is visible to all logged-in users; alias is the identity-protection mechanism. Real names are only shown when the user explicitly opts in (and has an alias to fall back to).

## Verification
- `npm install && npm run build` — clean, no errors/warnings (Next 15, 20 routes).
- `grep @supabase` across `frontend/next/src` — zero matches.
- Not verifiable here: live PocketBase round-trips on dev02 (alias write via addClient, self-update via /profile, board rendering) — schema confirmed applied by orchestrator; code paths follow existing service-client/self-token patterns.
