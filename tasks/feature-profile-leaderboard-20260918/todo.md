# Todo — feature-profile-leaderboard-20260918

- [x] Phase 1: Investigation — plan.md, clients.ts, admin.ts, sheets.ts, Nav.tsx, clients/page.tsx, DESIGN.md, days/page.tsx, prior fixture test read
- [x] Phase 2: Setup — worktree exists at feature-profile-leaderboard-20260918 (branch already checked out)
- [ ] Phase 3: Implementation
  - [x] P5.1 /profile page + lib/actions/profile.ts (name/mobile self-update, ?saved=1 banner)
  - [x] P5.2 Nav: user name → Link to /profile
  - [x] P5.3 addClient: ensure users record via service client (non-blocking, success message surfaces account state)
  - [x] P5.4 /clients: name + mobile enrichment via service client
  - [x] P5.5 days feed: fail-soft users lookup (try/catch → 'Athlete')
  - [x] P6.1 parseWeightKg in sheets.ts + extended fixture test (≥8 cases)
  - [x] P6.2 /leaderboard page (service-client aggregation, exercise filter, top 20)
  - [x] P6.3 Nav: Leaderboard link for all authenticated users
  - [x] npm install && npm run build clean
  - [x] grep @supabase zero
  - [x] run fixture test with node, paste results
- [x] Phase 4: Commit (single commit a67f86c, no version bump)
- [x] implementation-summary.md
