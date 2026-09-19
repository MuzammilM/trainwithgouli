'use client'

import { useState } from 'react'
import { ExercisePicker } from '@/components/ExercisePicker'

export interface Exercise {
  id: string
  name: string
  body_part?: string[] | null
  youtube_url?: string | null
}

export interface HistoryRow {
  date: string
  exercise: string
  weight: string
  reps: string
  sets: string
  rest: string
}

interface Row {
  exerciseId: string
  exerciseName: string
  youtubeUrl: string
  weight: string
  reps: string
  sets: string
  notes: string
}

const EMPTY_ROW: Row = {
  exerciseId: '',
  exerciseName: '',
  youtubeUrl: '',
  weight: '',
  reps: '',
  sets: '1',
  notes: '',
}

function formatGuideDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

/**
 * Most recent history row (by ISO date) matching the exercise name
 * case-insensitively. Returns null when there is no match.
 */
function findLastLift(history: HistoryRow[], exerciseName: string): HistoryRow | null {
  const needle = exerciseName.trim().toLowerCase()
  if (!needle) return null
  let best: HistoryRow | null = null
  for (const row of history) {
    if (row.exercise.trim().toLowerCase() === needle) {
      if (!best || row.date > best.date) best = row
    }
  }
  return best
}

export function DayBuilder({
  exercises,
  history,
  historyError,
}: {
  exercises: Exercise[]
  history: HistoryRow[]
  historyError?: boolean
}) {
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }])

  function addRow() {
    setRows([...rows, { ...EMPTY_ROW }])
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index))
  }

  function updateRow(index: number, patch: Partial<Row>) {
    const next = [...rows]
    next[index] = { ...next[index], ...patch }
    setRows(next)
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <DayRowFields
          key={index}
          index={index}
          row={row}
          exercises={exercises}
          history={history}
          historyError={historyError}
          onChange={updateRow}
          onRemove={removeRow}
        />
      ))}
      <button
        type="button"
        onClick={addRow}
        className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
      >
        + Add exercise
      </button>
    </div>
  )
}

function DayRowFields({
  index,
  row,
  exercises,
  history,
  historyError,
  onChange,
  onRemove,
}: {
  index: number
  row: Row
  exercises: Exercise[]
  history: HistoryRow[]
  historyError?: boolean
  onChange: (index: number, patch: Partial<Row>) => void
  onRemove: (index: number) => void
}) {
  const last = row.exerciseName ? findLastLift(history, row.exerciseName) : null

  function handleSelect(exerciseName: string, ex?: Exercise) {
    onChange(index, {
      exerciseId: ex?.id ?? '',
      exerciseName,
      youtubeUrl: ex?.youtube_url ?? '',
    })
  }

  return (
    <div className="border-2 border-[var(--border)] p-3 bg-[var(--background)] space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-2 md:items-end">
        <div className="col-span-12 md:col-span-4">
          <label className="block text-xs font-bold uppercase mb-1">Exercise *</label>
          <input type="hidden" name="exercise[]" value={row.exerciseName} />
          <ExercisePicker
            exercises={exercises}
            selectedName={row.exerciseName}
            onSelect={handleSelect}
          />
          {row.exerciseName && row.youtubeUrl && (
            <a
              href={row.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 font-mono text-[11px] no-underline text-[var(--muted)] hover:text-[var(--accent)]"
            >
              Form video ↗
            </a>
          )}
        </div>
        <div className="col-span-12 md:col-span-2">
          <label className="block text-xs font-bold uppercase mb-1">Weight *</label>
          <input
            type="text"
            name="weight[]"
            required
            value={row.weight}
            onChange={(e) => onChange(index, { weight: e.target.value })}
            className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono"
          />
          {row.exerciseName && (
            <span className="block mt-1 font-mono text-[11px] text-[var(--muted)]">
              {last
                ? `Last: ${last.weight} · ${formatGuideDate(last.date)}`
                : historyError
                  ? 'History unavailable'
                  : 'No history yet'}
            </span>
          )}
        </div>
        <div className="col-span-12 md:col-span-2">
          <label className="block text-xs font-bold uppercase mb-1">Reps *</label>
          <input
            type="text"
            name="reps[]"
            required
            value={row.reps}
            onChange={(e) => onChange(index, { reps: e.target.value })}
            className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono"
          />
          {row.exerciseName && last && (
            <span className="block mt-1 font-mono text-[11px] text-[var(--muted)]">Last: {last.reps}</span>
          )}
        </div>
        <div className="col-span-12 md:col-span-2">
          <label className="block text-xs font-bold uppercase mb-1">Sets</label>
          <input
            type="text"
            name="sets[]"
            value={row.sets}
            onChange={(e) => onChange(index, { sets: e.target.value })}
            className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono"
          />
          {row.exerciseName && last && (
            <span className="block mt-1 font-mono text-[11px] text-[var(--muted)]">Last: {last.sets}</span>
          )}
        </div>
        <div className="col-span-12 md:col-span-1">
          <label className="block text-xs font-bold uppercase mb-1">Notes</label>
          <input
            type="text"
            name="notes[]"
            value={row.notes}
            onChange={(e) => onChange(index, { notes: e.target.value })}
            className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
          />
        </div>
        <div className="col-span-12 md:col-span-1 flex md:block">
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove exercise ${index + 1}`}
            className="w-full px-2 py-2 border-2 border-[var(--border)] font-bold uppercase text-xs hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
