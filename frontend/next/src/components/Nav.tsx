'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function Nav({
  user,
  isAdmin,
}: {
  user: { id: string; email?: string; display_name?: string | null } | null
  isAdmin: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-black uppercase tracking-tighter no-underline hover:text-[var(--accent)]">
          TrainWithGouli
        </Link>
        <div className="flex flex-wrap items-center gap-6 text-sm font-bold uppercase tracking-wide">
          <Link href="/exercises" className="no-underline hover:text-[var(--accent)]">Exercises</Link>
          <Link href="/plans" className="no-underline hover:text-[var(--accent)]">Plans</Link>
          <Link href="/days" className="no-underline hover:text-[var(--accent)]">Days</Link>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-[var(--muted)]">
                {user.display_name || user.email}
                {isAdmin ? ' [admin]' : ''}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 border-2 border-[var(--border)] bg-[var(--background)] font-bold uppercase text-xs hover:bg-[var(--accent)] hover:text-white"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="no-underline hover:text-[var(--accent)]">Log in</Link>
              <Link
                href="/signup"
                className="px-3 py-1 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-bold uppercase text-xs no-underline hover:bg-[var(--accent)]"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
