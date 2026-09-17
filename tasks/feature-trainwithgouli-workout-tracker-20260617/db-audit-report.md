# Database Audit Report

**Task ID**: feature-trainwithgouli-workout-tracker-20260617  
**Migration File**: `supabase/migrations/0001_trainwithgouli_init.sql`  
**Status**: 🔴 **BLOCK**

---

## Summary

The initial TrainWithGouli schema migration introduces six public tables, auth triggers, an access-token hook, helper functions, and Row Level Security policies. Several critical issues prevent this migration from being production-ready: it lacks a reversible DOWN migration, the `custom_access_token_hook` is not declared `SECURITY DEFINER` with a safe `search_path`, and `service_role` has no policies on any table. Additionally, a missing foreign-key index and missing `updated_at` triggers degrade performance and data integrity.

---

## Migration Safety

| Check | Result | Notes |
|-------|--------|-------|
| DOWN migration exists | ❌ BLOCK | File contains only UP statements. No rollback path is provided. |
| Dangerous locking operations | ⚠️ WARN | Six `CREATE INDEX` statements (lines 115–120) do not use `CONCURRENTLY`. Acceptable for an initial empty-table deployment, but any replay against populated tables will lock tables. |
| Destructive operations (DROP TABLE, DROP COLUMN, etc.) | ✅ PASS | No destructive DDL found. |
| Transaction safety | ⚠️ WARN | DDL is not wrapped in explicit `BEGIN`/`COMMIT`. PostgreSQL wraps each statement implicitly, but a single transaction for the whole init is cleaner and safer. |

---

## RLS Verification

### RLS Enablement

| Table | RLS Enabled | FORCE RLS | Verdict |
|-------|-------------|-----------|---------|
| `public.profiles` | ✅ | ❌ | Enabled, not forced. |
| `public.exercises` | ✅ | ❌ | Enabled, not forced. |
| `public.workout_plans` | ✅ | ❌ | Enabled, not forced. |
| `public.plan_exercises` | ✅ | ❌ | Enabled, not forced. |
| `public.workout_days` | ✅ | ❌ | Enabled, not forced. |
| `public.workout_sets` | ✅ | ❌ | Enabled, not forced. |

### Policy Coverage by Role

| Table | `anon` | `authenticated` SELECT | `authenticated` INSERT | `authenticated` UPDATE | `authenticated` DELETE | `service_role` |
|-------|--------|------------------------|------------------------|------------------------|------------------------|----------------|
| `profiles` | ❌ none | ✅ own + admin | ❌ none* | ✅ own | ❌ none* | ❌ none |
| `exercises` | ❌ none | ✅ all auth | ✅ owner/admin | ✅ owner/admin | ✅ owner/admin | ❌ none |
| `workout_plans` | ❌ none | ✅ all auth | ✅ owner/admin | ✅ owner/admin | ✅ owner/admin | ❌ none |
| `plan_exercises` | ❌ none | ✅ all auth | ✅ via plan owner | ✅ via plan owner | ✅ via plan owner | ❌ none |
| `workout_days` | ❌ none | ✅ all auth | ✅ own | ✅ own/admin | ✅ own-admin | ❌ none |
| `workout_sets` | ❌ none | ✅ all auth | ✅ via day owner | ✅ via day owner | ✅ via day owner | ❌ none |

\* `profiles` INSERT/DELETE are intentionally omitted because the trigger creates the row; however, this should be documented in the policy comments.

### RLS Findings

| Severity | Finding | Location | Remediation |
|----------|---------|----------|-------------|
| 🔴 BLOCK | `service_role` has no policies on any table. Edge Functions and admin background jobs will be denied all access. | Lines 131–136, 147–366 | Add `FOR ALL TO service_role USING (true) WITH CHECK (true)` policies to every public table. |
| 🟡 WARN | No `anon` policies defined. If the app truly has no anonymous access, add an explicit comment; otherwise anon users receive blanket denials. | Lines 147–366 | Document intent or add `anon` policies (e.g., read public workout plans). |
| 🟡 WARN | `FORCE ROW LEVEL SECURITY` is not enabled; table owner sessions bypass policies. | Lines 131–136 | Add `ALTER TABLE ... FORCE ROW LEVEL SECURITY` for all public tables. |
| 🟡 WARN | `workout_days` and `workout_sets` are readable by every authenticated user (`USING (true)`), exposing private workout logs. | Lines 284–288, 319–323 | Scope SELECT to `user_id = auth.uid()` or `is_admin()` unless the product explicitly requires global read access. |
| 🟡 WARN | `profiles` policies use subqueries `(select auth.uid())` and `(select public.is_admin())`; functionally correct but less idiomatic and slightly slower than direct expressions. | Lines 147–161 | Prefer `auth.uid() = id` and `public.is_admin()`. |

---

## Index Verification

