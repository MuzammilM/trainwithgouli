import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Nav } from '@/components/Nav'
import { DaySetBuilder } from '@/components/DaySetBuilder'
import { createDay } from '@/lib/actions/days'

export default async function NewDayPage() {
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

  const [{ data: profile }, { data: exercises }] = await Promise.all([
    supabase.from('profiles').select('role, display_name').eq('id', user.id).single(),
    supabase.from('exercises').select('id, name').order('name'),
  ])

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Nav user={{ id: user.id, email: user.email, display_name: profile?.display_name }} isAdmin={profile?.role === 'admin'} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/days" className="font-mono text-sm hover:text-[var(--accent)]">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Log workout</h1>
        </div>
        <form action={createDay} className="space-y-6 border-2 border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-bold uppercase mb-1">Date *</label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={today}
                className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-bold uppercase mb-1">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase mb-2">Sets</p>
            {exercises && exercises.length > 0 ? (
              <DaySetBuilder exercises={exercises} />
            ) : (
              <p className="font-mono text-[var(--muted)]">No exercises available. <Link href="/exercises/new" className="font-bold">Add one first</Link>.</p>
            )}
          </div>

          <div className="flex gap-4">
            <Link
              href="/days"
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
