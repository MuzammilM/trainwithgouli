'use client'

/**
 * Sex classification badge + inline edit for a client row. Renders the
 * current value (or "Unset") and flips to a select + save on edit.
 */
import { useState, useTransition } from 'react'
import { setClientSex, type ClientSex } from '@/lib/actions/clients'

export function ClientSexControl({ clientId, sex }: { clientId: string; sex: ClientSex | '' }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<ClientSex>(sex === 'female' ? 'female' : 'male')
  const [pending, startTransition] = useTransition()

  const save = () => {
    startTransition(async () => {
      await setClientSex(clientId, value)
      setEditing(false)
    })
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Set sex classification"
        className="px-2 py-0.5 border-2 border-[var(--border)] text-xs font-bold uppercase text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        {sex || 'Unset'}
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as ClientSex)}
        className="min-h-8 px-2 bg-[var(--background)] border-2 border-[var(--border)] font-mono text-xs"
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] disabled:opacity-60"
      >
        {pending ? '…' : 'Save'}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="px-2 py-1 text-xs font-bold uppercase text-[var(--muted)] hover:text-[var(--accent)]"
      >
        Cancel
      </button>
    </span>
  )
}
