import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { Nav } from '@/components/Nav'
import { TemplateForm } from '@/components/TemplateForm'
import { normalizeEntries } from '@/lib/exercise'

export const metadata = { title: 'Edit template' }

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'coach') redirect('/plan')

  const { id } = await params
  const pb = await serverClient()
  const template = await pb
    .collection('workout_templates')
    .getOne<{ id: string; name: string; exercises: unknown }>(id)
    .catch(() => null)

  if (!template) {
    return (
      <>
        <Nav user={user} />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <p className="font-mono text-[var(--muted)]">Template not found.</p>
        </main>
      </>
    )
  }

  const exercises = (await pb.collection('exercises').getFullList({
    sort: 'name',
    fields: 'id,name',
  })) as unknown as { id: string; name: string }[]

  return (
    <>
      <Nav user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/plan" className="font-mono text-sm hover:text-[var(--accent)]">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Edit template</h1>
        </div>
        <TemplateForm
          exercises={exercises}
          templateId={template.id}
          initialName={template.name}
          initialEntries={normalizeEntries(template.exercises)}
        />
      </main>
    </>
  )
}
