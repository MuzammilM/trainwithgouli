# Database Audit Report — Final

**Task ID**: feature-trainwithgouli-workout-tracker-20260617  
**Worktree Path**: `~/workspace/worktrees/trainwithgouli/feature-trainwithgouli-workout-tracker`  
**Migration Files Reviewed**:

- `supabase/migrations/0001_trainwithgouli_init.sql`
- `supabase/migrations/0002_trainwithgouli_rollback_init.sql`

**Audit Date**: 2026-06-18  
**Auditor**: Database DBA  
**Status**: 🔴 **BLOCK**

---

## Executive Summary

The migration set has improved significantly since the previous audit: the rollback SQL is now isolated in a separate file, `custom_access_token_hook` is hardened, every table has RLS + `FORCE ROW LEVEL SECURITY` + `service_role` policies, all foreign keys are indexed, and the first-admin trigger logic is correct.

However, one new critical schema defect blocks deployment: `public.plan_exercises` has a `BEFORE UPDATE` trigger that assigns `NEW.updated_at`, but the table does not have an `updated_at` column (or a `created_at` column). Any `UPDATE` on `plan_exercises` will raise a runtime error and fail. This must be fixed before the migration can ship.

---

## Checklist Results

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | DOWN migration exists in a separate file and is complete | ✅ PASS | `0002_trainwithgouli_rollback_init.sql` reverses the UP in dependency order. |
| 2 | `custom_access_token_hook` is `SECURITY DEFINER` with safe `search_path` | ✅ PASS | Line 41 `security definer`, line 42 `set search_path = ''`. Grants/revokes are correct. |
| 3 | Every table has RLS enabled + `FORCE ROW LEVEL SECURITY` + policies | ⚠️ PASS with caveat | All 6 tables are enabled and forced. However, `plan_exercises` will fail updates due to the missing `updated_at` column referenced by its trigger. |
| 4 | `service_role` policies exist on all tables | ✅ PASS | Lines 161–177. Every public table has a `FOR ALL TO service_role` policy. |
| 5 | Every foreign key has an index | ✅ PASS | All FK columns are covered by dedicated or leading-composite indexes. |
| 6 | First-admin trigger logic is correct | ✅ PASS | `WHERE id <> NEW.id` correctly excludes the newly inserted row. |
| 7 | No dangerous locking operations | ✅ PASS | Initial empty-table migration; `CREATE INDEX CONCURRENTLY` is unnecessary and not used. |

---

## Migration Safety

| Check | Result | Notes |
|---|---|---|
| DOWN migration in separate file | ✅ PASS | `0002_trainwithgouli_rollback_init.sql` is outside the forward-only migration path. |
| DOWN migration completeness | ✅ PASS | Drops triggers, functions, tables (children before parents), and the enum type. |
| Dangerous locking operations | ✅ PASS | No `CREATE INDEX CONCURRENTLY` required for empty initial tables. |
| Destructive operations in UP | ✅ PASS | No `DROP TABLE`, `DROP COLUMN`, or `ALTER COLUMN TYPE` in the UP migration. |
| Transaction safety | 🟡 WARN | Statements are not wrapped in an explicit `BEGIN`/`COMMIT`. Supabase CLI executes migrations in a transaction, but explicit wrapping is clearer and safer. |

---

## RLS Verification

### RLS Enablement

| Table | RLS Enabled | FORCE RLS | Verdict |
|---|---|---|---|
| `public.profiles` | ✅ | ✅ | Pass |
| `public.exercises` | ✅ | ✅ | Pass |
| `public.workout_plans` | ✅ | ✅ | Pass |
| `public.plan_exercises` | ✅ | ✅ | Pass (RLS config valid; table UPDATE will still fail for unrelated schema reason) |
| `public.workout_days` | ✅ | ✅ | Pass |
| `public.workout_sets` | ✅ | ✅ | Pass |

### Policy Coverage by Role

