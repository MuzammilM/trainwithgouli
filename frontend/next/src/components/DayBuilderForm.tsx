'use client'

import { useActionState } from 'react'
import { DayBuilder, type Exercise, type HistoryRow } from '@/components/DayBuilder'
import { saveDaySheet, type SaveDayResult } from '@/lib/actions/daysheet'

/**
 * Client wrapper for the /today day-builder form.
 * useActionState keeps form values in the DOM on error; the server action
 * redirects to /today?saved=1 on success.
 */
export function DayBuilderForm({
  clientEmail,
  dateDefault,
  exercises,
  history,
  historyError,
}: {
  clientEmail: string
  dateDefault: string
  exercises: Exercise[]
  history: HistoryRow[]
  historyError?: boolean
}) {
  const [state, formAction, pending] = useActionState<SaveDayResult | null, FormData>(
    saveDaySheet,
    null,
  )

  return (
    <form action={formAction} className="space-y-6 border-2 border-[var(--border)] bg-[var(--surface)] p-6">
      <input type="hidden" name="clientEmail" value={clientEmail} />
      <div className="md:w-64">
        <label htmlFor="date" className="block text-sm font-bold uppercase mb-1">
          Date *
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={dateDefault}
          className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] font-mono"
        />
      </div>

      <DayBuilder exercises={exercises} history={history} historyError={historyError} />

      {state && !state.ok && (
        <div role="alert" className="border-2 border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-3 py-2.5 font-mono text-sm">
          <p className="font-bold uppercase text-[var(--accent)]">{state.message}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-sm hover:bg-[var(--accent)] disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {pending ? 'Saving…' : 'Save to sheet'}
        </button>
      </div>
    </form>
  )
}
