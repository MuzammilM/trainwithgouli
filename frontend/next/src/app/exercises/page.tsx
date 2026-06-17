import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { deleteExercise } from '@/lib/actions/exercises'

export default async function ExercisesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <>
        <Nav user={null} isAdmin={false} />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <p className="font-mono">
            Please{' '}
            <Link href="/login" className="font-bold hover:text-[var(--accent)]">log in</Link>{' '}
            to view exercises.
          </p>
        </main>
      </>
    )
  }

  const [{ data: profile }, { data: exercises }] = await Promise.all([
    supabase.from('profiles').select('role, display_name').eq('id', user.id).single(),
    supabase.from('exercises').select('*').order('name', { ascending: true }),
  ])

  const isAdmin = profile?.role === 'admin'

  return (
    <>
      <Nav
        user={{ id: user.id, email: user.email, display_name: profile?.display_name }}
        isAdmin={isAdmin}
      />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Exercises</h1>
          <Link
            href="/exercises/new"
            className="px-4 py-2 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-sm no-underline hover:bg-[var(--accent)]"
          >
            Add exercise
          </Link>
        </div>

        {exercises && exercises.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {exercises.map((exercise) => (
              <article key={exercise.id} className="border-2 border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-xl font-black uppercase">{exercise.name}</h2>
                  {(isAdmin || exercise.created_by === user.id) && (
                    <div className="flex gap-2">
                      <Link
                        href={`/exercises/${exercise.id}/edit`}
                        className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase no-underline hover:bg-[var(--accent)] hover:text-white"
                      >
                        Edit
                      </Link>
                      <form action={deleteExercise.bind(null, String(exercise.id))}>
                        <button
                          type="submit"
                          className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-white"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </div>
                {exercise.description && (
                  <p className="font-mono text-sm text-[var(--muted)] mb-3">{exercise.description}</p>
                )}
                {exercise.youtube_url && <YouTubeEmbed url={exercise.youtube_url} />}
              </article>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[var(--muted)]">No exercises yet. Add the first one.</p>
        )}
      </main>
    </>
  )
}
