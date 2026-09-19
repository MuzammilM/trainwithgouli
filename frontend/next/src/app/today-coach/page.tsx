import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { DayBuilder } from '@/components/DayBuilder'
import { DayBuilderForm } from '@/components/DayBuilderForm'
import { fetchClientHistory } from '@/lib/google/sheets'

type ClientRecord = {
  id: string
  coach: string
  email: string
  sheet_id: string
}

export const metadata = { title: 'Today — Coach' }

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; saved?: string }>
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'coach') redirect('/today-client')

  const params = await searchParams
  const pb = await serverClient()

  let clients: ClientRecord[] = []
  let selectedEmail: string | null = null

  if (user.role === 'coach') {
    clients = await pb.collection('clients').getFullList<ClientRecord>({
      filter: `coach = "${user.id}"`,
      sort: 'email',
    })
    const requested = (params.client ?? '').trim().toLowerCase()
    if (requested && clients.some((c) => c.email.toLowerCase() === requested)) {
      selectedEmail = clients.find((c) => c.email.toLowerCase() === requested)!.email
    } else if (clients.length > 0) {
      selectedEmail = clients[0].email
    }
  } else {
    const own = await pb
      .collection('clients')
      .getFirstListItem<ClientRecord>(`email = "${user.email.trim().toLowerCase()}"`)
      .catch(() => null)
    if (own) {
      clients = [own]
      selectedEmail = own.email
    }
  }

  const selected = clients.find((c) => c.email === selectedEmail) ?? null

  let history: Awaited<ReturnType<typeof fetchClientHistory>> = []
  let historyError = false
  if (selected?.sheet_id) {
    try {
      history = await fetchClientHistory(selected.sheet_id, selected.email)
    } catch {
      historyError = true
    }
  }

  const exercises = (await pb.collection('exercises').getFullList({
    sort: 'name',
    fields: 'id,name,body_part,youtube_url',
  })) as unknown as { id: string; name: string; body_part?: string[] | null; youtube_url?: string | null }[]

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Today</h1>
        <p className="text-[var(--muted)] font-mono text-sm mt-1 mb-8">Build a workout and write the day block to your client's Google Sheet.</p>

        {params.saved === '1' && (
          <p
            role="status"
            className="mb-6 border-2 border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-3 py-2.5 font-mono text-sm"
          >
            Day saved to the sheet.
          </p>
        )}

        {user.role === 'coach' ? (
          clients.length > 0 ? (
            <form method="get" className="mb-6 flex flex-wrap md:items-end gap-2">
              <label htmlFor="client" className="block text-sm font-bold uppercase mb-1">
                Client
              </label>
              <select
                id="client"
                name="client"
                defaultValue={selectedEmail ?? ''}
                className="w-full md:w-80 px-3 py-2 border-2 border-[var(--border)] bg-[var(--surface)] font-mono text-sm md:mb-0"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.email}>
                    {c.email}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-2 border-2 border-[var(--border)] font-bold uppercase text-xs hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                Load
              </button>
            </form>
          ) : (
            <p className="font-mono text-[var(--muted)] mb-6">
              No clients yet — add one on the{' '}
              <Link href="/clients" className="font-bold hover:text-[var(--accent)]">
                Clients
              </Link>{' '}
              page first.
            </p>
          )
        ) : null}

        {selected ? (
          selected.sheet_id ? (
            <DayBuilderForm
              clientEmail={selected.email}
              dateDefault={today}
              exercises={exercises}
              history={history}
              historyError={historyError}
            />
          ) : (
            <p className="font-mono text-[var(--muted)]">
              This client has no Google Sheet linked yet.
            </p>
          )
        ) : user.role === 'coach' ? null : (
          <p className="font-mono text-[var(--muted)]">
            No client record found for your account — ask your coach to add you.
          </p>
        )}
      </main>
    </>
  )
}
