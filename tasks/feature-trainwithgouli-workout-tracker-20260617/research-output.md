# Research: TrainWithGouli Workout Tracker

**Research Date:** 2026-06-17  
**Query:** Supabase auth/RBAC, workout tracker schema, Impeccable brutalist design, Next.js App Router Supabase integration, YouTube embed handling.  
**Context:** Building TrainWithGouli, a brutalist-design workout tracker with Supabase auth/DB, admin/user roles, exercise library with YouTube links, workout plans, daily workout logging, and weight nudge feature.  
**Cache Key:** `trainwithgouli-workout-tracker-research`

---

## Executive Summary

TrainWithGouli should be built as a **Next.js 15+ App Router** application using **@supabase/ssr** for cookie-based auth, **Supabase Postgres** for data, and **Tailwind CSS** styled through the **Impeccable** design skill pack. The recommended architecture is:

1. **Auth/RBAC:** Store roles in a `profiles` table (`role` enum: `admin` | `user`) linked 1:1 to `auth.users(id)`. Use a `custom_access_token_hook` Auth Hook to inject `user_role` into the JWT so RLS policies can read it cheaply via `auth.jwt() ->> 'user_role'`.
2. **Schema:** Five core tables — `profiles`, `exercises`, `workout_plans`, `plan_exercises` (join), `workout_days`, `workout_sets`. Enable RLS on every table, index foreign keys and `user_id` columns, and use triggers to auto-create profiles on signup.
3. **Weight nudge:** Use a `LATERAL` subquery or `DISTINCT ON` to retrieve the most recent `workout_sets.weight` for the same `(user_id, exercise_id)` pair.
4. **Design:** Install Impeccable with `npx impeccable install`, establish the brutalist direction via `/impeccable init` (PRODUCT.md) and `/impeccable shape`/`craft`, then refine with `/impeccable bolder` and `/impeccable distill`.
5. **Next.js integration:** Put Supabase client helpers in `utils/supabase/server.ts`, `utils/supabase/client.ts`, and `utils/supabase/middleware.ts`. Use Server Actions for form mutations and Route Handlers only when streaming/binary responses are required.
6. **YouTube:** Normalize URLs to `https://www.youtube-nocookie.com/embed/{video_id}` for privacy-enhanced embedding; use an `iframe` with `loading="lazy"`.

---

## Web Research Summary

### 1. Supabase Auth + RBAC
Supabase recommends two complementary mechanisms for roles:
- **App metadata (`raw_app_meta_data`)** for simple role claims stored directly on `auth.users`. This is safe because users cannot modify it, but it requires refreshing the JWT after role changes.
- **A `profiles` / `user_roles` table** for richer role/permission modeling, plus a **Custom Access Token Auth Hook** to copy the role into the JWT at token-issuance time. This is the best-practice pattern for RBAC because it keeps authorization decisions inside RLS fast and database-driven.

RLS policies should always use `to authenticated`, wrap `auth.uid()`/`auth.jwt()` in a `select (...)` expression for performance, and add matching query filters on indexed columns.