| Table | `anon` | `authenticated` SELECT | `authenticated` INSERT | `authenticated` UPDATE | `authenticated` DELETE | `service_role` |
|---|---|---|---|---|---|---|
| `profiles` | ❌ none | ✅ own + admin | ❌ none* | ✅ own | ❌ none* | ✅ all |
| `exercises` | ❌ none | ✅ all auth | ✅ owner/admin | ✅ owner/admin | ✅ owner/admin | ✅ all |
| `workout_plans` | ❌ none | ✅ all auth | ✅ owner/admin | ✅ owner/admin | ✅ owner/admin | ✅ all |
| `plan_exercises` | ❌ none | ✅ all auth | ✅ via plan owner | ✅ via plan owner | ✅ via plan owner | ✅ all |
| `workout_days` | ❌ none | ✅ all auth | ✅ own | ✅ own/admin | ✅ own/admin | ✅ all |
| `workout_sets` | ❌ none | ✅ all auth | ✅ via day owner | ✅ via day owner | ✅ via day owner | ✅ all |

\* `profiles` INSERT/DELETE are intentionally omitted because the auth trigger creates the row and users should not self-delete profiles. This is acceptable and documented in the migration comments.

### RLS Notes

- No `anon` policies are defined. The application requires authentication for all data access, so this is acceptable.
- `workout_days` and `workout_sets` are globally readable to all authenticated users by design (documented in the migration). If this is not the intended product behavior, scope SELECT to `user_id = auth.uid()` or `public.is_admin()`.

---

## Index Verification

| Foreign Key | Column(s) | Indexed? | Index Name / Notes |
|---|---|---|---|
| `profiles.id` → `auth.users(id)` | `id` | ✅ (PK) | Primary key index |
| `exercises.created_by` → `profiles(id)` | `created_by` | ✅ | `idx_exercises_created_by` |
| `workout_plans.created_by` → `profiles(id)` | `created_by` | ✅ | `idx_workout_plans_created_by` |
| `plan_exercises.plan_id` → `workout_plans(id)` | `plan_id` | ✅ | `idx_plan_exercises_plan_id` |
| `plan_exercises.exercise_id` → `exercises(id)` | `exercise_id` | ✅ | `idx_plan_exercises_exercise_id` |
| `workout_days.user_id` → `profiles(id)` | `user_id` | ✅ (leading) | Covered by `idx_workout_days_user_id_date` |
| `workout_sets.workout_day_id` → `workout_days(id)` | `workout_day_id` | ✅ (leading) | Covered by `idx_workout_sets_day_exercise` |
| `workout_sets.exercise_id` → `exercises(id)` | `exercise_id` | ✅ (leading) | Covered by `idx_workout_sets_exercise_user` |

All foreign keys are indexed. ✅

---

## Auth Hook Security

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| `custom_access_token_hook` marked `SECURITY DEFINER` | Required | ✅ Line 41 | PASS |
| Safe `search_path` set on hook | Required (`set search_path = ''`) | ✅ Line 42 | PASS |
| Grant/revoke executed correctly | Grant to `supabase_auth_admin`, revoke from `authenticated`, `anon`, `public` | ✅ Lines 57–58 | PASS |

The hook correctly reads `public.profiles` under a fixed search path and injects `user_role` into the JWT.

---

## Schema Integrity & Triggers

| Check | Result | Notes |
|---|---|---|
| `created_at` defaults present | ⚠️ WARN | All tables except `plan_exercises` have `created_at timestamptz NOT NULL DEFAULT now()`. `plan_exercises` lacks both timestamp columns. |
| `updated_at` columns present | ❌ BLOCK | `plan_exercises` does not have an `updated_at` column. |
| `updated_at` auto-update trigger | ❌ BLOCK | `public.set_updated_at()` trigger is attached to `plan_exercises`, but the table has no `updated_at` column, so every `UPDATE` on that table will fail. |
| Data types | ✅ PASS | Uses `uuid`, `bigint generated always as identity`, `timestamptz`, `text`, `numeric(8,2)`. No `SERIAL` or `TIMESTAMP` without timezone. |
| Enum type | ✅ PASS | `public.app_role` enum is appropriate. |
| Auth trigger `handle_new_user` | ✅ PASS | `SECURITY DEFINER` with `set search_path = ''`. |
| First-admin trigger `handle_first_user_admin` | ✅ PASS | AFTER INSERT trigger correctly uses `id <> NEW.id` to detect the first user. |
| Function hardening | ✅ PASS | `handle_new_user`, `handle_first_user_admin`, and `set_updated_at` are revoked from `public`, `anon`, and `authenticated`. |
| `is_admin()` search_path | ✅ PASS | `set search_path = ''` is present. |

