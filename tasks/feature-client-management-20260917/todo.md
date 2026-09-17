# Checklist — feature-client-management-20260917

- [x] Phase 1: Investigation — plan.md, DESIGN.md, Nav/login/plans patterns, pocketbase lib read ✓
- [x] Phase 2: Setup — worktree exists, branch feature-client-management-20260917 checked out, clean ✓
- [x] Phase 3: Implementation
  - [x] lib/google/sheets.ts (lazy JWT, verifySheetAccess, parseSheetId)
  - [x] lib/actions/clients.ts (addClient hard block, removeClient)
  - [x] app/clients/page.tsx (coach-only, IRON/RED list)
  - [x] components/AddClientForm.tsx (client component, blocked state with share instructions)
  - [x] Nav.tsx "Clients" link gated to coach
  - [x] components/VersionPill.tsx + root layout render
  - [x] Dockerfile + build-docker.sh NEXT_PUBLIC_BUILD_VERSION
  - [x] googleapis dependency added
- [x] Phase 4: Verify & Commit — build clean, no @supabase, version.js untouched, commit 75fb343, implementation-summary.md written
