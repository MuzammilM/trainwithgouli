import Link from 'next/link'
import { GoogleButton } from '@/components/GoogleButton'

const ERROR_MESSAGES: Record<string, string> = {
  'not-registered': "This email isn't registered with a coach yet.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const message = error ? (ERROR_MESSAGES[error] || 'Sign-in failed. Please try again.') : null
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-end">
          <Link
            href="/"
            className="font-display text-2xl lowercase tracking-tight no-underline hover:text-[var(--foreground)]"
          >
            trainwithgouli<span className="text-[var(--accent)]">.</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between border-r-2 border-[var(--border)] p-12">
          <p className="font-mono text-sm text-[var(--muted)] max-w-sm">
            Back under the bar. Every session logged is a number to beat.
          </p>
          <p className="font-display text-[clamp(3rem,5vw,5.5rem)] leading-[0.95]">
            Log in.
            <br />
            <span className="text-[var(--accent)]">Lift heavy.</span>
          </p>
        </div>
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <h1 className="font-display text-4xl mb-2">Log in</h1>
            <p className="font-mono text-sm text-[var(--muted)] mb-8">
              Enter the logbook.
            </p>
            {message ? (
              <p
                role="alert"
                className="mb-6 border-2 border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-3 py-2.5 font-mono text-sm"
              >
                {message}
              </p>
            ) : null}
            <GoogleButton />
            <p className="mt-6 text-sm font-mono text-[var(--muted)]">
              Access is invite-only — ask your coach to add you.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
