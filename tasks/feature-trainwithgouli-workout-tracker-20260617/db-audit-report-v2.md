# Database Audit Report v2

**Task ID**: feature-trainwithgouli-workout-tracker-20260617  
**Migration File**: `supabase/migrations/0001_trainwithgouli_init.sql`  
**Status**: 🔴 **BLOCK**

---

## Summary

The updated migration resolves all v1 BLOCK findings: `custom_access_token_hook` is now `SECURITY DEFINER` with a safe `search_path`, `FORCE ROW LEVEL SECURITY` is enabled on every table, `service_role` policies are present, the missing `plan_exercises.exercise_id` index is added, and `updated_at` triggers are in place.

However, two new critical issues prevent deployment:

1. The "DOWN" section is appended inside the same migration file that Supabase executes. When `supabase migration up` runs, it will execute the UP statements and then immediately execute the DOWN statements, dropping every object created above.
2. The `handle_first_user_admin` AFTER INSERT trigger checks `NOT EXISTS (SELECT 1 FROM public.profiles)`, but the new profile row is already visible at that point, so the first user is never promoted to admin.

Both must be fixed before this migration can ship.

---

## Checklist Results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | DOWN migration exists and is complete | ❌ BLOCK | DOWN SQL exists (lines 454–478) but is inside the migration file; Supabase executes the whole file, so the DOWN will self-destruct the schema. |
| 2 | `custom_access_token_hook` is `SECURITY DEFINER` with safe `search_path` | ✅ PASS | Line 41 `security definer`, line 42 `set search_path = ''`. Grant/revoke lines 57–58 are correct. |
| 3 | Every table has RLS enabled + `FORCE ROW LEVEL SECURITY` + policies | ✅ PASS | All 6 tables enabled (lines 135–140), forced (lines 142–147), and have authenticated + service_role policies. |
| 4 | `service_role` policies exist on all tables | ✅ PASS | Lines 158–174. Every public table has a `FOR ALL TO service_role` policy. |
| 5 | Every foreign key has an index | ✅ PASS | All FK columns are covered by dedicated or leading-composite indexes (see Index Verification). |
| 6 | No dangerous locking operations | ⚠️ WARN | `CREATE INDEX` without `CONCURRENTLY` (lines 118–124). Acceptable for an initial empty-table migration, but risky if replayed against populated tables. |

---

## Migration Safety

| Check | Result | Notes |
|-------|--------|-------|
| DOWN migration exists | ❌ BLOCK | DOWN is present but embedded in the migration file, causing the migration to undo itself. |
| Dangerous locking operations | ⚠️ WARN | Six `CREATE INDEX` statements do not use `CONCURRENTLY`. For an init migration this is acceptable; flag for future migrations. |
| Destructive operations (DROP TABLE, DROP COLUMN, etc.) | ✅ PASS | No destructive DDL in the UP section. |
| Transaction safety | ⚠️ WARN | DDL is not wrapped in explicit `BEGIN`/`COMMIT`. PostgreSQL wraps each statement implicitly, but a single transaction for the init is cleaner and safer. |

---

## RLS Verification

### RLS Enablement

| Table | RLS Enabled | FORCE RLS | Verdict |
|-------|-------------|-----------|---------|
| `public.profiles` | ✅ | ✅ | Pass |
| `public.exercises` | ✅ | ✅ | Pass |
| `public.workout_plans` | ✅ | ✅ | Pass |
| `public.plan_exercises` | ✅ | ✅ | Pass |
| `public.workout_days` | ✅ | ✅ | Pass |
| `public.workout_sets` | ✅ | ✅ | Pass |

### Policy Coverage by Role

| Table | `anon` | `authenticated` SELECT | `authenticated` INSERT | `authenticated` UPDATE | `authenticated` DELETE | `service_role` |
|-------|--------|------------------------|------------------------|------------------------|------------------------|----------------|
| `profiles` | ❌ none | ✅ own + admin | ❌ none* | ✅ own | ❌ none* | ✅ all |
| `exercises` | ❌ none | ✅ all auth | ✅ owner/admin | ✅ owner/admin | ✅ owner/admin | ✅ all |
| `workout_plans` | ❌ none | ✅ all auth | ✅ owner/admin | ✅ owner/admin | ✅ owner/admin | ✅ all |
| `plan_exercises` | ❌ none | ✅ all auth | ✅ via plan owner | ✅ via plan owner | ✅ via plan owner | ✅ all |
| `workout_days` | ❌ none | ✅ all auth | ✅ own | ✅ own/admin | ✅ own/admin | ✅ all |
| `workout_sets` | ❌ none | ✅ all auth | ✅ via day owner | ✅ via day owner | ✅ via day owner | ✅ all |

\* `profiles` INSERT/DELETE are intentionally omitted because the auth trigger creates the row and users should not self-delete profiles. This is acceptable but should be documented in a policy comment.

---

## Index Verification

| Foreign Key | Column(s) | Indexed? | Index Name / Notes |
|-------------|-----------|----------|--------------------|
| `profiles.id` → `auth.users(id)` | `id` | ✅ (PK) | Primary key |
| `exercises.created_by` → `profiles(id)` | `created_by` | ✅ | `idx_exercises_created_by` |
| `workout_plans.created_by` → `profiles(id)` | `created_by` | ✅ | `idx_workout_plans_created_by` |
| `plan_exercises.plan_id` → `workout_plans(id)` | `plan_id` | ✅ | `idx_plan_exercises_plan_id` |
| `plan_exercises.exercise_id` → `exercises(id)` | `exercise_id` | ✅ | `idx_plan_exercises_exercise_id` (added in v2) |
| `workout_days.user_id` → `profiles(id)` | `user_id` | ✅ (leading) | Covered by `idx_workout_days_user_id_date` |
| `workout_sets.workout_day_id` → `workout_days(id)` | `workout_day_id` | ✅ (leading) | Covered by `idx_workout_sets_day_exercise` |
| `workout_sets.exercise_id` → `exercises(id)` | `exercise_id` | ✅ (leading) | Covered by `idx_workout_sets_exercise_user` |

