import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'
import { PlanExerciseBuilder } from '@/components/PlanExerciseBuilder'
import { updatePlan } from '@/lib/actions/plans'

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [{ data: profile }, { data: plan }, { data: exercises }] = await Promise.all([
    supabase.from('profiles').select('role, display_name').eq('id', user.id).single(),
    supabase.from('workout_plans').select('*, plan_exercises(*)').eq('id', id).single(),
    supabase.from('exercises').select('id, name').order('name'),
  ])

  if (!plan) notFound()

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && plan.created_by !== user.id) {
    return (
      <>
        <Nav user={{ id: user.id, email: user.email, display_name: profile?.display_name }} isAdmin={isAdmin} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono text-[var(--accent)]">You do not have permission to edit this plan.</p>
        </main>
      </>
    )
  }

  const initialRows =
    plan.plan_exercises
      ?.sort((a: any, b: any) => a.order_index - b.order_index)
      .map((pe: any) => ({
        exercise_id: pe.exercise_id,
        sets: pe.sets ?? undefined,
        reps: pe.reps ?? undefined,
        rest_seconds: pe.rest_seconds ?? undefined,
      })) || []

  const update = updatePlan.bind(null, id)

  return (
    <>
      <Nav user={{ id: user.id, email: user.email, display_name: profile?.display_name }} isAdmin={isAdmin} />
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
      </main>
    </>
  )
}
