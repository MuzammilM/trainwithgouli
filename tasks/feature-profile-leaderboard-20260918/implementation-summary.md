# Implementation Summary — feature-profile-leaderboard-20260918

Branch: `feature-profile-leaderboard-20260918` (worktree). Single commit, no version bump (REL flow).

## P5 — Profile + hardening

### /profile page + server action
- `frontend/next/src/app/profile/page.tsx` — server component; `getAuthUser` → redirect `/login` when unauthenticated. Prefills `name`/`mobile` from the live users record via `serverClient().collection('users').getOne(user.id)` (self-read allowed by view rule). Success banner via `?saved=1` (`role="status"` mono block).
- `frontend/next/src/lib/actions/profile.ts` — `updateProfile(formData)`: name trimmed, non-empty, ≤80 chars; mobile optional, if present only `+ digits space dash`, 8–15 chars. Saves via **user-token self-update** (`pb.collection('users').update(user.id, …)`) — allowed by the tightened update rule (self). Errors surfaced as IRON/RED alert block (`invalid-name`, `invalid-mobile`, `save-failed`).
- `frontend/next/src/components/ProfileForm.tsx` — client form, `useTransition`, styling matches /clients forms (2px borders, red focus ring, red primary button).

### Nav
- `frontend/next/src/components/Nav.tsx`: logged-in user name is now a `Link` to `/profile` (coach `[coach]` badge preserved inside the link).

### addClient login-account bootstrap
- `frontend/next/src/lib/actions/clients.ts`: after the sheet-access gate passes, a users record is ensured for the client email via the **service client** (`lib/pocketbase/admin.ts`): query `email = "<email>"`; if missing, create `{email, role:'client', verified:true, password: crypto.randomBytes(10).toString('hex') (20 chars), passwordConfirm}`. **Non-blocking**: any users-record failure is swallowed — the clients record still saves (login allowlist also checks clients records). Result type extended to `{ ok: true; account?: 'created' | 'existing' }`.
- `AddClientForm.tsx` success message: "Client added — login account ready." (created) / "Client added — login account already exists." (existing) / "Client added — sheet verified." (users step failed/unknown).

### /clients enrichment
- `clients/page.tsx`: batch users fetch via service client with one `email = "…" || …` filter (`email,name,mobile`); per-client muted mono line under the email: `name · mobile` (either may be absent). Fail-soft: service-client errors → email-only display.

### Days feed fail-soft (privacy hardening consequence)
- `days/page.tsx`: the display-name users `getFullList` previously used the **user token** — under the tightened users rules (`list/view = self or coach`) this **403s for client-role users**. Wrapped in try/catch; on failure the map stays empty and rows fall back to **'Athlete'** (was 'Unknown'). Page never crashes; coaches still see real names via the coach rule.

## P6 — Leaderboard

### parseWeightKg (`lib/google/sheets.ts`)
- Exported. Returns null for: empty, `bar`, `bw`, `bodyweight`, `amrap`, `sec`/`secs`, `steps`, standalone `m` (word-boundary or attached to a number, e.g. `12.5m`).
- Range `a-b kg` (optional single kg) → max; single `N kg` → N; anything else (bare numbers, typo units like `7.5kh`) → null (conservative).

### /leaderboard page
- Auth required via `getAuthUser`; non-auth → login prompt (same pattern as /days).
- **Service client** aggregates: all `clients` records (`email, sheet_id`) → per client with sheet_id, `fetchClientHistory(sheet_id, email)` (existing 5-min cache; per-sheet try/catch so one unreadable sheet never sinks the board) → entries with `parseWeightKg(weight) != null` → `{email, exercise, weightKg, weightRaw, date}`.
- Display names: batched users lookup by email via service client → `name`, else email local-part.
- `?exercise=` filter (case-insensitive); select options = distinct exercises sorted; default All; GET form.
- Top 20 ranked by weightKg desc, tie → latest date first. Columns: rank (red) / lifter / exercise / weight (raw, mono) / date (DD/MM/YYYY). Empty state: "No lifts on the board yet — log a day with a weighted exercise." Service-client failure degrades to an "unavailable" message, never a crash.
- Nav: "Leaderboard" link for ALL authenticated users, between Days and Today.

## Verification
- `npm install && npm run build` — clean (Next 16.2.9, Turbopack; TS pass; 18/18 pages; `/profile` + `/leaderboard` routes present).
- `grep -rn "@supabase" frontend/next/src frontend/next/package.json` → **0 matches**.
- Fixture test: `node tasks/feature-profile-leaderboard-20260918/parser-fixture-test.mjs` → **ALL CHECKS PASSED** (48 checks: 20 parseWeightKg cases incl. all required ones — 60kg→60, 12.5kg→12.5, "12.5-15 kg"→15, BW→null, "Bar+5kg plates"→null, "5kg +bar"→null, "20 sec"→null, "100 steps"→null, "M"→null, "7.5kh"→null — plus parseHistory, leaderboard aggregation/ranking, and appendDayBlock round-trip).

## Files changed
- Modified: `frontend/next/src/lib/google/sheets.ts`, `frontend/next/src/lib/actions/clients.ts`, `frontend/next/src/components/Nav.tsx`, `frontend/next/src/components/AddClientForm.tsx`, `frontend/next/src/app/clients/page.tsx`, `frontend/next/src/app/days/page.tsx`
- Added: `frontend/next/src/app/profile/page.tsx`, `frontend/next/src/lib/actions/profile.ts`, `frontend/next/src/components/ProfileForm.tsx`, `frontend/next/src/app/leaderboard/page.tsx`, `tasks/feature-profile-leaderboard-20260918/{plan.md,todo.md,parser-fixture-test.mjs,implementation-summary.md}`

## Behavior contracts
- Profile save uses the user's own token only; no service client involved.
- Cross-user reads (clients enrichment, leaderboard names, addClient users-ensure) use the service client strictly inside server components/actions, all fail-soft.
- Leaderboard shows only parseable weighted lifts; BW/bar/time/distance rows are excluded by design.
- No `.env` files touched; no version files touched.

## Unverifiable here
- Live PocketBase behavior (service-client auth, users create with random password, rule enforcement) — schema/rules were applied on dev02 by the orchestrator; not exercised in this environment.
- Real Google Sheets fetches (SA creds not present locally) — parser logic covered by the fixture test instead.
