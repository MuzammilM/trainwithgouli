import Link from 'next/link'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { deletePlan } from '@/lib/actions/plans'

type PlanExercise = {
  id: string
  plan_id: string
  exercise_id: string
  order_index: number
  sets: number | null
  reps: number | null
  rest_seconds: number | null
  expand?: { exercise?: { name: string } }
}

export default async function PlansPage() {
  const user = await getAuthUser()

  if (!user) {
    return (
      <>
        <Nav user={null} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono">
            Please{' '}
            <Link href="/login" className="font-bold hover:text-[var(--accent)]">log in</Link>{' '}
            to view plans.
          </p>
        </main>
      </>
    )
  }

  const pb = await serverClient()
  const [plans, planExercises] = await Promise.all([
    pb.collection('workout_plans').getFullList({ sort: '-created' }),
    pb.collection('plan_exercises').getFullList<PlanExercise>({
      sort: 'order_index',
      expand: 'exercise',
    }),
  ])

  const byPlan = new Map<string, PlanExercise[]>()
  for (const pe of planExercises) {
    const list = byPlan.get(pe.plan_id) || []
    list.push(pe)
    byPlan.set(pe.plan_id, list)
  }

  const isAdmin = user.role === 'coach'

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Plans</h1>
          <Link
            href="/plans/new"
            className="px-4 py-2 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-sm no-underline hover:bg-[var(--accent)]"
          >
            New plan
          </Link>
        </div>

        {plans && plans.length > 0 ? (
          <div className="space-y-6">
            {plans.map((plan) => {
              const pes = byPlan.get(plan.id) || []
              return (
                <article key={plan.id} className="border-2 border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-black uppercase">{plan.name}</h2>
                      {plan.is_public && <span className="inline-block mt-1 px-2 py-0.5 border border-[var(--border)] text-xs font-bold uppercase">Public</span>}
                    </div>
                    {(isAdmin || plan.created_by === user.id) && (
                      <div className="flex gap-2">
                        <Link
                          href={`/plans/${plan.id}/edit`}
                          className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase no-underline hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                        >
                          Edit
                        </Link>
                        <form action={deletePlan.bind(null, String(plan.id))}>
                          <button
                            type="submit"
                            className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                  {pes.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-1 font-mono">
                      {pes.map((pe) => (
                        <li key={pe.id}>
                          {pe.expand?.exercise?.name}
                          {pe.sets && ` — ${pe.sets} sets`}
                          {pe.reps && ` × ${pe.reps} reps`}
                          {pe.rest_seconds && ` / ${pe.rest_seconds}s rest`}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="font-mono text-[var(--muted)]">No exercises in this plan.</p>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="font-mono text-[var(--muted)]">No plans yet. Create the first one.</p>
        )}
      </main>
    </>
  )
}
