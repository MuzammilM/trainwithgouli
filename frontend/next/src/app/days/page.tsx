import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'

export default async function DaysPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <>
        <Nav user={null} isAdmin={false} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono">
            Please{' '}
            <Link href="/login" className="font-bold hover:text-[var(--accent)]">log in</Link>{' '}
            to view days.
          </p>
        </main>
      </>
    )
  }

  const [{ data: profile }, { data: days }] = await Promise.all([
    supabase.from('profiles').select('role, display_name').eq('id', user.id).single(),
    supabase
      .from('workout_days')
      .select('*, profiles(display_name), workout_sets(*, exercises(name))')
      .order('date', { ascending: false }),
  ])

  const isAdmin = profile?.role === 'admin'

  return (
    <>
      <Nav
        user={{ id: user.id, email: user.email, display_name: profile?.display_name }}
        isAdmin={isAdmin}
      />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Workout days</h1>
          <Link
            href="/days/new"
            className="px-4 py-2 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-sm no-underline hover:bg-[var(--accent)]"
          >
            Log day
          </Link>
        </div>

        {days && days.length > 0 ? (
          <div className="space-y-6">
            {days.map((day) => (
              <article key={day.id} className="border-2 border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <Link href={`/days/${day.id}`} className="text-2xl font-black uppercase no-underline hover:text-[var(--accent)]">
                      {day.date}
                    </Link>
                    <p className="font-mono text-sm text-[var(--muted)]">
                      {day.profiles?.display_name || 'Unknown'}
                      {day.workout_sets && ` · ${day.workout_sets.length} set${day.workout_sets.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>
                {day.notes && <p className="font-mono text-sm mb-3">{day.notes}</p>}
                {day.workout_sets && day.workout_sets.length > 0 && (
                  <ul className="font-mono text-sm space-y-1">
                    {day.workout_sets.map((set: any) => (
                      <li key={set.id}>
                        {set.exercises?.name}: {set.weight} × {set.reps} @ {set.sets} set{set.sets === 1 ? '' : 's'}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[var(--muted)]">No workout days logged yet.</p>
        )}
      </main>
    </>
  )
}