---

## Findings

| Severity | Finding | Location | Remediation |
|---|---|---|---|
| 🔴 BLOCK | `plan_exercises` references `NEW.updated_at` in its `set_updated_at` trigger, but the table has no `updated_at` column. Every `UPDATE` on this table will fail at runtime. | `0001_trainwithgouli_init.sql` lines 82–91, 451–453 | Add `created_at timestamptz NOT NULL DEFAULT now()` and `updated_at timestamptz NOT NULL DEFAULT now()` columns to `plan_exercises`. |
| 🟡 WARN | `plan_exercises` is inconsistent with other tables: it lacks `created_at` and `updated_at` timestamp columns. | `0001_trainwithgouli_init.sql` lines 82–91 | Add timestamp columns as part of the `plan_exercises` fix. |
| 🟡 WARN | `workout_days` and `workout_sets` SELECT policies expose all users' workout logs to every authenticated user. | `0001_trainwithgouli_init.sql` lines 320–324, 356–360 | Confirm product requirement. If workouts should be private, scope SELECT to `user_id = auth.uid()` or `public.is_admin()`. |
| 🟡 WARN | UP migration is not wrapped in an explicit `BEGIN`/`COMMIT` block. | `0001_trainwithgouli_init.sql` entire file | Add `BEGIN;` at the start and `COMMIT;` at the end for clearer transaction boundaries. |
| 🟢 LOW | Rollback script drops a trigger on `auth.users`, which requires elevated privileges in Supabase. | `0002_trainwithgouli_rollback_init.sql` line 16 | Document that the rollback must be run by a superuser/service-role process, or use the Supabase Dashboard/CLI for auth trigger cleanup. |
| 🟢 LOW | `profiles` INSERT/DELETE policies are intentionally absent but the rationale is only in a block comment, not inline next to each policy. | `0001_trainwithgouli_init.sql` lines 179–197 | Add a brief comment directly above `profiles_select` and `profiles_update` reiterating the design choice. |

---

## Remediation SQL

Apply these changes to make the migration production-ready.

### 1. Fix `plan_exercises` missing timestamp columns

Add the columns before the table is used. The safest place is right after the `plan_exercises` table definition and before the index/RLS sections.

```sql
-- Add missing timestamp columns to plan_exercises
ALTER TABLE public.plan_exercises
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
```

Alternatively, incorporate them directly into the `CREATE TABLE`:

```sql
create table public.plan_exercises (
  id bigint generated always as identity primary key,
  plan_id bigint not null references public.workout_plans(id) on delete cascade,
  exercise_id bigint not null references public.exercises(id) on delete cascade,
  order_index int not null default 0,
  sets int,
  reps int,
  rest_seconds int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, exercise_id)
);
```

### 2. Wrap the UP migration in an explicit transaction (recommended)

```sql
BEGIN;

-- ... existing UP statements ...

COMMIT;
```

### 3. Restrict private workout data reads (optional, if product requires privacy)

```sql
DROP POLICY IF EXISTS workout_days_select ON public.workout_days;
CREATE POLICY "workout_days_select"
  ON public.workout_days
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS workout_sets_select ON public.workout_sets;
CREATE POLICY "workout_sets_select"
  ON public.workout_sets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_days
      WHERE id = workout_sets.workout_day_id
        AND (user_id = auth.uid() OR public.is_admin())
    )
  );
```

---

## Final Recommendation

**🔴 BLOCK — Do not deploy.**

The migration must be fixed in the worktree before promotion:

1. **Add `created_at` and `updated_at` columns to `public.plan_exercises`** so the existing `set_updated_at` trigger can execute without error.

After the blocker is resolved, address the remaining warnings:

- Confirm whether `workout_days` and `workout_sets` should be globally readable; restrict SELECT if not.
- Wrap the UP migration in an explicit `BEGIN`/`COMMIT` block for safer transaction semantics.
- Document auth-trigger cleanup requirements in the rollback script.

Once remediated, re-run the full DBA audit before deployment.
