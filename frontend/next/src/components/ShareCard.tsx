'use client'

/**
 * Daily progress share card — 941×1672 portrait card rendered as absolutely
 * positioned HTML text over the committed template art. The card node is
 * scaled on-screen via CSS transform for preview; export captures an
 * un-scaled clone so the PNG is pixel-clean.
 */
import { forwardRef } from 'react'
import Image from 'next/image'
import { BodySilhouette, type BodySide } from '@/components/BodySilhouette'
import {
  FOCUS_BUCKETS,
  FOCUS_LABELS,
  REGION_BUCKET,
  weightLabelOf,
  repsOf,
  type ShareStats,
  type HeatRegion,
} from '@/lib/share-stats'
import { setCountOf } from '@/lib/exercise'
import type { ExerciseEntry } from '@/lib/exercise'

export const CARD_W = 941
export const CARD_H = 1672

export type ShareCardProps = {
  /** Athlete display name (uppercased by the card). */
  name: string
  /** YYYY-MM-DD. */
  date: string
  /** Session title, e.g. "LEGS / BACK" (already uppercase). */
  sessionTitle: string
  stats: ShareStats
  entries: ExerciseEntry[]
}

/** Region intensity per heatmap region, from bucket intensity. */
function regionIntensity(stats: ShareStats): Record<HeatRegion, number> {
  const out = {} as Record<HeatRegion, number>
  for (const region of Object.keys(REGION_BUCKET) as HeatRegion[]) {
    out[region] = stats.bucketIntensity[REGION_BUCKET[region]] ?? 0
  }
  return out
}

