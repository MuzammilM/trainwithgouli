import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'
import { updateExercise } from '@/lib/actions/exercises'

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <>
        <Nav user={null} isAdmin={false} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono">Please <Link href="/login" className="font-bold hover:text-[var(--accent)]">log in</Link>.</p>
        </main>
      </>
    )
  }

  const [{ data: profile }, { data: exercise }] = await Promise.all([
    supabase.from('profiles').select('role, display_name').eq('id', user.id).single(),
    supabase.from('exercises').select('*').eq('id', id).single(),
  ])

  if (!exercise) notFound()

  const isAdmin = profile?.role === 'admin'
  const canEdit = isAdmin || exercise.created_by === user.id
  if (!canEdit) {
    return (
      <>
        <Nav user={{ id: user.id, email: user.email, display_name: profile?.display_name }} isAdmin={isAdmin} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono text-[var(--accent)]">You do not have permission to edit this exercise.</p>
        </main>
      </>
    )
  }

  const update = updateExercise.bind(null, id)

  return (
    <>
      <Nav user={{ id: user.id, email: user.email, display_name: profile?.display_name }} isAdmin={isAdmin} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/exercises" className="font-mono text-sm hover:text-[var(--accent)]">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Edit exercise</h1>
        </div>
        <form action={update} className="space-y-6 border-2 border-[var(--border)] bg-[var(--surface)] p-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold uppercase mb-1">Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={exercise.name}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-bold uppercase mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={exercise.description || ''}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>
          <div>
            <label htmlFor="youtube_url" className="block text-sm font-bold uppercase mb-1">YouTube URL</label>
            <input
              id="youtube_url"
              name="youtube_url"
              type="url"
              defaultValue={exercise.youtube_url || ''}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>
          <div className="flex gap-4">
            <Link
              href="/exercises"
              className="px-4 py-2 border-2 border-[var(--border)] font-bold uppercase text-sm no-underline hover:bg-[var(--accent)] hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-sm hover:bg-[var(--accent)]"
            >
              Save
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
