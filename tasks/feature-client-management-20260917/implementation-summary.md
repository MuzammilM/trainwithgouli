# Implementation Summary — feature-client-management-20260917

## What was built

### Scope A: /clients — coach-only client management with sheet-verification gate
- `frontend/next/src/lib/google/sheets.ts` — googleapis JWT auth built lazily inside functions (build never touches the SA key). Reads `GOOGLE_SA_KEY_FILE` (path) with `GOOGLE_SA_KEY` (JSON string) fallback. `parseSheetId` handles `/d/<id>/`, `?id=`, and bare IDs. `verifySheetAccess` calls `spreadsheets.get(fields: spreadsheetId)` and returns `{ok:true, sheetId}` or `{ok:false, code}`.
- `frontend/next/src/lib/actions/clients.ts` — `addClient(formData)`: coach-only; normalizes email, validates sheet URL, **hard-blocks save** when the SA cannot access the sheet (returns `{ok:false, code}` without creating a record); on verified access creates a `clients` record with `sheet_id`, `sheet_verified: true`, `verified_at`, then revalidates `/clients`. `removeClient(id)` with coach + ownership check.
- `frontend/next/src/app/clients/page.tsx` — coach-only (redirects to `/login` / `/` otherwise). IRON/RED list: email (mono), external sheet link, Verified (red) / Pending (muted) pill, Remove button. Server-rendered list filtered to the logged-in coach.
- `frontend/next/src/components/AddClientForm.tsx` — client component; email + sheet URL inputs; on submit shows inline result: success status, or a red alert box with the exact share steps naming `mcp-sheets-service@maps-planner-482115.iam.gserviceaccount.com` (Share → add as Viewer → re-submit).
- `frontend/next/src/components/Nav.tsx` — "Clients" link between Plans and Days, visible only when `user.role === 'coach'`; mobile row inherits.

### Scope B: version pill
- `frontend/next/src/components/VersionPill.tsx` — fixed bottom-right pill (z-30, below nav z-40), font-mono 11px, border/surface tokens, `v{version} — {caption}`; caption rotates deterministically by day-of-year across the 5 provided captions; hidden when version is empty.
- `frontend/next/src/app/layout.tsx` — renders `<VersionPill />` after `<Footer />`.
- `frontend/next/Dockerfile` — `ARG NEXT_PUBLIC_BUILD_VERSION` + `ENV` (mirrors `NEXT_PUBLIC_POCKETBASE_URL` handling).
- `scripts/frontend/next/build-docker.sh` — passes `--build-arg NEXT_PUBLIC_BUILD_VERSION="${CURRENT_VERSION}"` (already extracted from version.js; version.js untouched).

## Files changed
- Added: `src/lib/google/sheets.ts`, `src/lib/actions/clients.ts`, `src/app/clients/page.tsx`, `src/components/AddClientForm.tsx`, `src/components/VersionPill.tsx`
- Modified: `src/components/Nav.tsx`, `src/app/layout.tsx`, `Dockerfile`, `package.json`, `package-lock.json`, `scripts/frontend/next/build-docker.sh`
- Task artifacts: `tasks/feature-client-management-20260917/{plan.md,todo.md,implementation-summary.md}`

## Verification
- `npm install && npm run build` — clean (Next 16.2.9 Turbopack, TypeScript strict passes, `/clients` route present).
- `grep -rn "@supabase" src/` → zero matches.
- `version.js` untouched (deploy-time bump only).

## Notes
- `googleapis` added to dependencies; JWT client construction is lazy so the SA key file is only read at request time, never at build.
- SA key expected at runtime (`/run/secrets/google_sa.json` via `GOOGLE_SA_KEY_FILE`) — not verifiable locally without the key.
- PocketBase `clients` collection (coach/email/sheet_url/sheet_id/sheet_verified/verified_at) already provisioned by orchestrator.

## Post-deploy manual test checklist
1. Log in as a coach → Nav shows "Clients" between Plans and Days; open `/clients`.
2. Add a client with a sheet NOT shared with the SA → form is blocked with a red alert showing the 3 share steps naming `mcp-sheets-service@maps-planner-482115.iam.gserviceaccount.com`; no record saved.
3. Share that sheet with the SA as Viewer → re-submit → success; list shows the client with a red "Verified" pill and a working external sheet link.
4. Remove button deletes the client and refreshes the list.
5. Log in as a non-coach → "Clients" link hidden; navigating directly to `/clients` redirects to `/`.
6. Version pill visible bottom-right on every route showing `v{version} — {caption}`; caption changes with day-of-year.
