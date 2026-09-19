import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { deleteTemplate } from '@/lib/actions/templates'
import { normalizeEntries } from '@/lib/exercise'

type TemplateRecord = {
  id: string
  name: string
  exercises: unknown
  created_by: string
  updated: string
}

export const metadata = { title: 'Plan' }

export default async function PlanPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const pb = await serverClient()
  const templates = await pb.collection('workout_templates').getFullList<TemplateRecord>({
    sort: '-updated',
  })
  const isCoach = user.role === 'coach'

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Plan</h1>
          {isCoach && (
            <Link
              href="/plan/new"
              className="px-4 py-2 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-sm no-underline hover:bg-[var(--accent)]"
            >
              New template
            </Link>
          )}
        </div>
        <p className="font-mono text-sm text-[var(--muted)] mb-8">
          Reusable workout templates — build once, assign to any client.
        </p>

        {!isCoach && (
          <p className="font-mono text-sm text-[var(--muted)] mb-6">
            Your coach builds plans here.
          </p>
        )}

        {templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((t) => {
              const entries = normalizeEntries(t.exercises)
              return (
                <article
                  key={t.id}
                  className="border-2 border-[var(--border)] bg-[var(--surface)] p-4 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-48">
                    <h2 className="text-xl font-black uppercase">{t.name}</h2>
                    <p className="font-mono text-xs text-[var(--muted)]">
                      {entries.length} exercise{entries.length === 1 ? '' : 's'} · updated{' '}
                      {t.updated.slice(0, 10)}
                    </p>
                  </div>
                  {isCoach && (
                    <div className="flex gap-2">
                      <Link
                        href={`/plan/${t.id}/edit`}
                        className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase no-underline hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                      >
                        Edit
                      </Link>
                      <form action={deleteTemplate.bind(null, t.id)}>
                        <button
                          type="submit"
                          className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="font-mono text-[var(--muted)]">
            No templates yet.{isCoach ? ' Create the first one.' : ''}
          </p>
        )}
      </main>
    </>
  )
}
