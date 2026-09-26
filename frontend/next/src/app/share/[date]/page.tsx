import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { ShareCardClient } from '@/components/ShareCardClient'
import { normalizeEntries, setCountOf } from '@/lib/exercise'
import {
  computeShareStats,
  applyBucketSets,
  sessionTitleOf,
  formatCardDate,
} from '@/lib/share-stats'

type WorkoutDay = {
  id: string
  user: string
  date: string
  exercises: unknown
  notes: string | null
  sheet_row_start: number | null
  sheet_order: string[] | null
}

type ExerciseRecord = {
  id: string
  name: string
  body_part: string[]
}

export const metadata: Metadata = { title: 'Share day' }

/** Local-timezone ISO date for the day after `iso` (YYYY-MM-DD). */
function nextIsoDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1)
  dt.setDate(dt.getDate() + 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate(),
  ).padStart(2, '0')}`
}

export default async function ShareDayPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date: rawDate } = await params
  const date = rawDate.slice(0, 10)

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const pb = await serverClient()

  // Own day for the requested date (same range filter as today-client).
  const day = await pb
    .collection('workout_days')
    .getFirstListItem<WorkoutDay>(
      `user = "${user.id}" && date >= "${date} 00:00:00" && date < "${nextIsoDay(date)} 00:00:00"`,
    )
    .catch(() => null)

  if (!day) {
    return (
      <>
        <Nav user={user} />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          <h1 className="text-3xl uppercase">No workout logged</h1>
          <p className="font-mono text-sm text-[var(--muted)]">
            There&apos;s no workout logged for {date} — nothing to share yet.
          </p>
          <Link
            href="/days"
            className="mt-2 inline-block border-2 border-[var(--border)] px-4 py-2 font-mono text-sm font-bold uppercase no-underline transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
          >
            Back to days
          </Link>
        </main>
      </>
    )
  }

  const entries = normalizeEntries(day.exercises)

  // Sets per body_part tag: match entry names to the exercises collection
  // (lowercased trimmed name), then fan each entry's sets out across its tags.
  const tagSets: Record<string, number> = {}
  if (entries.length > 0) {
    const library = (await pb
      .collection('exercises')
      .getFullList<ExerciseRecord>({ fields: 'id,name,body_part' })
      .catch(() => [] as ExerciseRecord[])) as ExerciseRecord[]
    const tagsByName = new Map<string, string[]>()
    for (const ex of library) {
      if (Array.isArray(ex.body_part) && ex.name) {
        tagsByName.set(ex.name.trim().toLowerCase(), ex.body_part.map((t) => String(t).toLowerCase()))
      }
    }
    for (const entry of entries) {
      const sets = setCountOf(entry)
      const tags = tagsByName.get(entry.name.trim().toLowerCase())
      if (tags) {
        for (const tag of tags) tagSets[tag] = (tagSets[tag] ?? 0) + sets
      }
    }
  }

  const stats = applyBucketSets(computeShareStats(day.exercises), tagSets)
  const sessionTitle = sessionTitleOf(stats)
  const displayName = user.name.toUpperCase()

  const cardProps = {
    name: displayName,
    date: formatCardDate(date),
    sessionTitle,
    stats,
    entries,
  }

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 flex flex-col items-center px-4 py-10 w-full">
        <div className="mb-6 text-center">
          <h1 className="text-3xl uppercase">Share day</h1>
          <p className="mt-1 font-mono text-sm text-[var(--muted)]">
            {formatCardDate(date)} — export your progress card for social.
          </p>
        </div>
        <ShareCardClient fileBase={`trainwithgouli-${date}`} {...cardProps} />
      </main>
    </>
  )
}
