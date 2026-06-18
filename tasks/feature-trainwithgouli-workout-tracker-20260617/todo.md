# Task Checklist: feature-trainwithgouli-workout-tracker-20260617

> Note: `todowrite` tool is not available in this environment; checklist mirrored to this file.

## Phase 1: Investigation — COMPLETED
- [x] Load workflow rules and analyze request
- [x] Identify affected files and components
- [x] Review existing project structure and manakeeshhub reference

## Phase 2: Setup — COMPLETED
- [x] Verify worktree exists and is clean
- [x] Confirm branch `feature/trainwithgouli-workout-tracker`

## Phase 3: Implementation — COMPLETED
- [x] Create `frontend/next/Dockerfile`
- [x] Create `scripts/frontend/next/build-docker.sh` and make executable
- [x] Create deploy scripts (`deploy/deploy.sh`, `deploy/frontend/next/deploy-dev.sh`, `deploy-prod.sh`, `rollback.sh`)
- [x] Create `deploy/docker-compose.yml`
- [x] Create `deploy/nginx-proxy.conf`
- [x] Create `deploy/systemd/trainwithgouli-compose.service`
- [x] Create Ansible skeleton (`ansible.cfg`, inventories, playbooks, roles, vault placeholders)
- [x] Create `scripts/pgsql-parser/` utility (package.json, index.js, README.md)
- [x] Update root `.gitignore`
- [x] Update root `README.md`
- [x] Make all shell scripts executable
- [x] Syntax-check all shell scripts

## Phase 4: Version & Commit — COMPLETED
- [x] File impact assessment: internal/deployment files only — version bump skipped (per instruction)
- [x] Stage all changes
- [x] Commit to feature branch with `[chore]:` prefix
- [x] Commit hash: bbf34b1
- [x] Report summary of files created
