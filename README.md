# TrainWithGouli

A brutalist workout tracker built with Next.js, Supabase, and Tailwind CSS.

## Product

TrainWithGouli helps users log workouts, build exercise plans, and track progressive overload. It supports two roles: **user** and **admin**. Admins can edit/delete any exercise or plan; users can only edit/delete their own.

## Core features

- Authentication via Supabase Auth (email/password).
- Exercise library with YouTube embeds.
- Workout plan builder with ordered exercises.
- Daily workout logging with weight/reps/sets.
- Weight nudge: when selecting an exercise, show the last recorded weight for the current user.
- Social read-only feed of all users' workout days.

## Tech stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- @supabase/ssr cookie-based auth
- Supabase Postgres + RLS

## Getting started

```bash
cd frontend/next
cp .env.example .env.local
# Fill in your Supabase URL and publishable key
npm install
npm run dev
```

Apply the Supabase migration in `supabase/migrations/0001_trainwithgouli_init.sql` to your project.

The first user to sign up is automatically promoted to `admin` via the `handle_first_user_admin` trigger.
