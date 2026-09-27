'use client'

/**
 * Daily progress share card — 941×1672 portrait card rendered as absolutely
 * positioned HTML text over the committed template art. The card node is
 * scaled on-screen via CSS transform for preview; export captures an
 * un-scaled clone so the PNG is pixel-clean.
 */
import { forwardRef } from 'react'
import Image from 'next/image'
import { MuscleMap, type MuscleMapVariant } from '@/components/MuscleMap'
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

/** Card layout variant. 'simple' drops the exercise list and makes the
 *  heatmap the centered centerpiece. */
export type ShareCardVariant = 'full' | 'simple'

export type ShareCardProps = {
  /** Athlete display name (uppercased by the card). */
  name: string
  /** YYYY-MM-DD. */
  date: string
  /** Session title, e.g. "LEGS / BACK" (already uppercase). */
  sessionTitle: string
  stats: ShareStats
  entries: ExerciseEntry[]
  /**
   * Session duration in minutes. Hardcoded by the page until the app tracks
   * session timing (rendered as the DURATION tile).
   */
  durationMin: number
  /** Which muscle-map art to tint. */
  sex: MuscleMapVariant
  /** Weekly streak: distinct workout days Mon–Sun over the target. */
  streak: { done: number; target: number }
  /** Layout variant — see ShareCardVariant. */
  variant?: ShareCardVariant
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

/** Muscle map position/size per card variant (keeps the art's aspect). */
function MuscleMapPlacement({
  simple,
  sex,
  intensity,
}: {
  simple: boolean
  sex: MuscleMapVariant
  intensity: Record<HeatRegion, number>
}) {
  if (simple) {
    const h = 520
    const w = Math.round(h * (sex === 'female' ? 1136 / 1151 : 1153 / 1143))
    const left = Math.round((CARD_W - w) / 2)
    return (
      <>
        {/* The template's baked zone divider (y=888) would cut through the
            oversized map — cover it across the map's span with the card bg. */}
        <div
          className="absolute"
          style={{ left: left - 6, top: 878, width: w + 12, height: 20, background: 'oklch(0.145 0.012 25)' }}
        />
        <div className="absolute" style={{ left, top: 580, width: w, height: h }}>
          <MuscleMap variant={sex} intensity={intensity} />
        </div>
      </>
    )
  }
  return (
    <div className="absolute right-[56px] top-[588px] h-[295px] w-[298px]">
      <MuscleMap variant={sex} intensity={intensity} />
    </div>
  )
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard(
    { name, date, sessionTitle, stats, entries, durationMin, sex, streak, variant = 'full' },
    ref,
  ) {
    const { rows, hidden } = tableRows(entries)
    const heat = regionIntensity(stats)
    const simple = variant === 'simple'
    const maxBucketSets = Math.max(
      1,
      ...FOCUS_BUCKETS.map((b) => stats.bucketSets[b]),
    )

    // Exercise list auto-scale: the table zone (y 888..1425) holds a heading,
    // column header, and up to 14 rows. Rows cap at a comfortable 44px so
    // short days stay compact like the mockup; beyond 14, cap with "+N MORE".
    const rowCount = rows.length + (hidden > 0 ? 1 : 0)
    const rowH = rowCount > 0 ? Math.max(28, Math.min(44, Math.floor(442 / rowCount))) : 0
    const nameSize = rowH >= 40 ? 17 : rowH >= 34 ? 15 : rowH >= 28 ? 13 : 11
    const numSize = rowH >= 40 ? 12 : rowH >= 34 ? 11 : 10

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

        {/* ── Session title (stacked block, zone A ends at divider y=410) ── */}
        <div className="absolute left-[51px] top-[222px] w-[580px]">
          <div
            className="font-display uppercase leading-[0.95] text-[oklch(0.945_0.012_60)]"
            style={{ fontSize: 52, letterSpacing: '0.005em' }}
          >
            {sessionTitle}
          </div>
          <div
            className="font-display mt-2 uppercase leading-[0.95] text-[oklch(0.64_0.2_22)]"
            style={{ fontSize: 52, letterSpacing: '0.005em' }}
          >
            TRAINING SESSION
          </div>
        </div>

        {/* ── Stat tiles (zone B top, y 470..590) ───────────────────────── */}
        <div className="absolute left-[51px] top-[470px] flex w-[840px] justify-between">
          {(
            [
              { label: 'EXERCISES', value: String(stats.exerciseCount) },
              { label: 'WEEK STREAK', value: `${streak.done}/${streak.target}` },
              { label: 'DURATION', value: String(durationMin), unit: 'MIN' },
            ] as { label: string; value: string; unit?: string }[]
          ).map((tile) => (
            <div key={tile.label} className="w-[250px]">
              <div
                className="font-mono text-[oklch(0.62_0.02_30)]"
                style={{ fontSize: 15, letterSpacing: '0.12em' }}
              >
                {tile.label}
              </div>
              <div
                className="font-display mt-3 leading-none text-[oklch(0.945_0.012_60)]"
                style={{ fontSize: 46 }}
              >
                {tile.value}
                {tile.unit && (
                  <span
                    className="font-mono text-[oklch(0.62_0.02_30)]"
                    style={{ fontSize: 18, letterSpacing: '0.08em' }}
                  >
                    {' '}
                    {tile.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Focus bars + heatmap ─────────────────────────────────────────
            full:  bars y596 left col; map 295px right side (zone B)
            simple: map ~520px centered (y580–1100); no focus bars */}
        {!simple && (
        <div className="absolute left-[51px] top-[596px] w-[380px]">
          <div
            className="font-mono text-[oklch(0.62_0.02_30)]"
            style={{ fontSize: 15, letterSpacing: '0.12em' }}
          >
            FOCUS AREAS
          </div>
          <div className="mt-5">
            {FOCUS_BUCKETS.map((bucket) => {
              const sets = stats.bucketSets[bucket]
              return (
                <div key={bucket} className="mb-[14px]">
                  <div className="flex items-baseline justify-between">
                    <span
                      className="font-display uppercase leading-none text-[oklch(0.945_0.012_60)]"
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
                    className="mt-[6px] h-[8px] w-full"
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
        )}

        {/* Muscle map — size/position per variant; container keeps the art's
            aspect so the figures never distort. */}
        <MuscleMapPlacement simple={simple} sex={sex} intensity={heat} />

        {/* ── Exercise list (zone C: y 888..1425; full variant only) ────── */}
        {!simple && (
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
        )}

        {/* ── Footer (explicit widths — text sits above baked underlines) ── */}
        <div
          className="absolute left-[45px] top-[1524px] w-[255px] whitespace-nowrap font-mono text-[oklch(0.945_0.012_60)]"
          style={{ fontSize: 13, letterSpacing: '0.08em', lineHeight: 1.5 }}
        >
          TRAINED WITH PURPOSE.
          <br />
          ONE REP AT A TIME.
        </div>
        <div
          className="absolute left-[315px] top-[1546px] w-[240px] whitespace-nowrap font-mono text-[oklch(0.62_0.02_30)]"
          style={{ fontSize: 12, letterSpacing: '0.1em' }}
        >
          {stats.totalSets} SETS · {stats.exerciseCount} EXERCISES
        </div>
        <div
          className="absolute right-[47px] top-[1546px] w-[190px] whitespace-nowrap text-right font-mono text-[oklch(0.945_0.012_60)]"
          style={{ fontSize: 13, letterSpacing: '0.1em' }}
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
