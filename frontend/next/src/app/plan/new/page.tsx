import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { TemplateForm } from '@/components/TemplateForm'

export const metadata = { title: 'New template' }

export default async function NewTemplatePage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'coach') redirect('/plan')

  const pb = await serverClient()
  const exercises = (await pb.collection('exercises').getFullList({
    sort: 'name',
    fields: 'id,name,body_part',
  })) as unknown as { id: string; name: string; body_part?: string[] | null }[]

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/plan" className="font-mono text-sm hover:text-[var(--accent)]">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">New template</h1>
        </div>
        <TemplateForm exercises={exercises} />
      </main>
    </>
  )
}
