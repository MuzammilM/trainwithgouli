# P1: PocketBase auth foundation — feature-pocketbase-auth-20260917

## Goal
Replace Supabase with PocketBase in frontend/next: SDK layer, Google SSO login, session cookies, invite-only enforcement, remove all Supabase code. Deploy to dev follows separately (orchestrator).

## Backend (PocketBase dev02, already configured)
- URL: https://pocketbase.mzm.co.in (NEXT_PUBLIC_POCKETBASE_URL at build)
- users collection: role select (coach/client, default client), verified; Google OAuth2 enabled; password auth DISABLED (Google-only)
- Service superuser: POCKETBASE_SERVICE_EMAIL / POCKETBASE_SERVICE_PASSWORD (server-only env, never NEXT_PUBLIC, never client-side)
- clients collection (new, minimal): coach (relation→users), email (text), sheet_url (url, optional), created (autodate). Rules: coach full access; nothing for clients yet (P2)

## Auth architecture (mandatory pattern)
- lib/pocketbase/client.ts — browser singleton (NEXT_PUBLIC_POCKETBASE_URL)
- lib/pocketbase/server.ts — serverClient(): reads pb_auth httpOnly cookie via next/headers, pb.authStore.save(token), returns pb
- lib/pocketbase/admin.ts — serviceClient(): authWithPassword(POCKETBASE_SERVICE_*) for privileged ops (allowlist check, coach listing users)
- lib/actions/auth.ts — setSession(token): validate via admin client + allowlist (role==coach OR email exists in clients) → set cookie, redirect '/'; failure → clear cookie, /login?error=not-registered. logout(): clear cookie.
- Login page: "Continue with Google" → client pb.collection('users').authWithOAuth2({provider:'google'}) → on success POST token to setSession. Styled error box for ?error= (already in IRON/RED vocabulary). NO password fields, NO signup page (invite-only: delete /signup, redirect to /login).
- Nav/user display: name + [coach] badge via serverClient; isAdmin → role==='coach'.

## Pages migrated (createClient swap + actions)
All server components: home, exercises(+new/edit), plans(+new/edit), days(+id/new), api/last-weight. Server actions in lib/actions/* rewritten to PocketBase (exercises, plans, days) using server client; RLS-equivalent checks stay (owner/coach) enforced in actions via user id.

## Infra code
- package.json: remove @supabase/*, add pocketbase
- DELETE src/utils/supabase/*, src/middleware.ts, src/utils/supabase/middleware.ts (no middleware needed)
- scripts/frontend/next/build-docker.sh + frontend/next/Dockerfile: add NEXT_PUBLIC_POCKETBASE_URL build arg (default https://pocketbase.mzm.co.in)
- .env* files: DO NOT create/read/touch. Env comes from deploy step.

## Verify
npm run build clean. Note: real Google click-through needs human login — document as manual test.

## Out of scope
P2 client-management UI, P3 sheets, P4 day page, deploy (orchestrator runs deploy).
