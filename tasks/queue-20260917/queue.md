# Queue: trainwithgouli-website-relaunch — 2026-09-17

## Queue Table

| # | Title | Type | Priority | Status | Task ID |
|---|-------|------|----------|--------|---------|
| Q-1 | Merge feature/sync-agents-from-manakeeshhub to main | fix | high | pending | merge-agents-to-main-20260917 |
| Q-2 | Redesign website (impeccable): black/red gritty, mobile-first | feature | high | pending | feature-gouli-website-redesign-20260917 |
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
