import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'
import { DaySetBuilder } from '@/components/DaySetBuilder'
import { updateDay, deleteDay } from '@/lib/actions/days'

export default async function DayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <>
        <Nav user={null} isAdmin={false} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono">Please <Link href="/login" className="font-bold hover:text-[var(--accent)]">log in</Link>.</p>
        </main>
      </>
    )
  }

  const [{ data: profile }, { data: day }] = await Promise.all([
    supabase.from('profiles').select('role, display_name').eq('id', user.id).single(),
    supabase
      .from('workout_days')
      .select('*, profiles(display_name), workout_sets(*, exercises(name))')
      .eq('id', id)
      .single(),
  ])

  if (!day) notFound()

  const isAdmin = profile?.role === 'admin'
  const isOwner = day.user_id === user.id
  const canEdit = isAdmin || isOwner

  const { data: exercises } = await supabase.from('exercises').select('id, name').order('name')

  const initialRows =
    day.workout_sets?.map((set: any) => ({
      exercise_id: set.exercise_id,
      weight: set.weight,
      reps: set.reps,
      sets: set.sets,
      notes: set.notes,
    })) || []

  const update = updateDay.bind(null, id)

  return (
    <>
      <Nav user={{ id: user.id, email: user.email, display_name: profile?.display_name }} isAdmin={isAdmin} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/days" className="font-mono text-sm hover:text-[var(--accent)]">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">{day.date}</h1>
        </div>

        {!canEdit && (
          <div className="mb-6 border-2 border-[var(--border)] p-4 bg-[var(--surface)]">
            <p className="font-mono text-sm">Logged by {day.profiles?.display_name || 'Unknown'}. Read-only.</p>
            {day.notes && <p className="font-mono mt-2">{day.notes}</p>}
            {day.workout_sets && day.workout_sets.length > 0 && (
              <ul className="font-mono text-sm mt-2 space-y-1">
                {day.workout_sets.map((set: any) => (
                  <li key={set.id}>
                    {set.exercises?.name}: {set.weight} × {set.reps} @ {set.sets} set{set.sets === 1 ? '' : 's'}
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
                className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm no-underline hover:bg-[var(--accent)] hover:text-white"
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
              className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm hover:bg-[var(--accent)] hover:text-white"
            >
              Delete day
            </button>
          </form>
        )}
      </main>
    </>
  )
}
