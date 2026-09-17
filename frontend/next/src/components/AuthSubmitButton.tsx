'use client'

import { useFormStatus } from 'react-dom'

export function AuthSubmitButton({
  label,
  pendingLabel,
}: {
  label: string
  pendingLabel: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm hover:bg-[var(--accent-strong)] active:scale-[0.98] transition-transform disabled:hover:bg-[var(--accent)]"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
