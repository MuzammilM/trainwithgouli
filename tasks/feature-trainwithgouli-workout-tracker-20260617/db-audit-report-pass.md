# Database Audit Report — TrainWithGouli Workout Tracker

**Task ID**: feature-trainwithgouli-workout-tracker-20260617  
**Mode**: AUDIT  
**Status**: **PASS**  
**Audited Migration Files**:
- `supabase/migrations/0001_trainwithgouli_init.sql`
- `supabase/migrations/0002_trainwithgouli_rollback_init.sql`
**Audited By**: Database DBA  
**Date**: 2026-06-18

---

## Executive Summary

The initial TrainWithGouli workout-tracker schema migration passes the full DBA audit checklist. All application tables have Row Level Security (RLS) enabled and forced, every table has at least one policy, `service_role` policies are present on every table, all foreign keys are indexed, the rollback migration is separate and complete, and the auth/token hook functions are hardened with safe `search_path` settings.

No critical or high-severity findings were identified. One low-severity informational note is recorded regarding the absence of `anon` policies, which is a secure default-deny posture for an authenticated-only application.

---

## Migration Files Reviewed

| File | Purpose | Verdict |
|------|---------|---------|
| `0001_trainwithgouli_init.sql` | Initial schema: profiles, exercises, workout plans, plan exercises, workout days, workout sets, triggers, RLS | PASS |
| `0002_trainwithgouli_rollback_init.sql` | Complete DOWN/rollback of the initial migration | PASS |

---

## Detailed Audit Checklist

### 1. `plan_exercises` columns and trigger

- [x] `created_at` column exists (`timestamptz not null default now()`)
- [x] `updated_at` column exists (`timestamptz not null default now()`)
- [x] `set_updated_at` trigger is attached to `public.plan_exercises`

```sql
-- Verified in 0001_trainwithgouli_init.sql
-- Lines 82-93: table definition
-- Lines 453-455: trigger definition
```

**Result**: PASS

---

### 2. DOWN migration is separate and complete

- [x] DOWN migration is in a separate file (`0002_trainwithgouli_rollback_init.sql`)
- [x] Drops `updated_at` triggers in reverse dependency order
- [x] Drops first-admin and auth signup triggers
- [x] Drops functions (`set_updated_at`, `handle_first_user_admin`, `is_admin`, `custom_access_token_hook`, `handle_new_user`)
- [x] Drops tables in foreign-key-safe order (children before parents)
- [x] Drops the `public.app_role` enum last

**Result**: PASS

---

### 3. `custom_access_token_hook` is `SECURITY DEFINER` with safe `search_path`

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
```

- [x] `SECURITY DEFINER` is set
- [x] `search_path` is explicitly set to `''` (empty)
- [x] Execution is granted only to `supabase_auth_admin`
- [x] Execution is revoked from `authenticated`, `anon`, and `public`

**Result**: PASS

---

### 4. Every table has RLS enabled + FORCE ROW LEVEL SECURITY + policies

| Table | RLS Enabled | FORCE RLS | Authenticated Policies | service_role Policy |
|-------|-------------|-----------|------------------------|---------------------|
| `public.profiles` | ✅ | ✅ | SELECT, UPDATE | ✅ |
| `public.exercises` | ✅ | ✅ | SELECT, INSERT, UPDATE, DELETE | ✅ |
| `public.workout_plans` | ✅ | ✅ | SELECT, INSERT, UPDATE, DELETE | ✅ |
| `public.plan_exercises` | ✅ | ✅ | SELECT, INSERT, UPDATE, DELETE | ✅ |
| `public.workout_days` | ✅ | ✅ | SELECT, INSERT, UPDATE, DELETE | ✅ |
| `public.workout_sets` | ✅ | ✅ | SELECT, INSERT, UPDATE, DELETE | ✅ |

- [x] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 6 tables
- [x] `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on all 6 tables
- [x] Every table has at least one RLS policy
- [x] No table has RLS enabled with zero policies (which would block all access)

**Result**: PASS

---

### 5. `service_role` policies exist on all tables

```sql
create policy "service_role_all_profiles" on public.profiles for all to service_role using (true) with check (true);
create policy "service_role_all_exercises" on public.exercises for all to service_role using (true) with check (true);
create policy "service_role_all_workout_plans" on public.workout_plans for all to service_role using (true) with check (true);
create policy "service_role_all_plan_exercises" on public.plan_exercises for all to service_role using (true) with check (true);
create policy "service_role_all_workout_days" on public.workout_days for all to service_role using (true) with check (true);
create policy "service_role_all_workout_sets" on public.workout_sets for all to service_role using (true) with check (true);
```

