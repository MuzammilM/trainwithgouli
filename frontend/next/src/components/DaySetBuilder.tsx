'use client'

import { useState } from 'react'

interface Exercise {
  id: number
  name: string
}

interface SetRow {
  exercise_id: number
  weight: string
  reps: string
  sets: string
  notes: string
}

export function DaySetBuilder({
  exercises,
  initialRows,
}: {
  exercises: Exercise[]
  initialRows?: { exercise_id: number; weight?: number; reps?: number; sets?: number; notes?: string | null }[]
}) {
  const [rows, setRows] = useState<SetRow[]>(
    initialRows?.length
      ? initialRows.map((r) => ({
          exercise_id: r.exercise_id,
          weight: r.weight?.toString() ?? '',
          reps: r.reps?.toString() ?? '',
          sets: r.sets?.toString() ?? '1',
          notes: r.notes ?? '',
        }))
      : [{ exercise_id: 0, weight: '', reps: '', sets: '1', notes: '' }]
  )

  function addRow() {
    setRows([...rows, { exercise_id: 0, weight: '', reps: '', sets: '1', notes: '' }])
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof SetRow, value: string) {
    const next = [...rows]
    next[index] = { ...next[index], [field]: value }
    setRows(next)
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <SetRowFields
          key={index}
          index={index}
          row={row}
          exercises={exercises}
          onChange={updateRow}
          onRemove={removeRow}
        />
      ))}
      <button
        type="button"
        onClick={addRow}
        className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm hover:bg-[var(--accent)] hover:text-white"
      >
        + Add set
      </button>
    </div>
  )
}

function SetRowFields({
  index,
  row,
  exercises,
  onChange,
  onRemove,
}: {
  index: number
  row: SetRow
  exercises: Exercise[]
  onChange: (index: number, field: keyof SetRow, value: string) => void
  onRemove: (index: number) => void
}) {
  const [nudge, setNudge] = useState<string | null>(null)

  async function handleExerciseChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    onChange(index, 'exercise_id', value)
    if (!value) {
      setNudge(null)
      return
    }
    try {
      const res = await fetch(`/api/last-weight?exerciseId=${value}`)
      if (!res.ok) {
        setNudge(null)
        return
      }
      const data = await res.json()
      setNudge(data.weight != null ? `Last: ${data.weight}` : null)
    } catch {
      setNudge(null)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-end border-2 border-[var(--border)] p-3 bg-[var(--background)]">
      <div className="col-span-12 md:col-span-4">
        <label className="block text-xs font-bold uppercase mb-1">Exercise *</label>
        <select
          name="exercise_ids[]"
          value={row.exercise_id || ''}
          required
          onChange={handleExerciseChange}
          className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
        >
          <option value="">Select...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
        {nudge && <span className="text-xs font-mono text-[var(--accent)] mt-1 block">{nudge}</span>}
      </div>
      <div className="col-span-4 md:col-span-2">
        <label className="block text-xs font-bold uppercase mb-1">Weight *</label>
        <input
          type="number"
          step="0.01"
          name="weights[]"
          min={0}
          required
          value={row.weight}
          onChange={(e) => onChange(index, 'weight', e.target.value)}
          className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <label className="block text-xs font-bold uppercase mb-1">Reps *</label>
        <input
          type="number"
          name="reps[]"
          min={1}
          required
          value={row.reps}
          onChange={(e) => onChange(index, 'reps', e.target.value)}
          className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <label className="block text-xs font-bold uppercase mb-1">Sets</label>
        <input
          type="number"
          name="sets[]"
          min={1}
          value={row.sets}
          onChange={(e) => onChange(index, 'sets', e.target.value)}
          className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
        />
      </div>
      <div className="col-span-10 md:col-span-1">
        <label className="block text-xs font-bold uppercase mb-1">Notes</label>
        <input
          type="text"
          name="notes[]"
          value={row.notes}
          onChange={(e) => onChange(index, 'notes', e.target.value)}
          className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
        />
      </div>
      <div className="col-span-2 md:col-span-1">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="w-full px-2 py-2 border-2 border-[var(--border)] font-bold uppercase text-xs hover:bg-[var(--accent)] hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  )
}
