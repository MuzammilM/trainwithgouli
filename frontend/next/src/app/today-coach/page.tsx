import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { serviceClient } from '@/lib/pocketbase/admin'
import { Nav } from '@/components/Nav'
import { CoachDayConsole } from '@/components/CoachDayConsole'
import { normalizeEntries } from '@/lib/exercise'

type ClientRecord = { id: string; coach: string; email: string; sheet_id: string }
type TemplateRecord = { id: string; name: string; exercises: unknown }
type WorkoutDay = {
  id: string
  user: string
  date: string
  exercises: unknown
  notes: string | null
  sheet_row_start: number | null
  sheet_order: string[] | null
}

export const metadata = { title: 'Today — coach' }

export default async function TodayCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; date?: string }>
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'coach') redirect('/today-client')

  const params = await searchParams
  const pb = await serverClient()

  // Roster (user token, coach rule) + users record ids resolved by email
  // via the service client (a user token cannot enumerate other users).
  const clients = await pb.collection('clients').getFullList<ClientRecord>({
    filter: `coach = "${user.id}"`,
    sort: 'email',
  })
  const emails = [...new Set(clients.map((c) => c.email))]
  const idByEmail = new Map<string, string>()
  if (emails.length > 0) {
    try {
      const admin = await serviceClient()
      const users = await admin.collection('users').getFullList({
        filter: emails.map((e) => `email = "${e}"`).join(' || '),
        fields: 'id,email,name',
      })
      for (const u of users) idByEmail.set(u.email.toLowerCase(), u.id)
    } catch {
      // Service client unavailable — client selector still works, assignment
      // will report the resolution error clearly.
    }
  }

  const clientOptions = clients.map((c) => ({
    id: idByEmail.get(c.email.toLowerCase()) ?? '',
    email: c.email,
    name: idByEmail.get(c.email.toLowerCase()) ? c.email.split('@')[0] : c.email,
  }))

  const templates = (await pb
    .collection('workout_templates')
    .getFullList<TemplateRecord>({ sort: '-updated' })) as TemplateRecord[]

  const exerciseOptions = (await pb.collection('exercises').getFullList({
    sort: 'name',
    fields: 'id,name',
  })) as unknown as { id: string; name: string }[]

  // Selected pair → existing workout_day for that client+date (coach sees all).
  const selectedEmail = (params.client ?? '').trim().toLowerCase() || clientOptions[0]?.email || ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? '')
    ? params.date!
    : new Date().toISOString().split('T')[0]

  let existingDay: {
    id: string
    date: string
    exercises: ReturnType<typeof normalizeEntries>
    notes: string | null
    sheet_row_start: number | null
    sheet_order: string[] | null
  } | null = null
  const selectedUserId = idByEmail.get(selectedEmail)
  if (selectedEmail && selectedUserId) {
    const day = await pb
      .collection('workout_days')
      .getFirstListItem<WorkoutDay>(`user = "${selectedUserId}" && date = "${date}"`)
      .catch(() => null)
    if (day) {
      existingDay = {
        id: day.id,
        date: day.date,
        exercises: normalizeEntries(day.exercises),
        notes: day.notes,
        sheet_row_start: day.sheet_row_start,
        sheet_order: day.sheet_order,
      }
    }
  }

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Today</h1>
        <p className="font-mono text-sm text-[var(--muted)] mb-8">
          Build and assign workouts — they land on your client&apos;s Today.
        </p>

        {clientOptions.length === 0 ? (
          <p className="font-mono text-[var(--muted)]">
            No clients yet — add one on the{' '}
            <Link href="/clients" className="font-bold hover:text-[var(--accent)] underline underline-offset-2">
              Clients
            </Link>{' '}
            page first.
          </p>
        ) : (
          <CoachDayConsole
            key={`${selectedEmail}-${date}`}
            clients={clientOptions}
            templates={templates.map((t) => ({
              id: t.id,
              name: t.name,
              entries: normalizeEntries(t.exercises),
            }))}
            exerciseOptions={exerciseOptions}
            selectedEmail={selectedEmail}
            date={date}
            existingDay={existingDay}
          />
        )}
      </main>
    </>
  )
}