- [x] `service_role` policy on `profiles`
- [x] `service_role` policy on `exercises`
- [x] `service_role` policy on `workout_plans`
- [x] `service_role` policy on `plan_exercises`
- [x] `service_role` policy on `workout_days`
- [x] `service_role` policy on `workout_sets`

**Result**: PASS

---

### 6. Every foreign key has an index

| Foreign Key | Index | Index Type |
|-------------|-------|------------|
| `profiles.id` → `auth.users(id)` | Primary key on `profiles.id` | B-tree (implicit) |
| `exercises.created_by` → `profiles(id)` | `idx_exercises_created_by` | B-tree |
| `workout_plans.created_by` → `profiles(id)` | `idx_workout_plans_created_by` | B-tree |
| `plan_exercises.plan_id` → `workout_plans(id)` | `idx_plan_exercises_plan_id` | B-tree |
| `plan_exercises.exercise_id` → `exercises(id)` | `idx_plan_exercises_exercise_id` | B-tree |
| `workout_days.user_id` → `profiles(id)` | `idx_workout_days_user_id_date (user_id, date desc)` | Composite B-tree |
| `workout_sets.workout_day_id` → `workout_days(id)` | `idx_workout_sets_day_exercise (workout_day_id, exercise_id)` | Composite B-tree |
| `workout_sets.exercise_id` → `exercises(id)` | `idx_workout_sets_exercise_user (exercise_id, created_at desc)` | Composite B-tree |

- [x] All referencing foreign-key columns are covered by an index
- [x] Composite indexes support both FK lookups and common query patterns (e.g., `user_id, date desc` for daily log lookups)

**Result**: PASS

---

### 7. First-admin trigger logic is correct

```sql
create or replace function public.handle_first_user_admin()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.profiles where id <> new.id) = 0 then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end;
$$;
```

- [x] Function is `SECURITY DEFINER` with empty `search_path`
- [x] Trigger runs `AFTER INSERT` on `public.profiles`
- [x] Logic correctly identifies the first user by checking `count(*) ... where id <> new.id = 0`
- [x] Uses `id <> new.id` guard, making the check safe even if the new row is visible within the trigger
- [x] Execution is revoked from client-facing roles (`public`, `anon`, `authenticated`)

**Result**: PASS

---

## Additional Security & Best-Practice Observations

### Triggers and Functions
- `handle_new_user()` is `SECURITY DEFINER` with `set search_path = ''` — safe.
- `set_updated_at()` is `SECURITY DEFINER` with `set search_path = ''` — safe.
- `is_admin()` is a stable SQL function with `set search_path = ''` — safe.
- Direct execution of trigger/helper functions is revoked from `public`, `anon`, and `authenticated`.

### Data Types
- Primary keys use `bigint generated always as identity` or `uuid` — acceptable.
- All timestamp columns are `timestamptz` — correct.
- Monetary/value data (`workout_sets.weight`) uses `numeric(8,2)` — correct.

### Migration Safety
- `CREATE INDEX` is used without `CONCURRENTLY` in the initial migration. This is acceptable because:
  - The migration runs against empty tables.
  - A code comment explicitly documents this choice and states future migrations on populated tables will use `CREATE INDEX CONCURRENTLY`.
- No destructive operations exist in `0001`; all destructive logic lives in the separate rollback file.

---

## Findings

| Severity | Finding | Location | Remediation / Notes |
|----------|---------|----------|---------------------|
| — | No findings | — | — |

### Informational Note (LOW)

| Severity | Finding | Location | Notes |
|----------|---------|----------|-------|
| LOW | No `anon` RLS policies defined | All tables | The schema uses only `authenticated` and `service_role` policies. Because RLS default-denies any role without a policy, anonymous users have no access. This is a secure posture for an authenticated-only workout tracker. If public/anonymous read access is desired in the future (e.g., public exercise library), add explicit `anon` SELECT policies. |

---

## Recommendation

**PASS — Proceed with deployment.**

The migration set meets the DBA gate criteria:
- RLS is mandatory and enforced on every table.
- Policies exist for both `authenticated` and `service_role` roles.
- All foreign keys are indexed.
- The rollback migration is complete and dependency-ordered.
- Auth hooks and trigger functions are hardened.

The single informational note regarding `anon` policies is not a blocker and reflects a deliberate secure default-deny design.

---

## Sign-off

**Database DBA Approval**: ✅ PASS  
**Action**: Migration files are cleared for promotion to production.
