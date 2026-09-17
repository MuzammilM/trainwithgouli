# P2: Client management + version pill — feature-client-management-20260917

## Backend (already provisioned by orchestrator)
- clients collection has: coach (rel users), email, sheet_url, sheet_id (text req), sheet_verified (bool), verified_at (date). Rules: coach-only.
- SA key mounted at /run/secrets/google_sa.json in the frontend container; env GOOGLE_SA_KEY_FILE points to it. SA: mcp-sheets-service@maps-planner-482115.iam.gserviceaccount.com, project maps-planner-482115.

## Scope A — /clients (coach-only)
1. lib/google/sheets.ts: googleapis JWT auth from GOOGLE_SA_KEY_FILE (fallback GOOGLE_SA_KEY json string), scope https://www.googleapis.com/auth/spreadsheets. parseSheetId(url) handles /d/<id>/ and ?id=. verifySheetAccess(sheetUrl): spreadsheets.get(id, fields: spreadsheetId) → {ok:true} | {ok:false, code}.
2. lib/actions/clients.ts: requireCoach(); addClient(formData): normalize email, parse+validate sheet URL, verify access; if NOT ok → return {ok:false, code} and DO NOT save (hard block per product spec); if ok → create clients record {coach: user.id, email, sheet_url, sheet_id, sheet_verified: true, verified_at: today}, revalidate /clients. removeClient(id) with coach check. listClients via page server component.
3. app/clients/page.tsx: coach-only (non-coach → redirect '/'); IRON/RED table/cards: email, sheet link (external, target _blank), Verified pill (red=verified, muted=pending), remove button. AddClientForm (client component): email + sheet URL inputs; on submit show inline result — success: refresh list; blocked: red alert box with steps: "1. Open your Google Sheet → Share 2. Add mcp-sheets-service@maps-planner-482115.iam.gserviceaccount.com as Viewer 3. Re-submit". Also a standalone "Verify only" affordance is NOT needed — re-submit is the re-check.
4. Nav.tsx: add "Clients" link, visible only when user.role === 'coach', between Plans and Days. Mobile row inherits automatically.

## Scope B — version pill
1. build-docker.sh: pass --build-arg NEXT_PUBLIC_BUILD_VERSION="${CURRENT_VERSION}" (already extracted). Dockerfile: ARG NEXT_PUBLIC_BUILD_VERSION="" + ENV NEXT_PUBLIC_BUILD_VERSION.
2. components/VersionPill.tsx: fixed bottom-right pill (z-30, below nav z-40), font-mono text-[11px], border var(--border), bg surface, muted text: `v{version} — {caption}`. Captions rotate deterministically by day-of-year from: ["reps lifted in the gym","chalked up and logged","forged under the bar","earned one rep at a time","no shortcuts. only sets."]. Hidden if version empty. Render in root layout next to Footer. Global CSS not needed — Tailwind only.
3. Do NOT touch version.js (deploy-time bump is orchestrator's job).

## Verify
npm run build clean. grep no @supabase. Manual: /clients as coach (after deploy + seed), blocked-add shows share instructions with a non-shared sheet.

## Out of scope
P3 sheets history sync, P4 day page, deploy (orchestrator).
