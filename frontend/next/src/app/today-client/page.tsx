import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { TodayChecklist } from '@/components/TodayChecklist'
import { normalizeEntries } from '@/lib/exercise'

type WorkoutDay = {
  id: string
  user: string
  date: string
  exercises: unknown
  notes: string | null
  sheet_row_start: number | null
  sheet_order: string[] | null
}

export const metadata = { title: 'Today — client' }

/** Local-timezone ISO date (YYYY-MM-DD), not UTC-shifted. */
function localIsoToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

export default async function TodayClientPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const pb = await serverClient()
  const today = localIsoToday()

  // Own day for today (user token; rule self||coach — filter user=me).
  const day = await pb
    .collection('workout_days')
    .getFirstListItem<WorkoutDay>(`user = "${user.id}" && date = "${today}"`)
    .catch(() => null)

  const isCoach = user.role === 'coach'

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Today</h1>
        <p className="font-mono text-sm text-[var(--muted)] mb-8">
          Today&apos;s assigned workout — check off exercises as you go.
        </p>

        {day ? (
          <TodayChecklist
            dayId={day.id}
            initialEntries={normalizeEntries(day.exercises)}
            sheetRowStart={day.sheet_row_start}
            sheetOrder={day.sheet_order}
          />
        ) : (
          <div className="space-y-3">
            <p className="font-mono text-[var(--muted)]">No workout assigned today.</p>
            {isCoach && (
              <Link
                href="/today-coach"
                className="inline-block px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm no-underline hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                Open the coach console
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  )
}
