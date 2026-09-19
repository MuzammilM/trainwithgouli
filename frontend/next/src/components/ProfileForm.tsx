'use client'

import { useState, useTransition } from 'react'
import { updateProfile, type UpdateProfileResult } from '@/lib/actions/profile'

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-name': 'Name is required (max 80 characters).',
  'invalid-mobile': 'Mobile must be 8–15 characters: digits, spaces, dashes, optional leading +.',
  'save-failed': 'Could not save your profile. Try again.',
  unauthenticated: 'Session expired — log in again.',
}

export function ProfileForm({
  name,
  mobile,
  alias,
  boardDisplay,
}: {
  name: string
  mobile: string
  alias: string
  boardDisplay: string
}) {
  const [result, setResult] = useState<UpdateProfileResult | null>(null)
  const [pending, startTransition] = useTransition()
  const [aliasValue, setAliasValue] = useState(alias)
  const hasAlias = aliasValue.trim().length > 0

  function handleSubmit(formData: FormData) {
    setResult(null)
    startTransition(async () => {
      const res = await updateProfile(formData)
      setResult(res)
    })
  }

  const error = result && !result.ok ? result.code : null

  return (
    <section aria-label="Edit profile" className="border-2 border-[var(--border)] bg-[var(--surface)] p-4 max-w-xl">
      <form action={handleSubmit} className="grid gap-4">
        <div>
          <label htmlFor="profile-name" className="block font-mono text-xs uppercase text-[var(--muted)] mb-1">
            Name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            required
            maxLength={80}
            defaultValue={name}
            className="w-full min-h-11 px-3 bg-[var(--background)] border-2 border-[var(--border)] font-mono text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
        <div>
          <label htmlFor="profile-mobile" className="block font-mono text-xs uppercase text-[var(--muted)] mb-1">
            Mobile <span className="normal-case">(optional)</span>
          </label>
          <input
            id="profile-mobile"
            name="mobile"
            type="tel"
            defaultValue={mobile}
            placeholder="+971 50 123 4567"
            className="w-full min-h-11 px-3 bg-[var(--background)] border-2 border-[var(--border)] font-mono text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
        <div>
          <label htmlFor="profile-alias" className="block font-mono text-xs uppercase text-[var(--muted)] mb-1">
            Leaderboard alias <span className="normal-case">(optional, max 40)</span>
          </label>
          <input
            id="profile-alias"
            name="alias"
            type="text"
            maxLength={40}
            defaultValue={alias}
            onChange={(e) => setAliasValue(e.target.value)}
            className="w-full min-h-11 px-3 bg-[var(--background)] border-2 border-[var(--border)] font-mono text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
        <fieldset className="grid gap-2">
          <legend className="font-mono text-xs uppercase text-[var(--muted)] mb-1">
            Leaderboard display
          </legend>
          <label className="flex items-center gap-2 font-mono text-sm">
            <input
              type="radio"
              name="board_display"
              value="alias"
              defaultChecked={boardDisplay !== 'name'}
              disabled={!hasAlias}
              className="accent-[var(--accent)]"
            />
            Show my alias
          </label>
          <label className="flex items-center gap-2 font-mono text-sm">
            <input
              type="radio"
              name="board_display"
              value="name"
              defaultChecked={boardDisplay === 'name'}
              disabled={!hasAlias}
              className="accent-[var(--accent)]"
            />
            Show my real name
          </label>
          {!hasAlias ? (
            <p className="font-mono text-xs text-[var(--muted)]">
              Set an alias first to control board display.
            </p>
          ) : null}
        </fieldset>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 px-5 border-2 border-[var(--border)] bg-[var(--accent)] text-[var(--accent-ink)] font-bold uppercase text-sm hover:bg-[var(--accent-strong)] disabled:opacity-60 active:scale-[0.98] transition-transform justify-self-start"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </form>

      {error ? (
        <div role="alert" className="mt-3 border-2 border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-3 py-2.5 font-mono text-sm">
          <p className="font-bold uppercase text-[var(--accent)]">Error</p>
          <p className="text-[var(--muted)]">{ERROR_MESSAGES[error] || 'Something went wrong. Try again.'}</p>
        </div>
      ) : null}
    </section>
  )
}
