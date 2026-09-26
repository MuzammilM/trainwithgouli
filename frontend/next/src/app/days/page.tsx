import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Share2 } from 'lucide-react'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { normalizeEntries } from '@/lib/exercise'

type WorkoutDay = {
  id: string
  user: string
  date: string
  exercises: unknown
  notes: string | null
  expand?: { user?: { name?: string; email?: string } }
}

export const metadata = { title: 'Days' }

function formatDay(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  if (!y || !m || !d) return iso.slice(0, 10)
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  return dt.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function DaysPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const pb = await serverClient()
  const isCoach = user.role === 'coach'

  // Client: own days only (user token + rule self||coach). Coach: all days.
  const days = (await pb.collection('workout_days').getFullList<WorkoutDay>({
    sort: '-date,-created',
    ...(isCoach ? { expand: 'user' } : { filter: `user = "${user.id}"` }),
  })) as WorkoutDay[]

  // Coach display names via expand; fail-soft to 'Athlete'.
  const nameOf = (day: WorkoutDay): string => {
    if (!isCoach) return 'You'
    const u = day.expand?.user
    return u?.name || u?.email || 'Athlete'
  }

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Days</h1>
        <p className="font-mono text-sm text-[var(--muted)] mb-8">
          Workout history — every day you&apos;ve trained.
        </p>

        {days.length > 0 ? (
          <div className="space-y-3">
            {days.map((day) => {
              const entries = normalizeEntries(day.exercises)
              const done = entries.filter((e) => e.done).length
              const preview = entries.slice(0, 4)
              return (
                <article
                  key={day.id}
                  className="border-2 border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-x-3">
                    <h2 className="text-xl font-black uppercase">{formatDay(day.date)}</h2>
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {isCoach ? `${nameOf(day)} · ` : ''}
                      {done}/{entries.length} done
                    </span>
                    <Link
                      href={`/share/${day.date.slice(0, 10)}`}
                      aria-label={`Share ${formatDay(day.date)} card`}
                      title="Share this day"
                      className="ml-auto inline-flex items-center justify-center border-2 border-[var(--border)] p-1.5 text-[var(--muted)] no-underline transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      <Share2 size={16} aria-hidden="true" />
                    </Link>
                  </div>
                  {entries.length > 0 && (
                    <ul className="mt-2 font-mono text-sm text-[var(--muted)] space-y-0.5">
                      {preview.map((e, i) => (
                        <li
                          key={i}
                          className={e.done ? 'line-through opacity-60' : ''}
                        >
                          {e.name}
                        </li>
                      ))}
                      {entries.length > 4 && (
                        <li className="opacity-60">+{entries.length - 4} more</li>
                      )}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="font-mono text-[var(--muted)]">No workout days yet.</p>
        )}
      </main>
    </>
  )
}
