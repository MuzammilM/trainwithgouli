'use client'

import { useState, useTransition } from 'react'
import { addClient, type AddClientResult } from '@/lib/actions/clients'

const SA_EMAIL = 'mcp-sheets-service@maps-planner-482115.iam.gserviceaccount.com'

const BLOCKED_MESSAGES: Record<string, string> = {
  'invalid-sheet-url': 'That does not look like a Google Sheets URL. Paste the full sheet link.',
  'invalid-email': 'Enter a valid client email.',
  '404': 'Sheet not found — check the URL.',
  '403': 'The service account cannot open this sheet yet.',
  'missing-sa-config': 'Service account is not configured on the server. Contact the admin.',
  'sa-error': 'Service account error. Contact the admin.',
  unknown: 'Could not verify sheet access. Try again.',
}

export function AddClientForm() {
  const [result, setResult] = useState<AddClientResult | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setResult(null)
    startTransition(async () => {
      const res = await addClient(formData)
      setResult(res)
    })
  }

  const blocked = result && !result.ok

  return (
    <section aria-label="Add client" className="border-2 border-[var(--border)] bg-[var(--surface)] p-4 mb-8">
      <h2 className="font-display text-2xl uppercase mb-4">Add client</h2>
      <form action={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_2fr_auto] items-end">
        <div>
          <label htmlFor="client-email" className="block font-mono text-xs uppercase text-[var(--muted)] mb-1">
            Client email
          </label>
          <input
            id="client-email"
            name="email"
            type="email"
            required
            placeholder="athlete@example.com"
            className="w-full min-h-11 px-3 bg-[var(--background)] border-2 border-[var(--border)] font-mono text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
        <div>
          <label htmlFor="client-sheet" className="block font-mono text-xs uppercase text-[var(--muted)] mb-1">
            Google Sheet URL
          </label>
          <input
            id="client-sheet"
            name="sheet_url"
            type="url"
            required
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full min-h-11 px-3 bg-[var(--background)] border-2 border-[var(--border)] font-mono text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 px-5 border-2 border-[var(--border)] bg-[var(--accent)] text-[var(--accent-ink)] font-bold uppercase text-sm hover:bg-[var(--accent-strong)] disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {pending ? 'Verifying…' : 'Add'}
        </button>
      </form>

      {result?.ok ? (
        <p role="status" className="mt-3 border-2 border-[var(--border)] px-3 py-2.5 font-mono text-sm">
          {result.account === 'created'
            ? 'Client added — login account ready.'
            : result.account === 'existing'
              ? 'Client added — login account already exists.'
              : 'Client added — sheet verified.'}
        </p>
      ) : null}

      {blocked && result && !result.ok ? (
        <div role="alert" className="mt-3 border-2 border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-3 py-2.5 font-mono text-sm">
          <p className="font-bold uppercase text-[var(--accent)] mb-1">
            Blocked — sheet not shared ({result.code})
          </p>
          <p className="text-[var(--muted)] mb-2">
            {BLOCKED_MESSAGES[result.code] || BLOCKED_MESSAGES.unknown}
          </p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Open your Google Sheet → Share</li>
            <li>
              Add <span className="text-[var(--foreground)]">{SA_EMAIL}</span> as <strong>Editor</strong>
            </li>
            <li>Re-submit the form</li>
          </ol>
        </div>
      ) : null}
    </section>
  )
}
