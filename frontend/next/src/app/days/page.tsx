import Link from 'next/link'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'

type WorkoutSet = {
  id: string
  workout_day_id: string
  exercise_id: string
  weight: number
  reps: number
  sets: number
  notes: string | null
  expand?: { exercise?: { name: string } }
}

export default async function DaysPage() {
  const user = await getAuthUser()

  if (!user) {
    return (
      <>
        <Nav user={null} />
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

  const pb = await serverClient()
  const [days, sets] = await Promise.all([
    pb.collection('workout_days').getFullList({ sort: '-date' }),
    pb.collection('workout_sets').getFullList<WorkoutSet>({ expand: 'exercise' }),
  ])

  const setsByDay = new Map<string, WorkoutSet[]>()
  for (const set of sets) {
    const list = setsByDay.get(set.workout_day_id) || []
    list.push(set)
    setsByDay.set(set.workout_day_id, list)
  }

  const userIds = [...new Set(days.map((day) => day.user_id))]
  const users = userIds.length
    ? await pb.collection('users').getFullList({
        filter: userIds.map((id) => `id = "${id}"`).join(' || '),
        fields: 'id,name,email',
      })
    : []
  const userNames = new Map(users.map((u) => [u.id, u.name || u.email]))

  const isAdmin = user.role === 'coach'

  return (
    <>
      <Nav user={user} />
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
            {days.map((day) => {
              const daySets = setsByDay.get(day.id) || []
              return (
                <article key={day.id} className="border-2 border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <Link href={`/days/${day.id}`} className="text-2xl font-black uppercase no-underline hover:text-[var(--accent)]">
                        {day.date}
                      </Link>
                      <p className="font-mono text-sm text-[var(--muted)]">
                        {userNames.get(day.user_id) || 'Unknown'}
                        {daySets.length > 0 && ` · ${daySets.length} set${daySets.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                  </div>
                  {day.notes && <p className="font-mono text-sm mb-3">{day.notes}</p>}
                  {daySets.length > 0 && (
                    <ul className="font-mono text-sm space-y-1">
                      {daySets.map((set) => (
                        <li key={set.id}>
                          {set.expand?.exercise?.name}: {set.weight} × {set.reps} @ {set.sets} set{set.sets === 1 ? '' : 's'}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="font-mono text-[var(--muted)]">No workout days logged yet.</p>
        )}
      </main>
    </>
  )
}
