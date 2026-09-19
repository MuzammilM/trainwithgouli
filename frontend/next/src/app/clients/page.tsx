import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { serviceClient } from '@/lib/pocketbase/admin'
import { Nav } from '@/components/Nav'
import { AddClientForm } from '@/components/AddClientForm'
import { removeClient } from '@/lib/actions/clients'
import { ImportHistoryButton } from '@/components/ImportHistoryButton'

type ClientRecord = {
  id: string
  coach: string
  email: string
  sheet_url: string
  sheet_id: string
  sheet_verified: boolean
  verified_at: string
  created: string
}

export const metadata = { title: 'Clients' }

export default async function ClientsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'coach') redirect('/')

  const pb = await serverClient()
  const clients = await pb.collection('clients').getFullList<ClientRecord>({
    filter: `coach = "${user.id}"`,
    sort: '-created',
  })

  // Resolve display names + mobile via the service client (a user token can
  // no longer enumerate other users). Batched with one || filter; fail-soft.
  const emails = [...new Set(clients.map((c) => c.email))]
  const userByEmail = new Map<string, { name?: string; mobile?: string }>()
  if (emails.length > 0) {
    try {
      const admin = await serviceClient()
      const users = await admin.collection('users').getFullList({
        filter: emails.map((e) => `email = "${e}"`).join(' || '),
        fields: 'email,name,mobile',
      })
      for (const u of users) {
        userByEmail.set(u.email, { name: u.name, mobile: u.mobile })
      }
    } catch {
      // Service client unavailable — fall back to email-only display.
    }
  }

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Clients</h1>
        <p className="font-mono text-sm text-[var(--muted)] mb-8">
          Coach-managed clients and their Google Sheets.
        </p>

        <AddClientForm />

        {clients && clients.length > 0 ? (
          <div className="space-y-3">
            {clients.map((client) => {
              const u = userByEmail.get(client.email)
              const detail = [u?.name, u?.mobile].filter(Boolean).join(' · ')
              return (
                <article
                  key={client.id}
                  className="border-2 border-[var(--border)] bg-[var(--surface)] p-4 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-48">
                    <span className="font-mono text-sm block">{client.email}</span>
                    {detail ? (
                      <span className="font-mono text-xs text-[var(--muted)]">{detail}</span>
                    ) : null}
                  </div>
                <a
                  href={client.sheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[var(--muted)] hover:text-[var(--accent)] underline underline-offset-2"
                >
                  Sheet ↗
                </a>
                {client.sheet_verified ? (
                  <span className="px-2 py-0.5 border-2 border-[var(--accent)] text-[var(--accent)] text-xs font-bold uppercase">
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 border border-[var(--border)] text-[var(--muted)] text-xs font-bold uppercase">
                    Pending
                  </span>
                )}
                <ImportHistoryButton clientId={client.id} />
                <form action={removeClient.bind(null, client.id)}>
                  <button
                    type="submit"
                    className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                  >
                    Remove
                  </button>
                  </form>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="font-mono text-[var(--muted)]">
            No clients yet. Add one above — the sheet must be shared with the coach service account first.
          </p>
        )}
      </main>
    </>
  )
}
