'use client'

import { useState } from 'react'

interface Exercise {
  id: number
  name: string
}

export function PlanExerciseBuilder({ exercises, initialRows }: { exercises: Exercise[]; initialRows?: { exercise_id: number; sets?: number; reps?: number; rest_seconds?: number }[] }) {
  const [rows, setRows] = useState(
    initialRows?.length
      ? initialRows
      : [{ exercise_id: 0, sets: undefined, reps: undefined, rest_seconds: undefined }]
  )

  function addRow() {
    setRows([...rows, { exercise_id: 0, sets: undefined, reps: undefined, rest_seconds: undefined }])
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof (typeof rows)[0], value: string | number) {
    const next = [...rows]
    next[index] = { ...next[index], [field]: value }
    setRows(next)
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end border-2 border-[var(--border)] p-3 bg-[var(--background)]">
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-bold uppercase mb-1">Exercise</label>
            <select
              name="exercise_ids[]"
              value={row.exercise_id}
              required
              onChange={(e) => updateRow(index, 'exercise_id', Number(e.target.value))}
              className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
            >
              <option value="">Select...</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-4 md:col-span-2">
            <label className="block text-xs font-bold uppercase mb-1">Sets</label>
            <input
              type="number"
              name="sets[]"
              min={1}
              value={row.sets ?? ''}
              onChange={(e) => updateRow(index, 'sets', Number(e.target.value))}
              className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
            />
          </div>
          <div className="col-span-4 md:col-span-2">
            <label className="block text-xs font-bold uppercase mb-1">Reps</label>
            <input
              type="number"
              name="reps[]"
              min={1}
              value={row.reps ?? ''}
              onChange={(e) => updateRow(index, 'reps', Number(e.target.value))}
              className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
            />
          </div>
          <div className="col-span-4 md:col-span-2">
            <label className="block text-xs font-bold uppercase mb-1">Rest (s)</label>
            <input
              type="number"
              name="rest_seconds[]"
              min={0}
              value={row.rest_seconds ?? ''}
              onChange={(e) => updateRow(index, 'rest_seconds', Number(e.target.value))}
              className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
            />
          </div>
          <div className="col-span-12 md:col-span-2">
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="w-full px-2 py-2 border-2 border-[var(--border)] font-bold uppercase text-xs hover:bg-[var(--accent)] hover:text-white"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm hover:bg-[var(--accent)] hover:text-white"
      >
        + Add exercise
      </button>
    </div>
  )
}
