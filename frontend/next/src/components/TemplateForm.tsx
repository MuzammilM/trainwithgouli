'use client'

import { useActionState, useState } from 'react'
import { createTemplate, updateTemplate, type TemplateResult } from '@/lib/actions/templates'
import { emptyEntry, type ExerciseEntry } from '@/lib/exercise'

type ExerciseOption = { id: string; name: string }

/**
 * Template builder: name + dynamic exercise rows (exercise select, sets, reps,
 * rest, coach notes). Rows are serialized to a hidden JSON field on submit.
 */
export function TemplateForm({
  exercises,
  templateId,
  initialName,
  initialEntries,
}: {
  exercises: ExerciseOption[]
  templateId?: string
  initialName?: string
  initialEntries?: ExerciseEntry[]
}) {
  const [rows, setRows] = useState<ExerciseEntry[]>(
    initialEntries?.length ? initialEntries : [emptyEntry()],
  )
  const [state, formAction, pending] = useActionState<TemplateResult | null, FormData>(
    templateId ? updateTemplate : createTemplate,
    null,
  )

  function setRow(index: number, patch: Partial<ExerciseEntry>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <form action={formAction} className="space-y-6">
      {templateId && <input type="hidden" name="id" value={templateId} />}
      <input type="hidden" name="entries" value={JSON.stringify(rows)} />

      <div>
        <label htmlFor="name" className="block text-sm font-bold uppercase mb-1">
          Template name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialName}
          className="w-full max-w-md px-3 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
        />
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 items-end border-2 border-[var(--border)] p-3 bg-[var(--background)]"
          >
            <div className="col-span-12 md:col-span-4">
              <label className="block text-xs font-bold uppercase mb-1">Exercise *</label>
              <select
                value={row.name}
                required
                onChange={(e) => setRow(index, { name: e.target.value })}
                className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
              >
                <option value="">Select...</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.name}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">Sets</label>
              <input
                type="text"
                value={row.sets}
                onChange={(e) => setRow(index, { sets: e.target.value })}
                className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono"
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">Reps</label>
              <input
                type="text"
                value={row.reps}
                onChange={(e) => setRow(index, { reps: e.target.value })}
                className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono"
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">Rest</label>
              <input
                type="text"
                value={row.rest}
                onChange={(e) => setRow(index, { rest: e.target.value })}
                className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono"
              />
            </div>
            <div className="col-span-12 md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">Coach notes</label>
              <input
                type="text"
                value={row.coach_notes}
                onChange={(e) => setRow(index, { coach_notes: e.target.value })}
                className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
              />
            </div>
            <div className="col-span-12 flex gap-2">
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                Remove
              </button>
              <button
                type="button"
                disabled={index === 0}
                onClick={() =>
                  setRows((prev) => {
                    const next = [...prev]
                    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                    return next
                  })
                }
                className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase disabled:opacity-30 hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                ↑ Up
              </button>
              <button
                type="button"
                disabled={index === rows.length - 1}
                onClick={() =>
                  setRows((prev) => {
                    const next = [...prev]
                    ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                    return next
                  })
                }
                className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase disabled:opacity-30 hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                ↓ Down
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyEntry()])}
          className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
        >
          + Add exercise
        </button>
      </div>

      {state && !state.ok && (
        <p role="alert" className="border-2 border-[var(--accent)] px-3 py-2 font-mono text-sm">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm disabled:opacity-50 hover:bg-[var(--accent-strong)]"
      >
        {pending ? 'Saving…' : 'Save template'}
      </button>
    </form>
  )
}
