# Queue: trainwithgouli-website-relaunch — 2026-09-17

## Queue Table

| # | Title | Type | Priority | Status | Task ID |
|---|-------|------|----------|--------|---------|
| Q-1 | Merge feature/sync-agents-from-manakeeshhub to main | fix | high | **completed** (c438f44 pushed) | merge-agents-to-main-20260917 |
| Q-2 | Redesign website (impeccable): black/red gritty, mobile-first | feature | high | **completed** (30614ca, branch `feature/gouli-website-redesign-20260917`) | feature-gouli-website-redesign-20260917 |
| Q-3 | Google Sheets integration via gog CLI (creds from ~/workspace/manakeeshhub) | feature | medium | pending | — |
| Q-4 | Google SSO setup (from ~/workspace/smarann) | feature | medium | pending | — |
| Q-5 | Gouli client management (add client, verify SA share, first user madebymzm@gmail.com) | feature | medium | pending | — |
| Q-6 | Workout generation w/ YouTube links + last-weight from sheet | feature | medium | pending | — |

## Q-1: Merge current feature branch to main

- Branch `feature/sync-agents-from-manakeeshhub` is at same commit as `main` (73ceb34).
- Uncommitted: `.opencode/agents/*.md` (thin-shell refactor), `.opencode/agents/_shared/` (new logic files + tools), `.agents/` (skills), `tasks/feature-trainwithgouli-workout-tracker-20260617/` (orchestration mirrors), `.research-cache/`, `skills-lock.json`.
- Action: commit pending agent-sync changes on feature branch, checkout main, merge, push.

## Q-2: Website Redesign (impeccable skill)

- **Surface**: `frontend/next/` (existing Next.js app, already deployed infra).
- **Design brief**: Bold black + red themes, gritty/high-powered gym aesthetic. Nav bar top with "trainwithgouli" brand on the RIGHT. Footer at base. Smooth animations on page navigation. Mobile-first (most users on mobile).
- **Model**: User requested `kimi-for-coding/k3-256k` + impeccable skill. Orchestrator session runs `kimi-for-coding/kimi-for-coding`; k3 switch needs session restart (thin-shell). Flag to user before execution.
- Next steps (Q-3..Q-6) explicitly deferred by user: "We'll work on the next steps after."


## Q-2 Result (completed 2026-09-17)

- IRON/RED redesign committed as 30614ca on branch `feature/gouli-website-redesign-20260917` (worktree: ~/workspace/worktrees/trainwithgouli/feature-gouli-website-redesign-20260917). NOT merged to main yet — awaiting user review.
- 21 files: globals.css token world, layout+fonts, Footer (new), Nav (brand right), template.tsx transitions, home hero, login/signup split, DESIGN.md rewrite, ui-brief + implementation-summary.
- Verified via headless Chromium measurements: build clean, WCAG contrast all >=4.5 (canvas-sampled), no h-overflow at 375px, route transition animation mid-flight confirmed, reduced-motion off switch works.
- Fixed latent Tailwind v4 cascade bug (unlayered base styles overriding utilities) — predates redesign.
- Next decisions for user: review (screenshots in /tmp/opencode/shots/), merge to main, deploy to dev.


## Deploy to dev (2026-09-17)

- Merged feature/gouli-website-redesign-20260917 to main (fast-forward), version 0.3.0 assigned at deploy time (de0f290), pushed.
- Built + pushed docker image muzammilmomin/trainwithgouli:frontend-v0.3.0 (linux/amd64).
- Dev: recreated trainwithgouli-frontend-next container (~/trainwithgouli/docker-compose.yml, VERSION=0.3.0, frontend service only).
- Gateway: trainwithgouli.conf was in disabled/ — moved to conf.d, nginx -t + reload. https://trainwithgouli.mzm.co.in live 200.
- CAVEAT: image built with placeholder Supabase values (same as v0.2.0 — auth never worked on dev). Real anon/publishable key needed from Supabase dashboard for auth; Supabase migrations also still unapplied (auth/DB features dead until then).
- Rollback: podman-compose up -d frontend-next with VERSION=0.2.0 (image still on hub).