All foreign keys are now indexed. ✅

---

## Auth Hook Security

| Check | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| `custom_access_token_hook` marked `SECURITY DEFINER` | Required | ✅ Line 41 | PASS |
| Safe `search_path` set on hook | Required (`set search_path = ''`) | ✅ Line 42 | PASS |
| Grant/revoke executed correctly | Grant to `supabase_auth_admin`, revoke from `authenticated`, `anon`, `public` | ✅ Lines 57–58 | PASS |

The hook now correctly reads `public.profiles` under a fixed search path and injects `user_role` into the JWT.

---

## Schema Integrity & Triggers

| Check | Result | Notes |
|-------|--------|-------|
| `created_at` defaults present | ✅ PASS | All tables include `created_at timestamptz NOT NULL DEFAULT now()`. |
| `updated_at` columns present | ✅ PASS | All tables include `updated_at timestamptz NOT NULL DEFAULT now()`. |
| `updated_at` auto-update trigger | ✅ PASS | `public.set_updated_at()` and triggers added for all tables (lines 418–452). |
| Data types | ✅ PASS | Uses `uuid`, `bigint generated always as identity`, `timestamptz`, `text`, `numeric(8,2)`. No `SERIAL` or `TIMESTAMP` without tz. |
| Enum type | ✅ PASS | `public.app_role` enum is appropriate. |
| Auth trigger `handle_new_user` | ✅ PASS | `SECURITY DEFINER` with `search_path = ''`. |
| First-admin trigger `handle_first_user_admin` | ❌ BLOCK | AFTER INSERT trigger checks `NOT EXISTS (SELECT 1 FROM public.profiles)`, but the new row is already visible, so the condition is always false. |

---

## Findings

| Severity | Finding | Location | Remediation |
|----------|---------|----------|-------------|
| 🔴 BLOCK | DOWN migration is embedded in the migration file and will execute during `supabase migration up`, dropping all objects. | Lines 454–478 | Remove the DOWN section from `supabase/migrations/0001_trainwithgouli_init.sql`. Store rollback SQL outside the migrations folder (e.g., `docs/database/0001_rollback.sql` or the audit deliverable). |
| 🔴 BLOCK | First-admin trigger never promotes the first user to admin because `NOT EXISTS` is false after the AFTER INSERT row is visible. | Lines 400–415 | Change the condition to `(SELECT COUNT(*) FROM public.profiles) = 1`, or use a `BEFORE INSERT` trigger and check `NOT EXISTS` there. |
| 🟡 WARN | `CREATE INDEX` without `CONCURRENTLY` on six indexes. | Lines 118–124 | Acceptable for init; use `CREATE INDEX CONCURRENTLY` in all future migrations that touch populated tables. |
| 🟡 WARN | `workout_days` and `workout_sets` SELECT policies expose all users' private workout logs to every authenticated user. | Lines 314–318, 349–353 | Scope SELECT to `user_id = auth.uid()` or `public.is_admin()` unless the product explicitly requires global read access. |
| 🟡 WARN | `public.is_admin()` lacks `SET search_path = ''`. | Lines 127–132 | Add `SET search_path = ''` to the function definition for defense in depth. |
| 🟢 LOW | SECURITY DEFINER trigger functions in `public` schema retain default `PUBLIC` execute grant. | Lines 16, 400, 418 | Revoke execute from `PUBLIC`, `anon`, and `authenticated` on `handle_new_user`, `handle_first_user_admin`, and `set_updated_at`. |
| 🟢 LOW | `profiles` INSERT/DELETE policies are intentionally absent but undocumented. | Lines 176–191 | Add a comment above the policies explaining that profiles are managed by the auth trigger and users cannot self-delete. |

---

## Remediation SQL

Apply these changes to make the migration production-ready.

### 1. Remove the embedded DOWN section

Delete lines 454–478 from `supabase/migrations/0001_trainwithgouli_init.sql`. Supabase migrations are forward-only; the whole file is executed as one script. If a rollback script is needed for documentation, keep it outside `supabase/migrations/`.

### 2. Fix the first-admin trigger

```sql
-- Drop the broken trigger and function
DROP TRIGGER IF EXISTS on_profile_created_set_first_admin ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_first_user_admin();

-- Recreate with correct logic
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles) = 1 THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_set_first_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_admin();
```

### 3. Harden `is_admin()` search_path

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT (auth.jwt() ->> 'user_role') = 'admin';
$$;
```

### 4. Restrict private workout data reads (recommended)

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

### 5. Revoke direct execute on trigger functions

```sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_first_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
```

---

## Final Recommendation

**🔴 BLOCK — Do not deploy.**

The migration must be fixed in the worktree before promotion:

1. **Remove the embedded DOWN section** from `supabase/migrations/0001_trainwithgouli_init.sql` (or move it outside the migrations folder).
2. **Fix the first-admin trigger** so the first signed-up user is actually promoted to admin.

After these blockers are resolved, address the high-priority warnings:

- Restrict global SELECT on `workout_days` and `workout_sets` unless the product truly requires it.
- Add `SET search_path = ''` to `public.is_admin()`.
- Revoke direct execute privileges on trigger functions from public roles.

Once remediated, re-audit before deployment.
