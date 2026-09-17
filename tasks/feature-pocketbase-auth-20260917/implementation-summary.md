# Implementation Summary: feature-pocketbase-auth-20260917

## P1: PocketBase auth foundation — Supabase → PocketBase migration (frontend/next)

## Architecture

- **SDK layer** (`src/lib/pocketbase/`):
  - `client.ts` — browser singleton factory using `NEXT_PUBLIC_POCKETBASE_URL` (default `https://pocketbase.mzm.co.in`).
  - `server.ts` — `serverClient()` reads the `pb_auth` httpOnly cookie via `next/headers` and saves the token into `pb.authStore`; `getAuthUser()` (React `cache`-memoized per request) validates the token with `authRefresh()` and returns `{id, email, name, role}` or null.
  - `admin.ts` — `serviceClient()` authenticates as the service superuser (`POCKETBASE_SERVICE_EMAIL`/`POCKETBASE_SERVICE_PASSWORD`) against `_superusers`. Server-only (`import 'server-only'`); throws **lazily inside the function** so builds without the creds succeed (creds are runtime-only, injected at deploy).
- **Auth flow** (`src/lib/actions/auth.ts`):
  - `setSession(token)` — server action. Validates the OAuth token via `authRefresh`, then applies the invite allowlist: `role === 'coach'` OR the user's email exists in the `clients` collection (queried via the admin client). Pass → sets `pb_auth` cookie (httpOnly, path `/`, sameSite lax, ~30d) and redirects `/`. Fail → clears cookie, redirects `/login?error=not-registered`.
  - `logout()` — clears the `pb_auth` cookie, redirects `/login`.
  - `GoogleButton` (client component) — `pb.collection('users').authWithOAuth2({ provider: 'google' })`, then POSTs the resulting token to `setSession`.
- **Login page** — Google-only ("Continue with Google"), no password fields. Styled error box (`role="alert"`, IRON/RED tokens) maps `?error=not-registered` → "This email isn't registered with a coach yet."
- **Invite-only** — `src/app/signup` deleted; home page CTAs and Nav now point to `/login` only.

## Data mapping (Supabase → PocketBase)

| Supabase | PocketBase |
|---|---|
| `profiles.role/display_name` | `users.role` / `users.name` (fields on the auth record) |
| `isAdmin` (role==='admin') | `role === 'coach'` |
| numeric ids | string record ids (builders' prop types updated `number` → `string`) |
| RLS | owner-or-coach checks enforced in server actions via `created_by`/`user_id` vs `user.id` |
| joined selects (`plan_exercises(*, exercises(name))`) | separate `getFullList` queries with `expand: 'exercise'`, grouped in JS |

## Files changed

**New**
- `src/lib/pocketbase/client.ts`, `server.ts`, `admin.ts`
- `src/components/GoogleButton.tsx`

**Rewritten (backend swap, UI markup/classes preserved)**
- `src/lib/actions/auth.ts` (setSession/logout; login/signup password actions removed)
- `src/lib/actions/exercises.ts`, `plans.ts`, `days.ts` (PocketBase CRUD + owner-or-coach checks)
- `src/app/page.tsx`, `src/app/login/page.tsx`, `src/components/Nav.tsx`
- `src/app/exercises/{page,new/page,[id]/edit/page}.tsx`
- `src/app/plans/{page,new/page,[id]/edit/page}.tsx`
- `src/app/days/{page,new/page,[id]/page}.tsx`
- `src/app/api/last-weight/route.ts` (nested-relation filter `workout_day_id.user_id`)
- `src/components/{DaySetBuilder,PlanExerciseBuilder}.tsx` (id types only — no UI change)

**Deleted**
- `src/utils/supabase/*` (client/server/middleware), `src/middleware.ts`, `src/app/signup/`, `src/components/AuthSubmitButton.tsx` (unused after Google-only login)

**Config**
- `package.json`: removed `@supabase/ssr`, `@supabase/supabase-js`; added `pocketbase`
- `frontend/next/Dockerfile`: `ARG/ENV NEXT_PUBLIC_POCKETBASE_URL` (default `https://pocketbase.mzm.co.in`), Supabase args removed
- `scripts/frontend/next/build-docker.sh`: `NEXT_PUBLIC_POCKETBASE_URL` build arg (same default), Supabase args removed

## Verification

- `npm install && npm run build` — **clean** (Next 16.2.9, TS strict, 12 routes).
- `grep -rn "@supabase" src/` — **zero hits**.
- Build succeeds with no env vars set (POCKETBASE_SERVICE_* throw lazily at runtime, not module init).

## Manual test checklist (requires human Google login)

1. **Coach sign-in**: visit `/login` → "Continue with Google" → sign in as `harishgouli27@gmail.com` → lands on `/`, Nav shows name + `[coach]` badge; exercises/plans/days pages load and edit/delete work.
2. **Not-registered rejection**: sign in with a Google account NOT in `clients` and not a coach → redirected to `/login?error=not-registered` with the alert box "This email isn't registered with a coach yet."
3. **Registered client**: add a test email to the `clients` collection (coach relation + email), sign in with that Google account → allowed in, no `[coach]` badge.
4. **Logout**: click "Log out" → cookie cleared, redirected to `/login`; back-button/refresh shows logged-out state.

## Known gaps

- **API rules are still admin-only** on the data collections until P2 opens them up — reads/writes go through the server client (user token) so they will 403 until rules are set; the service client path (allowlist check) works.
- **Service creds must be injected at deploy time** (`POCKETBASE_SERVICE_EMAIL`/`POCKETBASE_SERVICE_PASSWORD`); without them, login of non-coach users fails the allowlist check (treated as not-registered) and any admin-client operation throws.
- Real Google OAuth click-through could not be verified in CI — manual test above.
- No Next middleware replacement — route protection is per-page (existing pattern preserved).