| Foreign Key | Column(s) | Indexed? | Index Name / Notes |
|-------------|-----------|----------|--------------------|
| `profiles.id` → `auth.users(id)` | `id` | ✅ (PK) | Primary key |
| `exercises.created_by` → `profiles(id)` | `created_by` | ✅ | `idx_exercises_created_by` |
| `workout_plans.created_by` → `profiles(id)` | `created_by` | ✅ | `idx_workout_plans_created_by` |
| `plan_exercises.plan_id` → `workout_plans(id)` | `plan_id` | ✅ | `idx_plan_exercises_plan_id` |
| `plan_exercises.exercise_id` → `exercises(id)` | `exercise_id` | ❌ **MISSING** | Add `idx_plan_exercises_exercise_id`. |
| `workout_days.user_id` → `profiles(id)` | `user_id` | ✅ (leading) | Covered by `idx_workout_days_user_id_date` |
| `workout_sets.workout_day_id` → `workout_days(id)` | `workout_day_id` | ✅ (leading) | Covered by `idx_workout_sets_day_exercise` |
| `workout_sets.exercise_id` → `exercises(id)` | `exercise_id` | ✅ (leading) | Covered by `idx_workout_sets_exercise_user` |

| Severity | Finding | Remediation |
|----------|---------|-------------|
| 🟡 WARN | Missing index on `plan_exercises.exercise_id`. JOINs and cascade deletes will scan the table. | `CREATE INDEX CONCURRENTLY idx_plan_exercises_exercise_id ON public.plan_exercises(exercise_id);` |

---

## Auth Hook Security

| Check | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| `custom_access_token_hook` marked `SECURITY DEFINER` | Required | ❌ Not declared | 🔴 BLOCK |
| Safe `search_path` set on hook | Required (e.g., `set search_path = ''`) | ❌ Not set | 🔴 BLOCK |
| Grant/revoke executed correctly | Grant to `supabase_auth_admin`, revoke from `authenticated`, `anon`, `public` | ✅ Lines 54–55 | PASS |

The hook reads `public.profiles` to inject `user_role` into the JWT. Without `SECURITY DEFINER` and a safe `search_path`, the function is vulnerable to search-path attacks and may fail or leak data depending on the invoker's privileges.

**Remediation:**

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

---

## Schema Integrity & Triggers

| Check | Result | Notes |
|-------|--------|-------|
| `created_at` defaults present | ✅ PASS | All tables include `created_at timestamptz NOT NULL DEFAULT now()`. |
| `updated_at` columns present | ✅ PASS | All tables include `updated_at timestamptz NOT NULL DEFAULT now()`. |
| `updated_at` auto-update trigger | ❌ WARN | No trigger/function updates `updated_at` on `UPDATE`. Columns will become stale. |
| Data types | ✅ PASS | Uses `uuid`, `bigint generated always as identity`, `timestamptz`, `text`, `numeric(8,2)`. No `SERIAL` or `TIMESTAMP` without tz. |
| Enum type | ✅ PASS | `public.app_role` enum is appropriate. |
| Auth trigger `handle_new_user` | ✅ PASS | `SECURITY DEFINER` with `search_path = ''`. |
| First-admin trigger `handle_first_user_admin` | ✅ PASS | `SECURITY DEFINER` with `search_path = ''`. Logic correctly promotes only the first signed-up user. |

**Remediation for `updated_at`:**

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Repeat for exercises, workout_plans, plan_exercises, workout_days, workout_sets
```

---

## Remediation SQL (Critical Fixes)

Apply these changes before deploying:

```sql
-- 1. Secure the auth hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event ->> 'user_id')::uuid;
  claims := event -> 'claims';
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- 2. Force RLS
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.exercises FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans FORCE ROW LEVEL SECURITY;
ALTER TABLE public.plan_exercises FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets FORCE ROW LEVEL SECURITY;

-- 3. Service-role policies
CREATE POLICY "service_role_all_profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_exercises" ON public.exercises FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_workout_plans" ON public.workout_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_plan_exercises" ON public.plan_exercises FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_workout_days" ON public.workout_days FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_workout_sets" ON public.workout_sets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Missing FK index
CREATE INDEX CONCURRENTLY idx_plan_exercises_exercise_id ON public.plan_exercises(exercise_id);
```

Additionally, rewrite the migration to include a reversible **DOWN** section that drops tables, triggers, functions, indexes, policies, and the enum in dependency order.

---

## Final Recommendation

**🔴 BLOCK — Do not deploy.**

Resolve the three critical blockers before production:
1. Add a complete reversible DOWN migration.
2. Declare `custom_access_token_hook` as `SECURITY DEFINER` with `SET search_path = ''`.
3. Add `service_role` RLS policies to every public table.

After the blockers are fixed, address the high-priority warnings: add `updated_at` triggers, add the missing `plan_exercises.exercise_id` index, consider restricting global SELECT access on private workout data, and add `FORCE ROW LEVEL SECURITY`.
