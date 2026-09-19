import Link from 'next/link'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { serviceClient } from '@/lib/pocketbase/admin'
import { fetchClientHistory, parseWeightKg, ddMmYyyy } from '@/lib/google/sheets'
import { Nav } from '@/components/Nav'

export const metadata = { title: 'Leaderboard' }

type ClientRecord = { email: string; sheet_id: string }
type LiftEntry = {
  email: string
  exercise: string
  weightKg: number
  weightRaw: string
  date: string // ISO YYYY-MM-DD
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string }>
}) {
  const user = await getAuthUser()

  if (!user) {
    return (
      <>
        <Nav user={null} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono">
            Please{' '}
            <Link href="/login" className="font-bold hover:text-[var(--accent)]">log in</Link>{' '}
            to view the leaderboard.
          </p>
        </main>
      </>
    )
  }

  const params = await searchParams
  const selected = (params.exercise || '').trim()

  // Aggregate across every client sheet via the service client (a user token
  // cannot enumerate users or other coaches' clients). Fail-soft: service
  // errors degrade to an empty board, never a crash.
  let entries: LiftEntry[] = []
  let namesByEmail = new Map<string, string>()
  let aggregationFailed = false

  try {
    const admin = await serviceClient()
    const clients = await admin.collection('clients').getFullList<ClientRecord>({
      fields: 'email,sheet_id',
    })

    const perClient = await Promise.all(
      clients
        .filter((c) => c.sheet_id)
        .map(async (c) => {
          try {
            const rows = await fetchClientHistory(c.sheet_id, c.email)
            return rows
              .map((row) => {
                const kg = parseWeightKg(row.weight)
                return kg == null
                  ? null
                  : {
                      email: c.email,
                      exercise: row.exercise,
                      weightKg: kg,
                      weightRaw: row.weight,
                      date: row.date,
                    }
              })
              .filter((e): e is LiftEntry => e !== null)
          } catch {
            return [] // one unreadable sheet never sinks the board
          }
        }),
    )
    entries = perClient.flat()

    // Display names: users lookup by email (batched || filter), else local-part.
    const emails = [...new Set(entries.map((e) => e.email))]
    if (emails.length > 0) {
      try {
        const users = await admin.collection('users').getFullList({
          filter: emails.map((e) => `email = "${e}"`).join(' || '),
          fields: 'email,name',
        })
        namesByEmail = new Map(users.map((u) => [u.email, u.name]))
      } catch {
        namesByEmail = new Map()
      }
    }
  } catch {
    aggregationFailed = true
  }

  const exercises = [...new Set(entries.map((e) => e.exercise))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
  const filtered = selected
    ? entries.filter((e) => e.exercise.toLowerCase() === selected.toLowerCase())
    : entries
  const ranked = [...filtered]
    .sort((a, b) => b.weightKg - a.weightKg || b.date.localeCompare(a.date))
    .slice(0, 20)

  const displayName = (email: string) => {
    const name = namesByEmail.get(email)
    if (name) return name
    return email.split('@')[0] || email
  }

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Leaderboard</h1>
        <p className="font-mono text-sm text-[var(--muted)] mb-8">
          Biggest lifts across the crew.
        </p>

        <form method="get" className="mb-8 flex items-end gap-3 max-w-md">
          <div className="flex-1">
            <label htmlFor="exercise-filter" className="block font-mono text-xs uppercase text-[var(--muted)] mb-1">
              Exercise
            </label>
            <select
              id="exercise-filter"
              name="exercise"
              defaultValue={selected}
              className="w-full min-h-11 px-3 bg-[var(--background)] border-2 border-[var(--border)] font-mono text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <option value="">All</option>
              {exercises.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="min-h-11 px-5 border-2 border-[var(--border)] bg-[var(--accent)] text-[var(--accent-ink)] font-bold uppercase text-sm hover:bg-[var(--accent-strong)] active:scale-[0.98] transition-transform"
          >
            Filter
          </button>
        </form>

        {aggregationFailed ? (
          <p className="font-mono text-[var(--muted)]">
            The board is unavailable right now — the aggregation service is not responding. Try again later.
          </p>
        ) : ranked.length === 0 ? (
          <p className="font-mono text-[var(--muted)]">
            No lifts on the board yet — log a day with a weighted exercise.
          </p>
        ) : (
          <div className="overflow-x-auto border-2 border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left font-mono text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--border)] text-xs uppercase text-[var(--muted)]">
                  <th scope="col" className="px-4 py-3">#</th>
                  <th scope="col" className="px-4 py-3">Lifter</th>
                  <th scope="col" className="px-4 py-3">Exercise</th>
                  <th scope="col" className="px-4 py-3">Weight</th>
                  <th scope="col" className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((entry, i) => (
                  <tr
                    key={`${entry.email}-${entry.date}-${entry.exercise}-${entry.weightRaw}`}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-4 py-3 font-bold text-[var(--accent)]">{i + 1}</td>
                    <td className="px-4 py-3">{displayName(entry.email)}</td>
                    <td className="px-4 py-3">{entry.exercise}</td>
                    <td className="px-4 py-3">{entry.weightRaw}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{ddMmYyyy(entry.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
