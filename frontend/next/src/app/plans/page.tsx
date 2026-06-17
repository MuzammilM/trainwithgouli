import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'
import { deletePlan } from '@/lib/actions/plans'

export default async function PlansPage() {
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
            to view plans.
          </p>
        </main>
      </>
    )
  }

  const [{ data: profile }, { data: plans }] = await Promise.all([
    supabase.from('profiles').select('role, display_name').eq('id', user.id).single(),
    supabase
      .from('workout_plans')
      .select('*, plan_exercises(*, exercises(name))')
      .order('created_at', { ascending: false }),
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
            {plans.map((plan) => (
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
                        className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase no-underline hover:bg-[var(--accent)] hover:text-white"
                      >
                        Edit
                      </Link>
                      <form action={deletePlan.bind(null, String(plan.id))}>
                        <button
                          type="submit"
                          className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-white"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </div>
                {plan.plan_exercises && plan.plan_exercises.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1 font-mono">
                    {plan.plan_exercises
                      .sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((pe: any) => (
                        <li key={pe.id}>
                          {pe.exercises?.name}
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
            ))}
          </div>
        ) : (
          <p className="font-mono text-[var(--muted)]">No plans yet. Create the first one.</p>
        )}
      </main>
    </>
  )
}
