# Orchestration Plan: TrainWithGouli Workout Tracker

## Task Overview

Build **TrainWithGouli**, a full-stack workout tracking web application for Coach Gouli. The app must support:

- User authentication with two roles: **admin** and **user**.
- A workout library page where exercises include **YouTube video links**.
- Both admins and users can create **workout plans**.
- Users can view all workouts but only edit/delete their own.
- When creating a new workout day and selecting an exercise, show a **weight nudge** based on the user's last recorded weight for that exercise.
- Data model aligned with the provided spreadsheet: `Date → WorkoutDay → ExerciseSets(Exercise, Weight, Reps, Sets)`.

## Task Classification

| Attribute | Value |
|-----------|-------|
| **Task Type** | feature |
| **Complexity** | complex (new application, 3+ files, auth + database + frontend + deployment) |
| **Task ID** | feature-trainwithgouli-workout-tracker-20260617 |
| **Branch** | `feature/trainwithgouli-workout-tracker` |
| **Worktree** | `~/workspace/worktrees/trainwithgouli/feature-trainwithgouli-workout-tracker` |

## Recommended Technology Stack

| Layer | Recommendation | Rationale |
|-------|----------------|-----------|
| **Frontend** | Next.js (App Router) + TypeScript | Required for server-side auth, role-based routing, and API routes for admin actions. |
| **Backend/Auth/DB** | Supabase (Postgres + Auth) | Fits existing skills, provides auth users, RLS for authorization, and Postgres for relational workout data. |
| **Styling** | Tailwind CSS | Rapid, consistent, responsive UI. |
| **Deployment** | Docker/Podman via existing `deploy-agent` | Will need to add Next.js build support to deployment scripts (currently static-only). |

**Alternative (simpler MVP):** Static HTML/CSS/JS + Supabase JS client. Faster to deploy but less secure for admin-role enforcement; RLS can still enforce ownership.

## Proposed Subagent Sequence

| # | Subagent | Phase | Purpose | Model |
|---|----------|-------|---------|-------|
| 1 | `git-worktree-operations` | Setup | Create isolated feature worktree and branch from `main`. | EDITOR |
| 2 | `code-research-agent` | Research | Research Supabase auth roles, RLS patterns, workout tracker schema patterns, Next.js auth best practices, YouTube embed strategies. | THINKING |
| 3 | `changes-fixes-agent` | Implementation | Orchestrate the build: delegate schema design to `database-dba`, UI to `frontend-developer`, auth/security review to `security-engineer`. | EDITOR |
| 4 | `database-dba` | Audit | Pre-deploy audit: migrations safe, RLS enabled, indexes present, DOWN migrations exist. | THINKING |
| 5 | `deploy-agent` | Deploy | Build Docker image and deploy to dev environment. | EDITOR |
| 6 | `git-worktree-operations` | Cleanup | Merge feature branch to `main`, push, remove worktree. | EDITOR |

## High-Level Schema (Proposed)

```text
auth.users (Supabase managed)
  └── profiles (id, user_id, role, display_name, created_at, updated_at)

exercises
  └── id, name, description, youtube_url, created_by, created_at, updated_at

workout_plans
  └── id, name, created_by, role_allowed (admin/user), created_at, updated_at

workout_plan_exercises
  └── id, plan_id, exercise_id, order_index

workout_days
  └── id, user_id, date, notes, created_at, updated_at

workout_sets
  └── id, workout_day_id, exercise_id, weight, reps, sets, notes, created_at, updated_at
```

## Key Features to Implement

1. **Auth & Roles**
   - Supabase Auth email/password login.
   - `profiles` table with `role` column (`admin` | `user`).
   - RLS policies: users read/update own profile; admins read all.

2. **Exercise Library**
   - CRUD for exercises (name, description, YouTube URL).
   - Admin can edit/delete any exercise; users can add exercises but only edit their own.

3. **Workout Plans**
   - Admin and users can create plans.
   - Plans contain ordered exercises.

4. **Daily Workout Logging**
   - Create a `workout_day` for a date.
   - Add sets with exercise, weight, reps, sets.
   - **Weight Nudge**: When selecting an exercise, query the most recent `workout_sets` for that exercise and user, then suggest that weight.

