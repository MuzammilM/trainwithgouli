import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { TodayChecklist } from '@/components/TodayChecklist'
import { normalizeEntries, nameMultisetsEqual } from '@/lib/exercise'
import { fetchClientHistory } from '@/lib/google/sheets'

type WorkoutDay = {
  id: string
  user: string
  date: string
  exercises: unknown
  notes: string | null
  sheet_row_start: number | null
  sheet_order: string[] | null
}

type ClientRecord = {
  id: string
  coach: string
  email: string
  sheet_id: string
}

export const metadata = { title: 'Today — client' }

/** Local-timezone ISO date (YYYY-MM-DD), not UTC-shifted. */
function localIsoToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

/** Local-timezone ISO date for the day after `iso` (YYYY-MM-DD). */
function nextIsoDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1)
  dt.setDate(dt.getDate() + 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate(),
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
    .getFirstListItem<WorkoutDay>(
      `user = "${user.id}" && date >= "${today} 00:00:00" && date < "${nextIsoDay(today)} 00:00:00"`,
    )
    .catch(() => null)

  // Sheet-vs-DB drift detection: the coach may have edited today's block
  // directly in the Google Sheet. One cached fetchClientHistory call per page
  // load (cache shared with other pages); any failure skips silently.
  let sheetMismatch = false
  let sheetCount = 0
  let dbCount = 0
  if (day) {
    const dbEntries = normalizeEntries(day.exercises)
    dbCount = dbEntries.length
    try {
      const client = await pb
        .collection('clients')
        .getFirstListItem<ClientRecord>(`email = "${user.email.trim().toLowerCase()}"`)
        .catch(() => null)
      if (client?.sheet_id) {
        const history = await fetchClientHistory(client.sheet_id, client.email)
        const todayRows = history.filter((r) => r.date === today)
        sheetCount = todayRows.length
        sheetMismatch = !nameMultisetsEqual(
          todayRows.map((r) => r.exercise),
          dbEntries.map((e) => e.name),
        )
      }
    } catch {
      // Fail-soft: no banner on sheet read failure.
    }
  }

  const isCoach = user.role === 'coach'

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Today</h1>
            <p className="font-mono text-sm text-[var(--muted)] mb-8">
              Today&apos;s assigned workout — check off exercises as you go.
            </p>
          </div>
          {day && (
            <Link
              href={`/share/${today}`}
              className="mt-1 inline-block shrink-0 border-2 border-[var(--border)] px-4 py-2 font-mono text-sm font-bold uppercase no-underline transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
            >
              Share day
            </Link>
          )}
        </div>

        {day ? (
          <TodayChecklist
            dayId={day.id}
            initialEntries={normalizeEntries(day.exercises)}
            sheetRowStart={day.sheet_row_start}
            sheetOrder={day.sheet_order}
            sheetMismatch={sheetMismatch}
            sheetCount={sheetCount}
            dbCount={dbCount}
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