Sources:
- [Custom Claims & RBAC](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 2. Supabase Schema Design for Workout Tracker
Supabase/Postgres best practices favor:
- `uuid` primary keys for auth-linked rows, `bigint generated always as identity` for domain entities.
- `timestamptz` for all timestamps.
- Foreign keys with `on delete cascade` or `set null` as appropriate.
- RLS enabled by default; auto-enable via an event trigger if tables are created via SQL migrations.
- Indexes on all columns appearing in `where`, `join`, and RLS predicates.

For the weight nudge, the canonical Postgres pattern is `DISTINCT ON (exercise_id) ... ORDER BY exercise_id, created_at desc` or a `LATERAL` join against a subquery ordered by `created_at desc`.

Sources:
- [Supabase Tables & Data Types](https://supabase.com/docs/guides/database/tables#data-types)
- [RLS Performance Recommendations](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Postgres `SELECT` docs for `LATERAL`, window functions, `DISTINCT ON`

### 3. Impeccable Design Skill + Brutalist Theme
Impeccable is an agent skill pack (not just a linter) that installs via `npx impeccable install` and exposes slash commands such as `/impeccable init`, `/impeccable shape`, `/impeccable craft`, `/impeccable bolder`, `/impeccable distill`, `/impeccable polish`, etc. It writes `PRODUCT.md` and `DESIGN.md` so every later command reads the brief. The CLI also runs `npx impeccable detect src/` to catch 44 deterministic anti-patterns.

Brutalist web design characteristics include: raw/unglossed UI, system or monospace fonts, high contrast, exposed structural elements (borders, grids), minimal decoration, large typography, functional layout, and an intentional “unpolished” honesty.

Sources:
- [impeccable npm](https://www.npmjs.com/package/impeccable)
- [pbakaus/impeccable GitHub](https://github.com/pbakaus/impeccable)
- [impeccable.style](https://impeccable.style)
- [Shopify: Brutalist Web Design](https://www.shopify.com/partners/blog/brutalist-web-design)

### 4. Next.js App Router + Supabase Integration
The current Supabase SSR guide for Next.js recommends:
- Install `@supabase/supabase-js` and `@supabase/ssr`.
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Create `utils/supabase/server.ts` (Server Components/Actions/Route Handlers), `utils/supabase/client.ts` (Client Components), and `utils/supabase/middleware.ts` (session refresh).
- Use `supabase.auth.getClaims()` to verify identity on the server; do **not** rely on `getSession()` for authorization decisions.
- For Next.js 15+, a Proxy is used to refresh tokens because Server Components cannot write cookies.

Sources:
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Advanced SSR Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

### 5. YouTube Link Handling
Best practice:
- Store the original URL but normalize to `https://www.youtube-nocookie.com/embed/{video_id}` at render time.
- Extract the 11-character video ID from `v=`, `youtu.be/`, or `embed/` URLs.
- Render with `<iframe loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>`.
- Privacy Enhanced Mode (`youtube-nocookie.com`) prevents views from influencing the viewer’s YouTube browsing experience.

Sources:
- [YouTube IFrame Player API - Player Parameters](https://developers.google.com/youtube/player_parameters)
- [YouTube Help: Embed videos & playlists](https://support.google.com/youtube/answer/171780)

---

## Recommended Skills

| Skill | Relevance |
|-------|-----------|
| `supabase` | Required for all Supabase work (Auth, DB, RLS, migrations, SSR). |
| `supabase-postgres-best-practices` | Already present in workspace; covers RLS, indexes, data types, query optimization. |
| `frontend-design` | Useful fallback if Impeccable is not installed. |
| `next-best-practices` | Helpful for Next.js App Router conventions and file structure. |
| `impeccable` (via `npx impeccable install`) | Primary design skill for establishing and refining the brutalist direction. |

---

## Relevant Code Blocks

### [PRIMARY] Supabase RBAC — `profiles` table + custom claims hook

**Source:** Supabase docs  
**Purpose:** Link a role-bearing `profiles` row to every `auth.users` row and inject the role into the JWT.

```sql
-- 1. Role enum
 create type public.app_role as enum ('admin', 'user');

-- 2. Profiles table (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role app_role not null default 'user',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Auto-create profile on signup
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

-- 4. Auth hook: copy role into JWT access token
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql stable
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
```

**Why it matters:** This is the recommended Supabase pattern for RBAC. The `user_role` claim is available in RLS via `auth.jwt() ->> 'user_role'`, avoiding expensive per-row lookups into `profiles`.

---

### [PRIMARY] RLS policies for profiles and role-gated tables

**Source:** Supabase RLS docs + local `supabase-postgres-best-practices` skill  
**Purpose:** Enforce “users read/update own profile; admins read all profiles” and reuse role checks elsewhere.

```sql
-- Profiles: users own theirs; admins see everything
alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;

create policy "profiles_select"
  on public.profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = id
    or (select auth.jwt() ->> 'user_role') = 'admin'
  );

create policy "profiles_update"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Reusable admin check for other tables
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select (auth.jwt() ->> 'user_role') = 'admin';
$$;

-- Example: exercises can be read by anyone authenticated; edited by owner or admin
alter table public.exercises enable row level security;

create policy "exercises_select"
  on public.exercises for select to authenticated using (true);

create policy "exercises_modify"
  on public.exercises for all to authenticated
  using (
    created_by = (select auth.uid()) or (select public.is_admin())
  )
  with check (
    created_by = (select auth.uid()) or (select public.is_admin())
  );
```

**Why it matters:** These policies implement the exact ownership/admin rules from the task brief. Wrapping `auth.jwt()` in `(select ...)` follows the RLS performance recommendation.

---

### [PRIMARY] Workout tracker schema

**Purpose:** Relational model aligned with the spreadsheet: `Date → WorkoutDay → ExerciseSets(Exercise, Weight, Reps, Sets)`.

```sql
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.app_role not null default 'user',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  youtube_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_plans (
  id bigint generated always as identity primary key,
  name text not null,
  created_by uuid references public.profiles(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_exercises (
  id bigint generated always as identity primary key,
  plan_id bigint not null references public.workout_plans(id) on delete cascade,
  exercise_id bigint not null references public.exercises(id) on delete cascade,
  order_index int not null default 0,
  sets int,
  reps int,
  rest_seconds int,
  unique (plan_id, exercise_id)
);

create table public.workout_days (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

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

-- Indexes for RLS and weight-nudge queries
 create index idx_exercises_created_by on public.exercises(created_by);
create index idx_workout_plans_created_by on public.workout_plans(created_by);
create index idx_plan_exercises_plan_id on public.plan_exercises(plan_id);
create index idx_workout_days_user_id_date on public.workout_days(user_id, date desc);
create index idx_workout_sets_day_exercise on public.workout_sets(workout_day_id, exercise_id);
create index idx_workout_sets_exercise_user on public.workout_sets(exercise_id, created_at desc);
```

**Why it matters:** This schema matches the required data model, supports plans, daily logging, and the weight nudge query, and has indexes on every column used in joins, filters, and RLS policies.

---

### [PRIMARY] Weight nudge query

**Purpose:** Get the last weight lifted by the current user for a given exercise.

```sql
-- Option A: LATERAL join (best when fetching multiple exercises at once)
select
  e.id as exercise_id,
  e.name,
  last_set.weight as last_weight,
  last_set.created_at as last_done_at
from public.exercises e
left join lateral (
  select ws.weight, ws.created_at
  from public.workout_sets ws
  join public.workout_days wd on wd.id = ws.workout_day_id
  where ws.exercise_id = e.id
    and wd.user_id = (select auth.uid())
  order by ws.created_at desc
  limit 1
) last_set on true
where e.id = $1;

-- Option B: DISTINCT ON (single exercise lookup)
select distinct on (ws.exercise_id)
  ws.exercise_id,
  ws.weight as last_weight,
  ws.created_at
from public.workout_sets ws
join public.workout_days wd on wd.id = ws.workout_day_id
where ws.exercise_id = $1
  and wd.user_id = $2
order by ws.exercise_id, ws.created_at desc;
```

**Why it matters:** The LATERAL version is ideal when rendering a plan with many exercises; the `DISTINCT ON` version is simpler for a single-exercise lookup. Both leverage the `idx_workout_sets_exercise_user` index.

---

### [SECONDARY] Next.js Supabase client helpers

**Source:** Supabase SSR docs  
**Purpose:** Standard file layout for server/client/middleware clients.

```ts
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies; proxy handles this.
          }
        },
      },
    }
  )
}
```

```ts
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

```ts
// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getClaims() // refreshes session if needed
  return supabaseResponse
}
```

**Why it matters:** This is the current Supabase-recommended structure for Next.js App Router. `getClaims()` is the safe identity check; `getSession()` is not trusted for authorization.

---

### [SECONDARY] YouTube URL normalization + embed

**Purpose:** Convert any YouTube URL into a privacy-enhanced embed URL and render it safely.

```ts
// lib/youtube.ts
const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(YOUTUBE_REGEX);
  if (!match) return null;
  const videoId = match[1];
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
```

```tsx
// components/YouTubeEmbed.tsx
export function YouTubeEmbed({ url }: { url: string }) {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <iframe
      src={embedUrl}
      title="Exercise video"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full border-2 border-black"
    />
  );
}
```

**Why it matters:** Privacy-enhanced mode (`youtube-nocookie.com`) is recommended by Google for embedded players and avoids using views to personalize the viewer’s YouTube experience.

---

### [SECONDARY] Impeccable setup + brutalist commands

**Purpose:** Install the design skill and establish the brutalist direction.

```bash
# 1. Install the skill into the current AI harness
npx impeccable install

# 2. First run inside the agent — writes PRODUCT.md and DESIGN.md
/impeccable init

# 3. Plan the UX/UI before coding
/impeccable shape

# 4. Full shape-then-build flow with visual iteration
/impeccable craft

# 5. Amplify contrast/type/structure for a more aggressive brutalist feel
/impeccable bolder

# 6. Strip back to essentials if it becomes too heavy
/impeccable distill

# 7. CI gate against AI slop
npx impeccable detect src/
```

**Why it matters:** Impeccable provides a shared design vocabulary and writes the design context into `PRODUCT.md`/`DESIGN.md` so every subsequent command stays aligned with the brutalist direction.

---

## Patterns Identified

### Pattern 1: JWT Claim-Based RBAC
**Description:** Store the authoritative role in Postgres, then copy it into the JWT via an Auth Hook so RLS can read it from `auth.jwt()` without a table lookup.

**Examples in codebase:** None yet (greenfield project). The Supabase docs provide the canonical example above.

**When to use:** Any time you need role-aware RLS policies and want to avoid per-row role lookups.

### Pattern 2: Trigger-Derived Profile Row
**Description:** An `after insert` trigger on `auth.users` automatically creates the `profiles` row, ensuring every auth user has a profile without client-side coordination.

**Examples in codebase:** None yet.

**When to use:** When `profiles` is required for every user and you want to guarantee consistency at the database level.

### Pattern 3: LATERAL / DISTINCT ON for Latest-Per-Group
**Description:** Use `LATERAL` with `limit 1` or `DISTINCT ON` to retrieve the most recent row per exercise/user for the weight nudge.

**Examples in codebase:** None yet.

**When to use:** “Last X for each Y” queries where `Y` is a small, known set.

### Pattern 4: Cookie-Based SSR Auth with `@supabase/ssr`
**Description:** Server Components, Server Actions, and Route Handlers receive a request-scoped Supabase client configured to read/write session cookies. Client Components use a singleton browser client.

**Examples in codebase:** None yet.

**When to use:** All Next.js App Router + Supabase projects requiring authenticated server rendering.

---

## Best Practices

### Database Schema
**Industry standard (2024):**
- Use `bigint generated always as identity primary key` for domain IDs; use `uuid` only when directly referencing `auth.users`.
- Use `timestamptz`, not `timestamp`.
- Use `text` instead of `varchar(n)` unless a length constraint is required.
- Use `numeric` for weight/money; never `float`.

**Project approach:** Adopt the schema above exactly. Add `on delete cascade` for ownership relationships and `on delete restrict` for `workout_sets.exercise_id` to preserve historical data.

### Row Level Security
**Current project approach:** Enable RLS on every table; policies use `to authenticated` and `(select auth.uid())` / `(select auth.jwt() ->> 'user_role')`.

**Industry standard:** Add indexes on columns used in policies; wrap `auth.uid()`/`auth.jwt()` in `select` to allow Postgres to cache the result per statement; add matching filters in application queries.

**Recommendation:** Follow the policy templates above and add the indexes listed in the schema block.

### Next.js + Supabase
**Current project approach:** Use `utils/supabase/server.ts`, `client.ts`, and `middleware.ts` as shown.

**Industry standard:** Prefer Server Actions for form mutations; use Route Handlers only for non-JSON responses or external integrations. Always verify identity with `getClaims()` on the server.

**Recommendation:** Use Server Actions for CRUD. Use Route Handlers only if needed for export/Docker static deployment constraints.

### YouTube Embeds
**Current project approach:** Store original URL, normalize at render time, use `youtube-nocookie.com`.

**Industry standard:** Lazy-load iframes, provide title/allow attributes, and avoid autoplay unless user-initiated.

**Recommendation:** Implement the `YouTubeEmbed` component as shown.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing roles in `raw_user_meta_data`
**Why avoid:** `raw_user_meta_data` can be modified by the authenticated user via `supabase.auth.update()`, making it unsafe for authorization.

**Better approach:** Store roles in `profiles.role` or `auth.users.raw_app_meta_data`, and inject into the JWT via an Auth Hook.

### Anti-Pattern 2: Trusting `getSession()` for authorization
**Found in:** Legacy examples.  
**Why avoid:** `getSession()` reads from cookies/storage without re-validating the JWT signature; cookies can be spoofed.

**Better approach:** Use `supabase.auth.getClaims()` for identity checks; use `getUser()` when an up-to-date user record is required.

### Anti-Pattern 3: No RLS on tables in the public schema
**Why avoid:** Any table in an exposed schema without RLS is fully readable/writable with a valid anon key.

**Better approach:** Run `alter table ... enable row level security;` on every user-facing table, and grant only the minimum privileges.

### Anti-Pattern 4: Generic AI SaaS styling
**Why avoid:** The brief explicitly asks for brutalist design; default Tailwind + Inter will look like every other AI-generated app.

**Better approach:** Use Impeccable to encode the brutalist direction in `PRODUCT.md`/`DESIGN.md`: system/monospace fonts, high contrast, exposed grids/borders, raw honesty, minimal gradients.

---

## Implementation Guidance

### Recommended Approach

1. **Bootstrap Next.js project**
   - In the worktree (`~/workspace/worktrees/trainwithgouli/feature-trainwithgouli-workout-tracker`), run `npx create-next-app@latest .` with TypeScript, Tailwind, App Router.
   - Install dependencies: `npm install @supabase/supabase-js @supabase/ssr`.

2. **Install and initialize Impeccable**
   - `npx impeccable install`
   - `/impeccable init` → choose **product** mode, encode brutalist anti-references (no gradients, no rounded cards, system/monospace fonts, exposed structure).
   - `/impeccable shape` for the main UX flows.

3. **Set up Supabase clients**
   - Create `utils/supabase/server.ts`, `utils/supabase/client.ts`, `utils/supabase/middleware.ts` as shown above.
   - Wire `middleware.ts` into `middleware.ts` at project root.

4. **Create migrations**
   - `supabase/migrations/0001_init.sql` containing: role enum, profiles table, exercises, workout_plans, plan_exercises, workout_days, workout_sets, indexes, triggers, RLS policies.
   - Apply via Supabase CLI or MCP.

5. **Seed first admin**
   - Insert the first admin via SQL or set `raw_app_meta_data` role before signup; the trigger will copy it into `profiles.role`.

6. **Build core features**
   - Auth pages (login/signup) using Server Actions.
   - Exercise library CRUD with YouTube URL input and embed.
   - Workout plan builder with ordered exercises.
   - Daily workout logger with weight nudge using the LATERAL query.
   - Social read-only view of workout days (RLS allows select all, restricts edit/delete to owner/admin).

7. **Quality gates**
   - Run `npx impeccable detect src/` before committing.
   - Review RLS policies with `supabase-postgres-best-practices` skill.

### Files to Study

- **Primary reference:** This report (schema, policies, client helpers).
- **Supabase docs:**
  - [Custom Claims & RBAC](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac)
  - [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
  - [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- **Impeccable:** [pbakaus/impeccable GitHub](https://github.com/pbakaus/impeccable)
- **Workspace skill:** `.agents/skills/supabase-postgres-best-practices/references/security-rls-basics.md`

### Quick Reference

```
Key tables: profiles, exercises, workout_plans, plan_exercises, workout_days, workout_sets
Key functions: handle_new_user(), custom_access_token_hook(), public.is_admin()
Key indexes: idx_workout_sets_exercise_user, idx_workout_days_user_id_date
Key clients: utils/supabase/server.ts, utils/supabase/client.ts, utils/supabase/middleware.ts
Key commands: /impeccable init, /impeccable shape, /impeccable craft, /impeccable bolder, /impeccable distill
Key env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

---

## Cache Metadata

- **Cache Location:**
  - Local: `.research-cache/trainwithgouli-workout-tracker-research-2026-06-17.md`
  - Memory: `research-cache/trainwithgouli-workout-tracker-research-2026-06-17`
- **Research completed:** 2026-06-17
- **Cache valid until:** 2026-06-18

---

*Generated by Code Research Agent*
