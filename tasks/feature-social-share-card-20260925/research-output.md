# Research Output — feature-social-share-card-20260925

(Compiled inline by orchestrator after code-research-agent looped twice — session tool issue, not a reasoning failure.)

## 1. Workout day data model

PocketBase collection `workout_days` (see src/app/today-client/page.tsx:9-17, src/app/days/page.tsx:7-13):
```ts
type WorkoutDay = {
  id: string
  user: string
  date: string            // ISO, e.g. "2026-09-25 00:00:00.000Z" — slice(0,10) for YYYY-MM-DD
  exercises: unknown      // JSON array of ExerciseEntry
  notes: string | null
  sheet_row_start: number | null
  sheet_order: string[] | null
}
```

ExerciseEntry (src/lib/exercise.ts:5-17) — copy-paste ready:
```ts
export type ExerciseEntry = {
  name: string
  weight?: string         // STRING — '', '60', possibly 'BW' or '60 kg'; parse numerically, non-numeric = bodyweight (exclude from volume)
  sets: string            // e.g. "3" — use setCountOf() (clamped 1..10)
  reps: string            // e.g. "10" (may be ranges like "8-10" — parse first int)
  rest: string
  done: boolean
  coach_notes: string
  client_notes: string
  circuit: string | null
  sets_done?: boolean[]
}
```
Helpers to reuse: `normalizeEntries(raw)`, `setCountOf(entry)`, `isEntryDone(entry)` — all in src/lib/exercise.ts.

## 2. Duration: NOT TRACKED
No start/end time or duration field exists anywhere (workout_days has no timestamps; sheets history has none). **The mockup's DURATION tile cannot be computed.** Replace with a real stat (recommendation: TOTAL REPS).

## 3. Body-part mapping
- src/lib/body-parts.ts is only a constant list:
  `['back','chest','legs','shoulders','arms','core','full body','cardio']`
- Real mapping lives on the `exercises` PocketBase collection: each exercise has
  `body_part: string[]` (see src/app/today-coach/page.tsx:69-70, src/app/plan/new/page.tsx:17-18).
- Fetch: `pb.collection('exercises').getFullList({ fields: 'id,name,body_part' })`,
  match entries to tags by lowercased trimmed name.
- No heatmap/volume-per-part code exists — build new.

## 4. Client pages & Share button mount points
- `/today` → role router; clients → `/today-client` (server component, src/app/today-client/page.tsx).
  Renders `<TodayChecklist>` client component (src/components/TodayChecklist.tsx).
  → **Share button: in the header row next to the `Today` h1 (page.tsx:95), rendered only when `day` exists, linking to `/share/{today}`.**
- `/days` (server component, src/app/days/page.tsx) — one `<article>` per day (line 66-92).
  → **Share button: small icon button (Lucide Share2) inside each article's header row (line 70-76), linking to `/share/{YYYY-MM-DD}` (day.date.slice(0,10)).**

## 5. Volume aggregation
None exists. Build a pure helper (suggest src/lib/share-stats.ts):
- totalSets = Σ setCountOf(e)
- totalReps = Σ setCountOf(e) × parseInt(reps)
- totalVolume = Σ over entries with numeric weight: weight × reps × sets
- exercises = entries.length; doneExercises = entries.filter(isEntryDone).length
- focus: map body_part tags → 5 buckets for the bars:
  LEGS: legs | BACK: back | ARMS: arms, shoulders, chest | CORE: core, full body | CONDITIONING: cardio

## 6. Fonts
Anton (`--font-anton`, weight 400), Archivo (`--font-archivo`), Geist_Mono (`--font-geist-mono`)
loaded via next/font/google in src/app/layout.tsx with CSS variables — available in Tailwind as
`font-display` / `font-sans` / `font-mono` (globals.css @theme inline). Card text uses these classes;
the capture library inlines computed styles so fonts embed into the PNG.

## 7. Template + capture approach (user-approved)
- Template PNG (941×1672, 9:16): copy from
  `/Users/muzammil/workspace/smarann/gdrive/6cf8b64c759c4d3a31756638d314b5fc194444fbe685d6e9618e3b028761c7ee.png`
  → `frontend/next/public/share/card-template.png` (user explicitly granted access to this file).
- Render card at 941×1672 design size; visually scale down with CSS transform for preview.
- Capture with `modern-screenshot` (add dependency; zero-dep, maintained html-to-image successor)
  at pixelRatio 2 → crisp PNG → download + navigator.share({files}) fallback.
- Overlay: absolutely-positioned HTML text in the template's empty zones (between the red divider
  lines). Verify alignment visually with a browser screenshot during implementation.

## 8. Next.js 16 notes
- Server components fetch via `@/lib/pocketbase/server` (`serverClient()`, `getAuthUser()`).
  Reuse the today-client date-range filter pattern for /share/[date].
- Follow frontend/next/AGENTS.md: read node_modules/next/dist/docs/ if any API is uncertain.
- No DB migrations, no API contract changes → DBA audit not required.

## 9. Design system tokens (globals.css)
--background / --surface / --surface-2 / --foreground / --muted / --accent (red) / --border /
--font-display (Anton) / --font-mono (Geist Mono). Card matches mockup: Anton for display,
mono for labels, accent red for numbers/lines, near-black background.
