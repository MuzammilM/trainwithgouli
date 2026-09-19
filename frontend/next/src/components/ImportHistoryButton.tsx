'use client'

import { useState, useTransition } from 'react'
import {
  importClientHistory,
  type ImportHistoryResult,
} from '@/lib/actions/clients'

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Not allowed.',
  'client-not-found': 'Client record not found.',
  'no-sheet': 'This client has no verified sheet yet.',
  'user-not-found': 'No user account exists for this client email.',
  'service-error': 'Service account unavailable — try again later.',
  'sheet-error': 'Could not read the Google Sheet (access or format error).',
}

/**
 * "Import history" button for one client row on /clients (coach view).
 * Confirm step via window.confirm, disabled while pending, and shows the
 * result (or error) as a line under the row after the run.
 */
export function ImportHistoryButton({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportHistoryResult | null>(null)

  const run = () => {
    if (
      !window.confirm(
        'Import past workout days from this client’s Google Sheet into /days? Existing days are never overwritten.',
      )
    ) {
      return
    }
    startTransition(async () => {
      try {
        const r = await importClientHistory(clientId)
        setResult(r)
      } catch {
        setResult({ ok: false, code: 'sheet-error' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Importing…' : 'Import history'}
      </button>
      {result && (
        <span className="font-mono text-xs text-[var(--muted)] max-w-64">
          {result.ok
            ? `Imported ${result.imported} day${result.imported === 1 ? '' : 's'}, skipped ${result.skipped} (already existed)` +
              (result.errors.length > 0 ? ` · ${result.errors.length} error(s): ${result.errors.join('; ')}` : '')
            : ERROR_MESSAGES[result.code] ?? `Import failed (${result.code})`}
        </span>
      )}
    </div>
  )
}
