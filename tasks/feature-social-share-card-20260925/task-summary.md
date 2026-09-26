# Task Summary — feature-social-share-card-20260925

## User Request
As a client, post a daily progress tracker on social media matching the provided mockup
(brutalist dark share card: header brand strip, name+date, session title, 4 hero stats,
muscle-focus heatmap + bars, exercise list table, footer tagline + location).

## Detected Intent
- Task type: **feature** (new UI surface + share/export flow)
- Target app: `frontend/next/` (client workout tracker; no static site involvement)
- Mockup ratio: portrait ~9:16 (Instagram story / feed friendly), dark brutalist aesthetic
  matching existing PRODUCT.md principles (high contrast, monospace, exposed borders)

## Key Mockup Elements to Reproduce
1. Header: `trainwithgouli.com` brand + `STRENGTH / MARTIAL ARTS / REHABILITATION / REAL PROGRESS`
2. Name, date; session title (e.g. "LOWER / PULL TRAINING SESSION")
3. 4 stat tiles: exercises count, working sets, total volume kg (excl. BW), duration min
4. Muscle focus: front/back body heatmap + bars (Legs, Back, Arms, Core, Conditioning)
5. Exercise table: # / exercise / weight / reps × sets
6. Footer: "TRAINED WITH PURPOSE. ONE REP AT A TIME." + location

## Implementation Approach (proposed)
- Share card rendered as HTML/CSS in-app (route `/share/[date]` or modal), styled per mockup
- PNG export client-side (html-to-image / dom-to-image) at 1080×1920, plus Web Share API where available
- Stats computed from existing day data (lib/google sheets API + lib/body-parts.ts for muscle mapping)
- Entry points: Share button on `today` page + `days` history page

## Required Subagents (feature flow)
1. git-worktree-operations — create worktree/branch (hard gate)
2. code-research-agent — map day/workout data sources, today + days pages, body-parts lib
3. changes-fixes-agent → delegates to ui-implementer (new UI) — build share card + share flow
4. validator-agent — validate implementation
5. database-dba — audit mode ONLY if DB/migrations touched (expected: none)
6. deploy-agent — OPTIONAL, gated on user approval

## Model States
| Subagent | Model tier |
|---|---|
| git-worktree-operations | EDITOR |
| code-research-agent | THINKING |
| changes-fixes-agent / ui-implementer | THINKING / SENIOR |
| validator-agent | SENIOR |
| database-dba | THINKING (if run) |
| deploy-agent | EDITOR (if run) |

## Failure Tracking
- failure_counts: {} (none yet)

## Approval Status
- AUTHORIZED 2026-09-25: user message "merge and deploy to dev" = full execution
  authorization (end-to-end incl. merge + dev deploy). auto_approve: true.
- Deploy: **APPROVED → dev only** (ansible-playbook -i infra/ansible/inventory/dev.yml
  infra/ansible/playbooks/deploy.yml -e deploy_version=X; image
  docker.io/muzammilmomin/trainwithgouli:frontend-vX). Prod NOT approved.

## Decisions (from user)
- Template approach: hybrid — template PNG as background + HTML overlay (approved by
  user providing template file)
- Template source: ~/workspace/smarann/gdrive/6cf8b64c759c4d3a31756638d314b5fc194444fbe685d6e9618e3b028761c7ee.png
  (941×1672, 9:16, ~1.7MB — user explicitly granted access to this path)
  → copy into frontend/next/public/share/card-template.png in the worktree
- Footer location: "MYSORE, INDIA" hardcoded
- Share entry points: /today-client header (after logging) + each row on /days history

## Deploy Pattern (from deploy/README.md + infra/ansible)
- Dev: ansible-playbook -i infra/ansible/inventory/dev.yml infra/ansible/playbooks/deploy.yml -e deploy_version=X
- Frontend image: docker.io/muzammilmomin/trainwithgouli:frontend-vX (frontend/next/Dockerfile)
- Dev domain: server01.taild68ded.ts.net (Tailscale); app must NOT bind 80/443 (shared gateway)
- NOTE: basic-memory MCP tools unavailable in this session — context mirrored to ./tasks/ only

## REL Tag
- NOT allocated — `deploy/rel-allocate.sh` and `deploy/releases/` do not exist in this repo
  state (REL flow tooling absent). Skipping per tooling availability.

## Resume Info
- resume_mode: false
- last_completed_subagent: null
- next_subagent: git-worktree-operations
- task_ids: {}

## Time Tracking
- task_start_time: 2026-09-25T00:00:00+05:30
- current_subagent_start_time: null
- total_elapsed_seconds: 0
- elapsed_by_subagent: {}
- soft_threshold_seconds: 1500 (feature)
- hard_threshold_seconds: 2400 (feature)
- time_status: "ok"
