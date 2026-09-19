'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  assignWorkout,
  updateAssignment,
  deleteAssignment,
  type AssignResult,
} from '@/lib/actions/today'
import { emptyEntry, type ExerciseEntry } from '@/lib/exercise'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'

type ClientOption = { id: string; email: string; name: string }
type TemplateOption = { id: string; name: string; entries: ExerciseEntry[] }
type ExerciseOption = { id: string; name: string }
type ExistingDay = {
  id: string
  date: string
  exercises: ExerciseEntry[]
  notes: string | null
  sheet_row_start: number | null
  sheet_order: string[] | null
}

function isoToDdMm(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}
function ddMmToIso(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const dt = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  if (Number(m[1]) !== dt.getDate() || Number(m[2]) !== dt.getMonth() + 1) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

export function CoachDayConsole({
  clients,
  templates,
  exerciseOptions,
  selectedEmail,
  date,
  existingDay,
}: {
  clients: ClientOption[]
  templates: TemplateOption[]
  exerciseOptions: ExerciseOption[]
  selectedEmail: string
  date: string
  existingDay: ExistingDay | null
}) {
  const router = useRouter()
  const [dateText, setDateText] = useState(isoToDdMm(date))
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<ExerciseEntry[]>(
    existingDay?.exercises?.length ? existingDay.exercises : [],
  )
  const [assignState, assignAction, assignPending] = useActionState<AssignResult | null, FormData>(
    assignWorkout,
    null,
  )
  const [updateState, updateAction, updatePending] = useActionState<AssignResult | null, FormData>(
    updateAssignment,
    null,
  )

  function navigate(nextEmail: string, nextDateIso: string) {
    const params = new URLSearchParams({ client: nextEmail, date: nextDateIso })
    router.push(`/today-coach?${params.toString()}`)
  }

  function onClientChange(email: string) {
    const iso = ddMmToIso(dateText) ?? date
    navigate(email, iso)
  }

  function onDateChange(text: string) {
    setDateText(text)
    const iso = ddMmToIso(text)
    if (iso && selectedEmail) navigate(selectedEmail, iso)
  }

  function setRow(index: number, patch: Partial<ExerciseEntry>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function move(index: number, delta: number) {
    setRows((prev) => {
      const next = [...prev]
      const j = index + delta
      if (j < 0 || j >= next.length) return prev
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  const doneCount = rows.filter((r) => r.done).length
  const hasRows = rows.length > 0

  return (
    <div className="space-y-6">
      {/* Selector row */}
      <div className="grid gap-3 md:grid-cols-2 border-2 border-[var(--border)] bg-[var(--surface)] p-4">
        <div>
          <label htmlFor="client" className="block text-sm font-bold uppercase mb-1">
            Client
          </label>
          <select
            id="client"
            value={selectedEmail}
            onChange={(e) => onClientChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] font-mono text-sm"
          >
            {clients.map((c) => (
              <option key={c.email} value={c.email}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-bold uppercase mb-1">
            Date (DD/MM/YYYY)
          </label>
          <input
            id="date"
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={dateText}
            onChange={(e) => setDateText(e.target.value)}
            onBlur={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] font-mono text-sm"
          />
        </div>
      </div>

      {assignState?.ok && assignState.warning && (
        <p role="status" className="border-2 border-[var(--accent)] px-3 py-2 font-mono text-sm">
          {assignState.warning}
        </p>
      )}
      {assignState && !assignState.ok && (
        <p role="alert" className="border-2 border-[var(--accent)] px-3 py-2 font-mono text-sm">
          {assignState.message}
        </p>
      )}
      {updateState && !updateState.ok && (
        <p role="alert" className="border-2 border-[var(--accent)] px-3 py-2 font-mono text-sm">
          {updateState.message}
        </p>
      )}

      {existingDay ? (
        /* ---------- EXISTING DAY ---------- */
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black uppercase">
              Assigned — {isoToDdMm(existingDay.date)}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRows(existingDay.exercises)
                  setEditing(!editing)
                }}
                className="px-3 py-1.5 border-2 border-[var(--border)] font-bold uppercase text-xs hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                {editing ? 'Close editor' : 'Edit'}
              </button>
              <form action={deleteAssignment.bind(null, existingDay.id)}>
                <ConfirmSubmit
                  label="Delete assignment"
                  message="Delete this assignment? The client loses their Today workout (the sheet copy stays)."
                  className="px-3 py-1.5 border-2 border-[var(--border)] font-bold uppercase text-xs hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                />
              </form>
            </div>
          </div>

          {/* Live client progress */}
          <div>
            <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)] mb-1">
              <span>
                Client progress: {doneCount}/{rows.length} done
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-2)] border border-[var(--border)]">
              <div
                className="h-full bg-[var(--accent)]"
                style={{ width: rows.length ? `${(doneCount / rows.length) * 100}%` : '0%' }}
              />
            </div>
            <ul className="mt-2 font-mono text-sm space-y-0.5">
              {rows.map((r, i) => (
                <li key={i} className={r.done ? 'line-through opacity-60' : ''}>
                  {r.name} — {r.done ? 'done' : `${r.sets}×${r.reps}`}
                </li>
              ))}
            </ul>
          </div>

          {editing && (
            <div className="space-y-3 border-2 border-[var(--border)] p-4 bg-[var(--surface)]">
              <p className="font-mono text-xs text-[var(--muted)]">
                Sheet copy stays as assigned — app is live source.
              </p>
              <form action={updateAction}>
                <input type="hidden" name="dayId" value={existingDay.id} />
                <input type="hidden" name="entries" value={JSON.stringify(rows)} />
                <RowEditor rows={rows} setRow={setRow} move={move} setRows={setRows} exerciseOptions={exerciseOptions} />
                <button
                  type="submit"
                  disabled={updatePending}
                  className="mt-4 px-6 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm disabled:opacity-50 hover:bg-[var(--accent-strong)]"
                >
                  {updatePending ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </div>
          )}
        </section>
      ) : (
        /* ---------- NEW ASSIGNMENT ---------- */
        <section className="space-y-4">
          <h2 className="text-xl font-black uppercase">No workout assigned for this date</h2>

          {templates.length > 0 && (
            <div>
              <label htmlFor="template" className="block text-sm font-bold uppercase mb-1">
                Start from template
              </label>
              <select
                id="template"
                defaultValue=""
                onChange={(e) => {
                  const t = templates.find((x) => x.id === e.target.value)
                  if (t) setRows(t.entries.map((en) => ({ ...en, done: false, client_notes: '', circuit: null })))
                }}
                className="w-full max-w-md px-3 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono text-sm"
              >
                <option value="">Ad-hoc (blank)…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.entries.length})
                  </option>
                ))}
              </select>
            </div>
          )}

          <form action={assignAction} className="space-y-3 border-2 border-[var(--border)] p-4 bg-[var(--surface)]">
            <input type="hidden" name="clientEmail" value={selectedEmail} />
            <input type="hidden" name="date" value={ddMmToIso(dateText) ?? date} />
            <input type="hidden" name="entries" value={JSON.stringify(rows)} />
            <RowEditor rows={rows} setRow={setRow} move={move} setRows={setRows} exerciseOptions={exerciseOptions} />
            <button
              type="submit"
              disabled={assignPending || !hasRows}
              className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm disabled:opacity-50 hover:bg-[var(--accent-strong)]"
            >
              {assignPending ? 'Assigning…' : 'Assign workout'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

function RowEditor({
  rows,
  setRow,
  move,
  setRows,
  exerciseOptions,
}: {
  rows: ExerciseEntry[]
  setRow: (index: number, patch: Partial<ExerciseEntry>) => void
  move: (index: number, delta: number) => void
  setRows: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>
  exerciseOptions: ExerciseOption[]
}) {
  if (rows.length === 0) {
    return (
      <p className="font-mono text-sm text-[var(--muted)]">
        No rows yet — pick a template above or add an exercise.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-12 gap-2 items-end border-2 border-[var(--border)] p-3 bg-[var(--background)]"
        >
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-bold uppercase mb-1">Exercise</label>
            <select
              value={row.name}
              onChange={(e) => setRow(index, { name: e.target.value })}
              className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono text-sm"
            >
              <option value="">Select…</option>
              {exerciseOptions.map((ex) => (
                <option key={ex.id} value={ex.name}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="block text-xs font-bold uppercase mb-1">Weight</label>
            <input
              type="text"
              value={row.weight ?? ''}
              onChange={(e) => setRow(index, { weight: e.target.value })}
              className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono"
            />
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
              onClick={() => move(index, -1)}
              className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase disabled:opacity-30 hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
            >
              ↑ Up
            </button>
            <button
              type="button"
              disabled={index === rows.length - 1}
              onClick={() => move(index, 1)}
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
  )
}
