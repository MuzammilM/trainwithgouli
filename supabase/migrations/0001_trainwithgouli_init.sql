-- TrainWithGouli initial schema
-- Roles, profiles, exercises, workout plans, daily logging, and RLS policies.

create type public.app_role as enum ('admin', 'user');

-- Profiles: one row per auth user, stores role and display name.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.app_role not null default 'user',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'user'),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auth hook: inject role into JWT access token.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  user_role public.app_role;
begin
  select role into user_role from public.profiles where id = (event ->> 'user_id')::uuid;
  claims := event -> 'claims';
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Exercise library.
create table public.exercises (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  youtube_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Workout plans.
create table public.workout_plans (
  id bigint generated always as identity primary key,
  name text not null,
  created_by uuid references public.profiles(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ordered exercises within a plan.
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

-- Daily workout log entry.
create table public.workout_days (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Individual sets performed during a workout day.
create table public.workout_sets (
  id bigint generated always as identity primary key,
  workout_day_id bigint not null references public.workout_days(id) on delete cascade,
  exercise_id bigint not null references public.exercises(id) on delete restrict,
  weight numeric(8,2) not null,
  reps int not null,
  sets int not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for RLS and weight-nudge queries.
-- CONCURRENTLY is omitted because this is an initial schema migration run against empty tables.
-- All future migrations that add indexes to populated tables should use CREATE INDEX CONCURRENTLY.
create index idx_exercises_created_by on public.exercises(created_by);
create index idx_workout_plans_created_by on public.workout_plans(created_by);
create index idx_plan_exercises_plan_id on public.plan_exercises(plan_id);
create index idx_plan_exercises_exercise_id on public.plan_exercises(exercise_id);
create index idx_workout_days_user_id_date on public.workout_days(user_id, date desc);
create index idx_workout_sets_day_exercise on public.workout_sets(workout_day_id, exercise_id);
create index idx_workout_sets_exercise_user on public.workout_sets(exercise_id, created_at desc);

-- Helper: check if current user is admin from JWT claim.
create or replace function public.is_admin()
returns boolean
language sql stable
set search_path = ''
as $$
  select (auth.jwt() ->> 'user_role') = 'admin';
$$;

-- Enable and force RLS on all public tables.
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_sets enable row level security;

alter table public.profiles force row level security;
alter table public.exercises force row level security;
alter table public.workout_plans force row level security;
alter table public.plan_exercises force row level security;
alter table public.workout_days force row level security;
alter table public.workout_sets force row level security;

-- Grant base privileges to authenticated users.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.workout_plans to authenticated;
grant select, insert, update, delete on public.plan_exercises to authenticated;
grant select, insert, update, delete on public.workout_days to authenticated;
grant select, insert, update, delete on public.workout_sets to authenticated;

-- Service-role policies: backend services and admin jobs need full access.
create policy "service_role_all_profiles"
  on public.profiles for all to service_role using (true) with check (true);

create policy "service_role_all_exercises"
  on public.exercises for all to service_role using (true) with check (true);

create policy "service_role_all_workout_plans"
  on public.workout_plans for all to service_role using (true) with check (true);

create policy "service_role_all_plan_exercises"
  on public.plan_exercises for all to service_role using (true) with check (true);

create policy "service_role_all_workout_days"
  on public.workout_days for all to service_role using (true) with check (true);

create policy "service_role_all_workout_sets"
  on public.workout_sets for all to service_role using (true) with check (true);

-- Profiles policies.
-- INSERT and DELETE are intentionally omitted: profiles are created automatically by the
-- auth.users trigger (handle_new_user), and users are not allowed to self-delete profiles.
create policy "profiles_select"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or public.is_admin()
  );

create policy "profiles_update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Exercises: readable by all authenticated users; editable by owner or admin.
create policy "exercises_select"
  on public.exercises
  for select
  to authenticated
  using (true);

create policy "exercises_insert"
  on public.exercises
  for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "exercises_update"
  on public.exercises
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_admin()
  )
  with check (
    created_by = auth.uid()
    or public.is_admin()
  );

create policy "exercises_delete"
  on public.exercises
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_admin()
  );

-- Workout plans: readable by all authenticated users; editable by owner or admin.
create policy "workout_plans_select"
  on public.workout_plans
  for select
  to authenticated
  using (true);

create policy "workout_plans_insert"
  on public.workout_plans
  for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "workout_plans_update"
  on public.workout_plans
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_admin()
  )
  with check (
    created_by = auth.uid()
    or public.is_admin()
  );

create policy "workout_plans_delete"
  on public.workout_plans
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_admin()
  );

-- Plan exercises: cascade via plan ownership.
create policy "plan_exercises_select"
  on public.plan_exercises
  for select
  to authenticated
  using (true);

create policy "plan_exercises_insert"
  on public.plan_exercises
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workout_plans
      where id = plan_exercises.plan_id
        and (created_by = auth.uid() or public.is_admin())
    )
  );

create policy "plan_exercises_update"
  on public.plan_exercises
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workout_plans
      where id = plan_exercises.plan_id
        and (created_by = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans
      where id = plan_exercises.plan_id
        and (created_by = auth.uid() or public.is_admin())
    )
  );

create policy "plan_exercises_delete"
  on public.plan_exercises
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.workout_plans
      where id = plan_exercises.plan_id
        and (created_by = auth.uid() or public.is_admin())
    )
  );

-- Workout days: intentionally readable by all authenticated users so users can see each other's workouts.
-- Insert is restricted to the authenticated user; update/delete restricted to owner or admin.
create policy "workout_days_select"
  on public.workout_days
  for select
  to authenticated
  using (true);

create policy "workout_days_insert"
  on public.workout_days
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "workout_days_update"
  on public.workout_days
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  )
  with check (
    user_id = auth.uid()
    or public.is_admin()
  );

create policy "workout_days_delete"
  on public.workout_days
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

-- Workout sets: intentionally readable by all authenticated users so users can see each other's workout details.
-- Insert/update/delete restricted to owner of the parent day or admin.
create policy "workout_sets_select"
  on public.workout_sets
  for select
  to authenticated
  using (true);

create policy "workout_sets_insert"
  on public.workout_sets
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workout_days
      where id = workout_sets.workout_day_id
        and (user_id = auth.uid() or public.is_admin())
    )
  );

create policy "workout_sets_update"
  on public.workout_sets
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workout_days
      where id = workout_sets.workout_day_id
        and (user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.workout_days
      where id = workout_sets.workout_day_id
        and (user_id = auth.uid() or public.is_admin())
    )
  );

create policy "workout_sets_delete"
  on public.workout_sets
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.workout_days
      where id = workout_sets.workout_day_id
        and (user_id = auth.uid() or public.is_admin())
    )
  );

-- Promote the very first signed-up user to admin.
-- This trigger runs after a new profile is inserted. If no other profiles exist,
-- the new user is promoted to admin. The condition uses id <> new.id so the
-- check remains safe even if the new row is visible within the trigger.
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

create trigger on_profile_created_set_first_admin
  after insert on public.profiles
  for each row execute function public.handle_first_user_admin();

-- Auto-update updated_at on application tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.workout_plans
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.plan_exercises
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.workout_days
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.workout_sets
  for each row execute function public.set_updated_at();

-- Harden trigger functions: do not allow direct execution by client-facing roles.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_first_user_admin() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
