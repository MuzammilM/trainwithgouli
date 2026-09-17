'use client'

import { useState } from 'react'
import { createClient } from '@/lib/pocketbase/client'
import { setSession } from '@/lib/actions/auth'

export function GoogleButton() {
  const [pending, setPending] = useState(false)

  async function handleGoogle() {
    setPending(true)
    try {
      const pb = createClient()
      const auth = await pb.collection('users').authWithOAuth2({ provider: 'google' })
      await setSession(auth.token)
    } catch {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={pending}
      aria-disabled={pending}
      className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm hover:bg-[var(--accent-strong)] active:scale-[0.98] transition-transform disabled:hover:bg-[var(--accent)]"
    >
      {pending ? 'Connecting…' : 'Continue with Google'}
    </button>
  )
}
