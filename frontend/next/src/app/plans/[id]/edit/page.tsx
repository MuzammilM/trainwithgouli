import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { PlanExerciseBuilder } from '@/components/PlanExerciseBuilder'
import { updatePlan } from '@/lib/actions/plans'

type PlanExercise = {
  id: string
  exercise_id: string
  order_index: number
  sets: number | null
  reps: number | null
  rest_seconds: number | null
}

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [plan, pes, exercises] = await Promise.all([
    pb.collection('workout_plans').getOne(id).catch(() => null),
    pb.collection('plan_exercises').getFullList<PlanExercise>({
      filter: `plan_id = "${id}"`,
      sort: 'order_index',
    }),
    pb.collection('exercises').getFullList({ sort: 'name', fields: 'id,name' }) as unknown as { id: string; name: string }[],
  ])

  if (!plan) notFound()

  const isAdmin = user.role === 'coach'
  if (!isAdmin && plan.created_by !== user.id) {
    return (
      <>
        <Nav user={user} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono text-[var(--accent)]">You do not have permission to edit this plan.</p>
        </main>
      </>
    )
  }

  const initialRows = pes.map((pe) => ({
    exercise_id: pe.exercise_id,
    sets: pe.sets ?? undefined,
    reps: pe.reps ?? undefined,
    rest_seconds: pe.rest_seconds ?? undefined,
  }))

  const update = updatePlan.bind(null, id)

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/plans" className="font-mono text-sm hover:text-[var(--accent)]">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Edit plan</h1>
        </div>
        <form action={update} className="space-y-6 border-2 border-[var(--border)] bg-[var(--surface)] p-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold uppercase mb-1">Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={plan.name}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_public"
              name="is_public"
              type="checkbox"
              defaultChecked={plan.is_public}
              className="w-5 h-5 border-2 border-[var(--border)]"
            />
            <label htmlFor="is_public" className="text-sm font-bold uppercase">Public</label>
          </div>
          <div>
            <p className="text-sm font-bold uppercase mb-2">Exercises</p>
            {exercises && exercises.length > 0 ? (
              <PlanExerciseBuilder exercises={exercises} initialRows={initialRows} />
            ) : (
              <p className="font-mono text-[var(--muted)]">No exercises available.</p>
            )}
          </div>
          <div className="flex gap-4">
            <Link
              href="/plans"
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
      </main>
    </>
  )
}