/** Rows for the exercise table, capped with a "+N MORE" tail. */
function tableRows(entries: ExerciseEntry[]): {
  rows: ExerciseEntry[]
  hidden: number
} {
  const MAX = 14
  if (entries.length <= MAX) return { rows: entries, hidden: 0 }
  return { rows: entries.slice(0, MAX), hidden: entries.length - MAX }
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ name, date, sessionTitle, stats, entries }, ref) {
    const { rows, hidden } = tableRows(entries)
    const heat = regionIntensity(stats)
    const maxBucketSets = Math.max(
      1,
      ...FOCUS_BUCKETS.map((b) => stats.bucketSets[b]),
    )

    // Exercise list auto-scale: the table zone (y 888..1425) holds a heading,
    // column header, and up to 14 rows; shrink rows as the count grows, then
    // cap with "+N MORE".
    const rowCount = rows.length + (hidden > 0 ? 1 : 0)
    const rowH = rowCount > 0 ? Math.floor(442 / rowCount) : 0
    const nameSize = rowH >= 26 ? 18 : rowH >= 20 ? 16 : rowH >= 16 ? 14 : rowH >= 12 ? 12 : 10
    const numSize = rowH >= 20 ? 13 : rowH >= 16 ? 12 : 11

    return (
      <div
        ref={ref}
        data-share-card
        className="relative overflow-hidden bg-[oklch(0.145_0.012_25)] text-[oklch(0.945_0.012_60)]"
        style={{ width: CARD_W, height: CARD_H }}
      >
        <Image
          src="/share/card-template.png"
          alt=""
          width={941}
          height={1672}
          priority
          draggable={false}
          className="absolute inset-0 h-full w-full select-none"
        />

        {/* ── Top zone: name + date (y 70..405) ─────────────────────────── */}
        <div className="absolute left-[51px] top-[92px] w-[460px]">
          <div
            className="font-display uppercase leading-none text-[oklch(0.945_0.012_60)]"
            style={{ fontSize: 44, letterSpacing: '0.01em' }}
          >
            {name}
          </div>
          <div
            className="font-mono mt-4 text-[oklch(0.62_0.02_30)]"
            style={{ fontSize: 20, letterSpacing: '0.14em' }}
          >
            {date}
          </div>
        </div>

        {/* ── Session title (y 225..395, zone A ends at divider y=410) ───── */}
        <div
          className="absolute left-[51px] top-[225px] font-display uppercase leading-[0.95] text-[oklch(0.945_0.012_60)]"
          style={{ fontSize: 56, letterSpacing: '0.005em' }}
        >
          {sessionTitle}
        </div>
        <div
          className="absolute left-[51px] top-[302px] font-display uppercase leading-[0.95] text-[oklch(0.64_0.2_22)]"
          style={{ fontSize: 56, letterSpacing: '0.005em' }}
        >
          TRAINING SESSION
        </div>

        {/* ── Stat tiles (y 415..885) ───────────────────────────────────── */}
        <div className="absolute left-[51px] top-[470px] flex w-[840px] justify-between">
          {[
            { label: 'EXERCISES', value: String(stats.exerciseCount) },
            { label: 'WORKING SETS', value: String(stats.totalSets) },
            {
              label: 'TOTAL VOLUME',
              value: stats.totalVolume > 0 ? `${stats.totalVolume.toLocaleString('en-IN')} KG` : '—',
            },
            { label: 'TOTAL REPS', value: String(stats.totalReps) },
          ].map((tile) => (
            <div key={tile.label} className="w-[190px]">
              <div
                className="font-mono text-[oklch(0.62_0.02_30)]"
                style={{ fontSize: 15, letterSpacing: '0.12em' }}
              >
                {tile.label}
              </div>
              <div
                className="font-display mt-3 leading-none text-[oklch(0.945_0.012_60)]"
                style={{ fontSize: 52 }}
              >
                {tile.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Focus bars + heatmap (zone B: y 410..888) ─────────────────── */}
        <div className="absolute left-[51px] top-[610px] w-[380px]">
          <div
            className="font-mono text-[oklch(0.62_0.02_30)]"
            style={{ fontSize: 15, letterSpacing: '0.12em' }}
          >
            FOCUS AREAS
          </div>
          <div className="mt-5 space-y-[18px]">
            {FOCUS_BUCKETS.map((bucket) => {
              const sets = stats.bucketSets[bucket]
              const share = stats.mappedSets > 0 ? sets / stats.mappedSets : 0
              return (
                <div key={bucket}>
                  <div className="flex items-baseline justify-between">
                    <span
                      className="font-display uppercase text-[oklch(0.945_0.012_60)]"
                      style={{ fontSize: 20 }}
                    >
                      {FOCUS_LABELS[bucket]}
                    </span>
                    <span
                      className="font-mono text-[oklch(0.62_0.02_30)]"
                      style={{ fontSize: 13 }}
                    >
                      {sets}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-[10px] w-full"
                    style={{ background: 'oklch(0.26 0.014 25)' }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.round((sets / maxBucketSets) * 100)}%`,
                        background: 'oklch(0.64 0.2 22)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="absolute right-[51px] top-[600px] flex h-[275px] items-start justify-end gap-6">
          {(['front', 'back'] as BodySide[]).map((side) => (
            <div key={side} className="h-full">
              <BodySilhouette side={side} intensity={heat} />
            </div>
          ))}
        </div>

        {/* ── Exercise list (zone C: y 888..1425) ───────────────────────── */}
        <div className="absolute left-[51px] top-[905px] w-[840px]">
          <div
            className="font-display uppercase leading-none text-[oklch(0.945_0.012_60)]"
            style={{ fontSize: 34 }}
          >
            EXERCISE LIST
          </div>
          <div
            className="mt-5 grid font-mono text-[oklch(0.62_0.02_30)]"
            style={{
              fontSize: 12,
              letterSpacing: '0.1em',
              gridTemplateColumns: '44px 1fr 120px 110px',
            }}
          >
            <span>#</span>
            <span>EXERCISE</span>
            <span className="text-right">WEIGHT</span>
            <span className="text-right">REPS × SETS</span>
          </div>
          <div style={{ marginTop: 6 }}>
            {rows.map((e, i) => (
              <div
                key={`${e.name}-${i}`}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '44px 1fr 120px 110px',
                  height: rowH,
                }}
              >
                <span
                  className="font-mono text-[oklch(0.62_0.02_30)]"
                  style={{ fontSize: numSize }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="font-display truncate uppercase text-[oklch(0.945_0.012_60)]"
                  style={{ fontSize: nameSize, lineHeight: 1.05 }}
                >
                  {e.name}
                </span>
                <span
                  className="text-right font-mono text-[oklch(0.945_0.012_60)]"
                  style={{ fontSize: numSize }}
                >
                  {weightLabelOf(e)}
                </span>
                <span
                  className="text-right font-mono text-[oklch(0.64_0.2_22)]"
                  style={{ fontSize: numSize }}
                >
                  {repsOf(e)} × {setCountOf(e)}
                </span>
              </div>
            ))}
            {hidden > 0 && (
              <div
                className="grid items-center"
                style={{
                  gridTemplateColumns: '44px 1fr 120px 110px',
                  height: rowH,
                }}
              >
                <span />
                <span
                  className="font-mono text-[oklch(0.62_0.02_30)]"
                  style={{ fontSize: numSize }}
                >
                  +{hidden} MORE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer (text above baked underlines) ──────────────────────── */}
        <div
          className="absolute left-[45px] top-[1530px] font-mono text-[oklch(0.945_0.012_60)]"
          style={{ fontSize: 15, letterSpacing: '0.08em', lineHeight: 1.5 }}
        >
          TRAINED WITH PURPOSE.
          <br />
          ONE REP AT A TIME.
        </div>
        <div
          className="absolute left-[266px] top-[1548px] font-mono text-[oklch(0.62_0.02_30)]"
          style={{ fontSize: 13, letterSpacing: '0.1em' }}
        >
          {stats.totalSets} SETS · {stats.exerciseCount} EXERCISES
        </div>
        <div
          className="absolute right-[47px] top-[1548px] text-right font-mono text-[oklch(0.945_0.012_60)]"
          style={{ fontSize: 15, letterSpacing: '0.1em' }}
        >
          MYSORE, INDIA
        </div>
      </div>
    )
  },
)

/** Sample data for visual verification without a real logged day. */
export const SAMPLE_NAME = 'MUZAMMIL HASAN MOMIN'
export const SAMPLE_DATE = '2026-09-25'

export function sampleEntries() {
  return [
    { name: 'Back Squat', weight: '80', sets: '5', reps: '5', rest: '180s', done: true, coach_notes: '', client_notes: '', circuit: null },
    { name: 'Romanian Deadlift', weight: '70', sets: '4', reps: '8', rest: '120s', done: true, coach_notes: '', client_notes: '', circuit: null },
    { name: 'Barbell Row', weight: '60', sets: '4', reps: '8', rest: '120s', done: true, coach_notes: '', client_notes: '', circuit: null },
    { name: 'Pull Up', weight: 'BW', sets: '4', reps: '8', rest: '90s', done: true, coach_notes: '', client_notes: '', circuit: null },
    { name: 'Overhead Press', weight: '40', sets: '3', reps: '10', rest: '90s', done: true, coach_notes: '', client_notes: '', circuit: null },
    { name: 'Face Pull', weight: '15', sets: '3', reps: '15', rest: '60s', done: true, coach_notes: '', client_notes: '', circuit: null },
    { name: 'Hanging Leg Raise', weight: 'BW', sets: '3', reps: '12', rest: '60s', done: true, coach_notes: '', client_notes: '', circuit: null },
    { name: 'Treadmill Incline Walk', weight: '', sets: '1', reps: '15', rest: '', done: true, coach_notes: '', client_notes: '', circuit: null },
  ] satisfies ExerciseEntry[]
}

/** Sample tag→sets map matching sampleEntries (for preview mode). */
export function sampleTagSets(): Record<string, number> {
  const m: Record<string, number> = {}
  const add = (tag: string, sets: number) => {
    m[tag] = (m[tag] ?? 0) + sets
  }
  add('legs', 5) // Back Squat
  add('legs', 4) // Romanian Deadlift
  add('back', 4) // Barbell Row
  add('back', 4) // Pull Up
  add('shoulders', 3) // Overhead Press
  add('shoulders', 3) // Face Pull
  add('core', 3) // Hanging Leg Raise
  add('cardio', 1) // Treadmill
  return m
}
