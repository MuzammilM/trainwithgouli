import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { ProfileForm } from '@/components/ProfileForm'

export const metadata = { title: 'Profile' }

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const params = await searchParams

  // Prefill from the live record (self-read is allowed by the users view rule).
  const pb = await serverClient()
  const record = await pb.collection('users').getOne(user.id)
  const name = String(record.name ?? '')
  const mobile = String(record.mobile ?? '')
  const alias = String(record.alias ?? '')
  // PocketBase API-created selects may lose their default — treat missing or
  // empty board_display as "alias".
  const boardDisplay = String(record.board_display ?? '') === 'name' ? 'name' : 'alias'

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Profile</h1>
        <p className="font-mono text-sm text-[var(--muted)] mb-8">
          Your account details. · {user.email}
        </p>

        {params.saved === '1' ? (
          <p role="status" className="mb-6 max-w-xl border-2 border-[var(--border)] px-3 py-2.5 font-mono text-sm">
            Profile saved.
          </p>
        ) : null}

        <ProfileForm name={name} mobile={mobile} alias={alias} boardDisplay={boardDisplay} />
      </main>
    </>
  )
}
