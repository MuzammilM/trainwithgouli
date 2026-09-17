import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { DaySetBuilder } from '@/components/DaySetBuilder'
import { updateDay, deleteDay } from '@/lib/actions/days'

type WorkoutSet = {
  id: string
  exercise_id: string
  weight: number
  reps: number
  sets: number
  notes: string | null
  expand?: { exercise?: { name: string } }
}

export default async function DayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()

  if (!user) {
    return (
      <>
        <Nav user={null} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono">Please <Link href="/login" className="font-bold hover:text-[var(--accent)]">log in</Link>.</p>
        </main>
      </>
    )
  }

  const pb = await serverClient()
  const day = await pb.collection('workout_days').getOne(id).catch(() => null)

  if (!day) notFound()

  const [daySets, exercises, owner] = await Promise.all([
    pb.collection('workout_sets').getFullList<WorkoutSet>({
      filter: `workout_day_id = "${id}"`,
      expand: 'exercise',
    }),
    pb.collection('exercises').getFullList({ sort: 'name', fields: 'id,name' }) as unknown as { id: string; name: string }[],
    pb.collection('users').getOne(day.user_id, { fields: 'id,name,email' }).catch(() => null),
  ])

  const isAdmin = user.role === 'coach'
  const isOwner = day.user_id === user.id
  const canEdit = isAdmin || isOwner

  const ownerName = owner ? (owner.name || owner.email) : 'Unknown'

  const initialRows = daySets.map((set) => ({
    exercise_id: set.exercise_id,
    weight: set.weight,
    reps: set.reps,
    sets: set.sets,
    notes: set.notes,
  }))

  const update = updateDay.bind(null, id)

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/days" className="font-mono text-sm hover:text-[var(--accent)]">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">{day.date}</h1>
        </div>

        {!canEdit && (
          <div className="mb-6 border-2 border-[var(--border)] p-4 bg-[var(--surface)]">
            <p className="font-mono text-sm">Logged by {ownerName}. Read-only.</p>
            {day.notes && <p className="font-mono mt-2">{day.notes}</p>}
            {daySets.length > 0 && (
              <ul className="font-mono text-sm mt-2 space-y-1">
                {daySets.map((set) => (
                  <li key={set.id}>
                    {set.expand?.exercise?.name}: {set.weight} × {set.reps} @ {set.sets} set{set.sets === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {canEdit && (
          <form action={update} className="space-y-6 border-2 border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-bold uppercase mb-1">Date *</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={day.date}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-bold uppercase mb-1">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={day.notes || ''}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase mb-2">Sets</p>
              {exercises && exercises.length > 0 ? (
                <DaySetBuilder exercises={exercises} initialRows={initialRows} />
              ) : (
                <p className="font-mono text-[var(--muted)]">No exercises available.</p>
              )}
            </div>

            <div className="flex gap-4">
              <Link
                href="/days"
                className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm no-underline hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-sm hover:bg-[var(--accent)]"
              >
                Save
              </button>
            </div>
          </form>
        )}
        {canEdit && (
          <form action={deleteDay.bind(null, id)} className="mt-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
            >
              Delete day
            </button>
          </form>
        )}
      </main>
    </>
  )
}
