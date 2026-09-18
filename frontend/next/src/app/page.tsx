import Link from 'next/link'
import { ArrowRight, Clock3, HeartPulse, Medal, Trophy, Users } from 'lucide-react'
import { getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { COACH, type CoachCredentialIcon } from '@/content/coach'

const CREDENTIAL_ICONS: Record<CoachCredentialIcon, typeof Medal> = {
  medal: Medal,
  trophy: Trophy,
  users: Users,
  heartpulse: HeartPulse,
  clock: Clock3,
}

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
  const user = await getAuthUser()

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 w-full">
        {/* Mobile: vertical coach banner is the first thing seen; CTAs sit under it (desktop keeps the HTML hero) */}
        <section className="md:hidden">
          <img
            src="/images/coach-banner-vertical.jpg"
            alt="Train with Harish Gouli — strength, martial arts, rehabilitation"
            className="w-full h-auto block"
            decoding="async"
          />
          <div className="px-4 py-4 flex flex-col gap-3 border-b-2 border-[var(--border)]">
            {user ? (
              <>
                <Link
                  href="/days/new"
                  className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm text-center no-underline hover:bg-[var(--accent-strong)]"
                >
                  Log a workout
                </Link>
                <Link
                  href="/days"
                  className="px-6 py-3 border-2 border-[var(--border)] font-black uppercase text-sm text-center no-underline hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  View logbook
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm text-center no-underline hover:bg-[var(--accent-strong)]"
                >
                  Start training
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 border-2 border-[var(--border)] font-black uppercase text-sm text-center no-underline hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </section>
        <section className="relative overflow-hidden border-b-2 border-[var(--border)] hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80"
            alt=""
            aria-hidden
            decoding="async"
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
                    href="/login"
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

        {/* The Coach — hero band v2. Content: src/content/coach.ts */}
        <section
          aria-labelledby="coach-heading"
          className="relative overflow-hidden border-b-2 border-[var(--border)] hidden md:block"
        >
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
              {/* Content zone */}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {COACH.eyebrow}
                </p>
                <h2
                  id="coach-heading"
                  className="mt-6 font-display text-[clamp(3rem,10vw,6rem)] leading-[0.9]"
                >
                  <span className="block">{COACH.nameTop}</span>
                  <span className="block text-[var(--accent)]">
                    {COACH.nameBottom}
                  </span>
                </h2>
                <p className="mt-4 font-mono text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                  {COACH.roles}
                </p>
                <p className="mt-6 max-w-[46ch] text-base md:text-lg text-[var(--muted)] text-pretty">
                  {COACH.bio}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  {COACH.ctas.map((cta) =>
                    cta.variant === 'primary' ? (
                      <Link
                        key={cta.href + cta.label}
                        href={cta.href}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--accent-ink)] font-black uppercase text-sm no-underline hover:bg-[var(--accent-strong)]"
                      >
                        {cta.label}
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    ) : (
                      <Link
                        key={cta.href + cta.label}
                        href={cta.href}
                        className="inline-flex items-center justify-center px-6 py-3 border-2 border-[var(--border)] font-black uppercase text-sm no-underline hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        {cta.label}
                      </Link>
                    ),
                  )}
                </div>

                {/* Credential strip — 1px hairline grid, not cards */}
                <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-px bg-[var(--border)] border border-[var(--border)]">
                  {COACH.credentials.map((cred, i) => {
                    const Icon = CREDENTIAL_ICONS[cred.icon]
                    const isOrphan =
                      i === COACH.credentials.length - 1 &&
                      COACH.credentials.length % 2 === 1
                    return (
                      <div
                        key={cred.label}
                        className={`bg-[var(--background)] px-4 py-4 ${isOrphan ? 'col-span-2 md:col-span-1' : ''}`}
                      >
                        <Icon
                          aria-hidden
                          className="size-5 text-[var(--muted)]"
                        />
                        <h3 className="mt-2 text-xs tracking-wide">
                          {cred.label}
                        </h3>
                        <p className="mt-0.5 font-mono text-xs uppercase text-[var(--muted)]">
                          {cred.sub}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Photo zone */}
              <div className="relative overflow-hidden">
                <div className="coach-photo-frame relative mr-3 mb-3 aspect-[16/10] lg:aspect-[4/5]">
                  <img
                    src={COACH.photo.src}
                    alt={COACH.photo.alt}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
                  />
                  {/* Subdue to the dark world: overall darken + left-edge fade (gi stays blue) */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[color-mix(in_oklch,var(--background)_35%,transparent)]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_right,var(--background)_0%,transparent_45%)]"
                  />
                </div>
                {/* Background word stack — print on the poster */}
                <div
                  aria-hidden
                  className="coach-bg-words pointer-events-none absolute inset-y-0 right-0 z-20 flex select-none flex-col justify-center text-right font-display"
                >
                  {COACH.backgroundWords.map((word) => (
                    <span key={word} className="block">
                      {word}
                    </span>
                  ))}
                </div>
                {COACH.sideNotes.map((note) => (
                  <span
                    key={note.text}
                    aria-hidden
                    className={`pointer-events-none absolute right-6 z-30 hidden select-none font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)] lg:block ${
                      note.position === 'top' ? 'top-6' : 'bottom-6'
                    }`}
                  >
                    {note.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom hairline row */}
            <div className="mt-12 flex flex-col gap-2 border-t border-[var(--border)] pt-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)] sm:flex-row sm:justify-between lg:mt-16">
              <span>{COACH.footerLeft}</span>
              <span>{COACH.footerRight}</span>
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
                  <p className="mt-1 font-mono text-xs md:text-sm text-[var(--muted)] group-hover:text-[var(--accent-ink)] opacity-80 group-hover:opacity-100">
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
