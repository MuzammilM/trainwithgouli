-- TrainWithGouli initial schema rollback.
-- Reverses supabase/migrations/0001_trainwithgouli_init.sql in dependency order.
-- NOTE: This is a destructive rollback script. Run only when you intend to wipe
-- all application data created by the initial migration.

-- Drop updated_at triggers first.
drop trigger if exists set_updated_at on public.workout_sets;
drop trigger if exists set_updated_at on public.workout_days;
drop trigger if exists set_updated_at on public.plan_exercises;
drop trigger if exists set_updated_at on public.workout_plans;
drop trigger if exists set_updated_at on public.exercises;
drop trigger if exists set_updated_at on public.profiles;

-- Drop first-admin and auth signup triggers.
drop trigger if exists on_profile_created_set_first_admin on public.profiles;
drop trigger if exists on_auth_user_created on auth.users;

-- Drop functions.
drop function if exists public.set_updated_at();
drop function if exists public.handle_first_user_admin();
drop function if exists public.is_admin();
drop function if exists public.custom_access_token_hook(jsonb);
drop function if exists public.handle_new_user();

-- Drop tables in foreign-key-safe order (children before parents).
drop table if exists public.workout_sets cascade;
drop table if exists public.workout_days cascade;
drop table if exists public.plan_exercises cascade;
drop table if exists public.workout_plans cascade;
drop table if exists public.exercises cascade;
drop table if exists public.profiles cascade;

-- Drop enum type last.
drop type if exists public.app_role cascade;
