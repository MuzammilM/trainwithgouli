import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'

const SECTIONS = [
  {
    href: '/exercises',
    label: 'Exercises',
    desc: 'The movement library — every lift with a form video.',
  },
  {
    href: '/plans',
    label: 'Plans',
    desc: 'Ordered routines built from the library. Sets, reps, rest.',
  },
  {
    href: '/days',
    label: 'Days',
    desc: 'The logbook. What you lifted, when, and what to beat next.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single()
    profile = data
    isAdmin = data?.role === 'admin'
  }

  return (
    <>
      <Nav
        user={user ? { id: user.id, email: user.email, display_name: profile?.display_name } : null}
        isAdmin={isAdmin}
      />
      <main className="flex-1 w-full">
        <section className="relative overflow-hidden border-b-2 border-[var(--border)]">
          <img
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--background)_68%,transparent)]" />
          <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
            <h1 className="font-display text-[clamp(2.75rem,11vw,6rem)] leading-[0.95]">
              Train
              <br />
              with{' '}
              <span className="text-[var(--accent)]">Gouli</span>
            </h1>
            <p className="mt-6 max-w-xl font-mono text-base md:text-lg text-[var(--muted)]">
              No fluff. Log the lift, beat the number. Coaching by Harish
              Gouli — strength, structure, progressive overload.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {user ? (
                <>
                  <Link
                    href="/days/new"
                    className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm no-underline hover:bg-[var(--accent-strong)]"
                  >
                    Log a workout
                  </Link>
                  <Link
                    href="/days"
                    className="px-6 py-3 border-2 border-[var(--border)] font-black uppercase text-sm no-underline hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    View logbook
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm no-underline hover:bg-[var(--accent-strong)]"
                  >
                    Start training
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 border-2 border-[var(--border)] font-black uppercase text-sm no-underline hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <h2 className="sr-only">Sections</h2>
          <div className="border-t-2 border-[var(--border)]">
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group flex items-center justify-between gap-4 border-b-2 border-[var(--border)] px-3 md:px-5 py-6 no-underline transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                <div className="min-w-0">
                  <h3 className="font-display text-2xl md:text-3xl">
                    {section.label}
                  </h3>
                  <p className="mt-1 font-mono text-xs md:text-sm text-[var(--muted)] group-hover:text-[var(--accent-ink)] opacity-80">
                    {section.desc}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="font-display text-2xl md:text-3xl transition-transform duration-200 group-hover:translate-x-1.5"
                >
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
