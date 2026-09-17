'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const LINKS = [
  { href: '/exercises', label: 'Exercises' },
  { href: '/plans', label: 'Plans' },
  { href: '/days', label: 'Days' },
]

function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname()
  return (
    <div className={className}>
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
}: {
  user: { id: string; email?: string; name?: string; role?: string } | null
}) {
  const isCoach = user?.role === 'coach'

  return (
    <nav aria-label="Primary" className="sticky top-0 z-40 border-b-2 border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-3 md:gap-5 py-3">
          <NavLinks className="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-wide" />
          <div className="flex-1" />
          {user ? (
            <div className="flex items-center gap-3 min-w-0">
              <span className="hidden sm:block font-mono text-xs text-[var(--muted)] truncate">
                {user.name || user.email}
                {isCoach ? ' [coach]' : ''}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center min-h-11 px-3 border-2 border-[var(--border)] font-bold uppercase text-xs hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="nav-link text-xs md:text-sm font-bold uppercase py-3.5 md:py-1">
                Log in
              </Link>
            </div>
          )}
          <Link
            href="/"
            className="group font-display text-2xl lowercase tracking-tight no-underline"
          >
            trainwithgouli
            <span className="text-[var(--accent)] transition-colors group-hover:text-[var(--accent-strong)]">
              .
            </span>
          </Link>
        </div>
        {/* Mobile: links drop to a full-width scrollable row */}
        <NavLinks className="md:hidden flex items-center gap-5 overflow-x-auto border-t border-[var(--border)] text-xs font-bold uppercase whitespace-nowrap [&_a]:py-3.5" />
      </div>
    </nav>
  )
}
