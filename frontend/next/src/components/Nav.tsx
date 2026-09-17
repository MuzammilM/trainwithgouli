'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const LINKS = [
  { href: '/exercises', label: 'Exercises' },
  { href: '/plans', label: 'Plans' },
  { href: '/days', label: 'Days' },
]

function NavLinks({ className, ariaLabel }: { className?: string; ariaLabel?: string }) {
  const pathname = usePathname()
  return (
    <div className={className} aria-label={ariaLabel} role={ariaLabel ? 'navigation' : undefined}>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
          className="nav-link"
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}

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
    <nav className="sticky top-0 z-40 border-b-2 border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-3 md:gap-5 py-3">
          <NavLinks className="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-wide" />
          <div className="flex-1" />
          {user ? (
            <div className="flex items-center gap-3 min-w-0">
              <span className="hidden sm:block font-mono text-xs text-[var(--muted)] truncate">
                {user.display_name || user.email}
                {isAdmin ? ' [admin]' : ''}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border-2 border-[var(--border)] font-bold uppercase text-xs hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="nav-link text-xs md:text-sm font-bold uppercase">
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-xs no-underline hover:bg-[var(--accent-strong)]"
              >
                Sign up
              </Link>
            </div>
          )}
          <Link
            href="/"
            className="font-display text-2xl lowercase tracking-tight no-underline hover:text-[var(--foreground)]"
          >
            trainwithgouli<span className="text-[var(--accent)]">.</span>
          </Link>
        </div>
        {/* Mobile: links drop to a full-width scrollable row */}
        <NavLinks
          ariaLabel="Primary"
          className="md:hidden flex items-center gap-5 overflow-x-auto border-t border-[var(--border)] py-2 text-xs font-bold uppercase whitespace-nowrap"
        />
      </div>
    </nav>
  )
}
