import Link from 'next/link'
import { signup } from '@/lib/actions/auth'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-black uppercase tracking-tighter no-underline hover:text-[var(--accent)]">
            TrainWithGouli
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md border-2 border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
          <h1 className="text-3xl font-black uppercase mb-6">Sign up</h1>
          <form action={signup} className="space-y-4">
            <div>
              <label htmlFor="display_name" className="block text-sm font-bold uppercase mb-1">Display name</label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold uppercase mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold uppercase mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-black uppercase hover:bg-[var(--accent)]"
            >
              Sign up
            </button>
          </form>
          <p className="mt-4 text-sm font-mono">
            Already have an account?{' '}
            <Link href="/login" className="font-bold hover:text-[var(--accent)]">Log in</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
