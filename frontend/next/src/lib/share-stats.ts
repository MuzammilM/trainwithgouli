/**
 * Pure stat computation for the daily progress share card.
 * No server-only imports — unit-testable, safe in client components.
 */
import { normalizeEntries, setCountOf, type ExerciseEntry } from '@/lib/exercise'

/** The five focus buckets shown as bars on the card. */
export type FocusBucket = 'legs' | 'back' | 'arms' | 'core' | 'conditioning'

export const FOCUS_BUCKETS: FocusBucket[] = [
  'legs',
  'back',
  'arms',
  'core',
  'conditioning',
]

export const FOCUS_LABELS: Record<FocusBucket, string> = {
  legs: 'LEGS',
  back: 'BACK',
  arms: 'ARMS',
  core: 'CORE',
  conditioning: 'CONDITIONING',
}

/** body_part tag → bucket (an exercise may carry several tags). */
const TAG_TO_BUCKET: Record<string, FocusBucket> = {
  legs: 'legs',
  back: 'back',
  arms: 'arms',
  shoulders: 'arms',
  chest: 'arms',
  core: 'core',
  'full body': 'core',
  cardio: 'conditioning',
}

/** Heatmap regions rendered on the body silhouettes. */
export type HeatRegion =
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'chest'
  | 'delts'
  | 'lats'
  | 'traps'
  | 'biceps'
  | 'triceps'
  | 'abs'

/** Heatmap region → the bucket whose intensity drives its fill. */
export const REGION_BUCKET: Record<HeatRegion, FocusBucket> = {
  quads: 'legs',
  hamstrings: 'legs',
  calves: 'legs',
  chest: 'arms',
  delts: 'arms',
  lats: 'back',
  traps: 'back',
  biceps: 'arms',
  triceps: 'arms',
  abs: 'core',
}

/** Heatmap region → display label (used for a11y titles). */
export const REGION_LABELS: Record<HeatRegion, string> = {
  quads: 'Quads',
  hamstrings: 'Hamstrings / glutes',
  calves: 'Calves',
  chest: 'Chest',
  delts: 'Delts',
  lats: 'Lats',
  traps: 'Traps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abs: 'Abs',
}

export type ShareStats = {
  /** Number of logged exercises. */
  exerciseCount: number
  /** Σ setCountOf(entry) across all entries. */
  totalSets: number
  /** Σ setCountOf × reps (first int of a range) across all entries. */
  totalReps: number
  /** Σ weight × reps × sets over entries with a numeric weight (kg, BW excluded). */
  totalVolume: number
  /** Set count per focus bucket, in FOCUS_BUCKETS order. */
  bucketSets: Record<FocusBucket, number>
  /** Total sets that mapped into any bucket (denominator for shares). */
  mappedSets: number
  /** Top buckets by set volume, best first. */
  topBuckets: FocusBucket[]
  /** Per-bucket intensity 0..1 (share of mapped sets). */
  bucketIntensity: Record<FocusBucket, number>
}

/** First integer in a reps string ("8-10" → 8, "10" → 10). */
export function repsOf(entry: ExerciseEntry): number {
  const m = entry.reps.match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

/** Numeric weight in kg, or null when the entry is bodyweight / non-numeric. */
export function weightKgOf(entry: ExerciseEntry): number | null {
  const w = (entry.weight ?? '').trim()
  if (!w) return null
  const n = Number.parseFloat(w)
  return Number.isFinite(n) ? n : null
}

/** Weight cell for the exercise table: numeric kg, "BW", or "—". */
export function weightLabelOf(entry: ExerciseEntry): string {
  const kg = weightKgOf(entry)
  if (kg == null) {
    const w = (entry.weight ?? '').trim()
    return w ? w.toUpperCase() : '—'
  }
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1)
}

/** "25 SEP 2026"-style label from a YYYY-MM-DD string. */
export function formatCardDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return iso.slice(0, 10)
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ]
  return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`
}

/** Compute every stat the share card renders, from a raw exercises JSON value. */
export function computeShareStats(rawExercises: unknown): ShareStats {
  const entries = normalizeEntries(rawExercises)

  let totalSets = 0
  let totalReps = 0
  let totalVolume = 0
  const bucketSets: Record<FocusBucket, number> = {
    legs: 0,
    back: 0,
    arms: 0,
    core: 0,
    conditioning: 0,
  }

  for (const entry of entries) {
    const sets = setCountOf(entry)
    const reps = repsOf(entry)
    totalSets += sets
    totalReps += sets * reps

    const kg = weightKgOf(entry)
    if (kg != null) totalVolume += kg * reps * sets

    // Bucket mapping happens in the page (needs the exercises collection);
    // here we only aggregate what entries alone can tell us.
  }

  return {
    exerciseCount: entries.length,
    totalSets,
    totalReps,
    totalVolume: Math.round(totalVolume),
    bucketSets,
    mappedSets: 0,
    topBuckets: [],
    bucketIntensity: { legs: 0, back: 0, arms: 0, core: 0, conditioning: 0 },
  }
}

/**
 * Fold body-part tags into bucket set counts. `tagSets` maps a lowercased
 * body_part tag → total sets logged for exercises carrying that tag
 * (an exercise with N tags contributes its sets to each tag).
 */
export function applyBucketSets(
  stats: ShareStats,
  tagSets: Record<string, number>,
): ShareStats {
  const bucketSets: Record<FocusBucket, number> = {
    legs: 0,
    back: 0,
    arms: 0,
    core: 0,
    conditioning: 0,
  }
  for (const [tag, sets] of Object.entries(tagSets)) {
    const bucket = TAG_TO_BUCKET[tag.trim().toLowerCase()]
    if (bucket) bucketSets[bucket] += sets
  }
  const mappedSets = FOCUS_BUCKETS.reduce((sum, b) => sum + bucketSets[b], 0)
  const topBuckets = FOCUS_BUCKETS.filter((b) => bucketSets[b] > 0).sort(
    (a, b) => bucketSets[b] - bucketSets[a],
  )
  const bucketIntensity = { ...bucketSets }
  if (mappedSets > 0) {
    for (const b of FOCUS_BUCKETS) {
      bucketIntensity[b] = bucketSets[b] / mappedSets
    }
  }
  return { ...stats, bucketSets, mappedSets, topBuckets, bucketIntensity }
}

/** Session title from the day's focus: top-2 buckets joined with " / ". */
export function sessionTitleOf(stats: ShareStats): string {
  const top = stats.topBuckets.slice(0, 2)
  if (top.length === 0) return 'TRAINING SESSION'
  return top.map((b) => FOCUS_LABELS[b]).join(' / ')
}