5. **Social Read-Only View**
   - Users can view other users' workout days and sets (RLS allows SELECT on all workout_days/sets).
   - Edit/delete restricted to owner via RLS.

## Risks & Considerations

- **Scope size**: This is a full-stack app from scratch. It may require multiple iterations.
- **Deployment infra**: Current deployment scripts target static frontend. Next.js deployment will require new Docker build and nginx routing.
- **Uncommitted changes**: `opencode.json` has local modifications that must be committed/stashed before worktree creation.
- **Secrets**: Supabase keys will be managed via Podman secrets per project rules.

## Proposed Folder Structure

Mirrors `~/workspace/manakeeshhub` exactly. Existing/placeholder directories are preserved; new directories are added only where needed for the Next.js frontend.

```
~/workspace/trainwithgouli/
├── frontend/
│   ├── next/                       # Next.js app source
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── scripts/
│   │   ├── .gitignore
│   │   ├── Dockerfile
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── README.md
│   │   ├── seed.sql
│   │   ├── seed-rest.sh
│   │   ├── test-db.ts
│   │   └── tsconfig.json
│   └── static/                     # Static site (existing/placeholder)
│       ├── components/
│       ├── icons/
│       ├── images/
│       ├── scripts/
│       ├── templates/
│       ├── Dockerfile
│       ├── entrypoint.sh
│       ├── index.html
│       ├── styles.css
│       ├── version.js
│       └── ...
├── backend/
│   ├── .gitignore
│   └── go/                         # Go backend services
│       ├── health/
│       └── otp-server/
├── deploy/
│   ├── deploy.sh                   # Main deploy wrapper
│   ├── docker-compose.yml
│   ├── nginx-proxy.conf
│   ├── frontend/
│   │   ├── next/
│   │   │   ├── deploy-dev.sh
│   │   │   ├── deploy-prod.sh
│   │   │   └── rollback.sh
│   │   └── static/
│   │       ├── deploy-dev.sh
│   │       ├── deploy-prod.sh
│   │       └── rollback.sh
│   ├── backend/
│   │   ├── deploy-dev.sh
│   │   ├── deploy-prod.sh
│   │   ├── rollback.sh
│   │   └── go/
│   └── systemd/
│       └── trainwithgouli-compose.service
├── infra/
│   └── ansible/
│       ├── ansible.cfg
│       ├── group_vars/
│       ├── inventory/
│       ├── playbooks/
│       └── roles/
├── scripts/
│   ├── frontend/
│   │   └── static/
│   │       └── build-docker.sh
│   ├── backend/
│   │   └── build-docker.sh
│   └── pgsql-parser/               # SQL migration lint/syntax checker
│       ├── package.json
│       ├── index.js
│       └── README.md
├── supabase/
│   ├── migrations/
│   ├── seed/
│   ├── run-migrations.sh
│   └── README.md
├── AGENTS.md
├── bump-version.sh
├── logo.svg
├── opencode.json
├── README.md
└── version.js
```

### Notes

- `frontend/next/` is the primary application for this feature.
- `scripts/frontend/static/build-docker.sh` is retained for the existing static site.
- `scripts/backend/build-docker.sh` builds Go backend images.
- `scripts/pgsql-parser/` is a small utility for parsing/linting Supabase migrations locally using `pgsql-parser` (libpg_query). It is placed under `scripts/` to match the tooling convention.
- Deployment scripts mirror manakeeshhub:
  - `deploy/deploy.sh` is the top-level wrapper.
  - `deploy/frontend/next/deploy-dev.sh` and `deploy-prod.sh` deploy the Next.js frontend.
  - `deploy/frontend/static/deploy-dev.sh` and `deploy-prod.sh` deploy the static site.
  - `deploy/backend/deploy-dev.sh`, `deploy-prod.sh`, and `rollback.sh` deploy backend services.
- The frontend Docker image tag will be:
  ```
  docker.io/muzammilmomin/trainwithgouli:frontend-v0.2.0
  ```

## Approval Request

To proceed with execution, reply with a message containing **"execute"** or **"implement"**.

You may also:
- Request changes to the plan.
- Choose the simpler static-site MVP.
- Ask to break this into smaller milestones.
