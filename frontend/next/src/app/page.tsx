import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'

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
      <Nav user={user ? { id: user.id, email: user.email, display_name: profile?.display_name } : null} isAdmin={isAdmin} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
            TrainWithGouli
          </h1>
          <p className="text-xl md:text-2xl font-mono max-w-2xl">
            A brutalist workout tracker. Log exercises, build plans, chase progressive overload.
          </p>
        </header>

        <section className="grid md:grid-cols-3 gap-6">
          <Link
            href="/exercises"
            className="group block p-6 border-2 border-[var(--border)] bg-[var(--surface)] no-underline hover:shadow-[var(--shadow)] transition-shadow"
          >
            <h2 className="text-2xl font-black uppercase mb-2 group-hover:text-[var(--accent)]">Exercises</h2>
            <p className="font-mono text-[var(--muted)]">Browse, add, and manage the exercise library with YouTube demos.</p>
          </Link>
          <Link
            href="/plans"
            className="group block p-6 border-2 border-[var(--border)] bg-[var(--surface)] no-underline hover:shadow-[var(--shadow)] transition-shadow"
          >
            <h2 className="text-2xl font-black uppercase mb-2 group-hover:text-[var(--accent)]">Plans</h2>
            <p className="font-mono text-[var(--muted)]">Build ordered workout routines from the exercise library.</p>
          </Link>
          <Link
            href="/days"
            className="group block p-6 border-2 border-[var(--border)] bg-[var(--surface)] no-underline hover:shadow-[var(--shadow)] transition-shadow"
          >
            <h2 className="text-2xl font-black uppercase mb-2 group-hover:text-[var(--accent)]">Days</h2>
            <p className="font-mono text-[var(--muted)]">Log daily workouts and track weight progression over time.</p>
          </Link>
        </section>
      </main>
    </>
  )
}
