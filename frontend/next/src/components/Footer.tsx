import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl lowercase">
            trainwithgouli<span className="text-[var(--accent)]">.</span>
          </p>
          <p className="mt-3 font-mono text-sm text-[var(--muted)] max-w-xs">
            Coached by Harish Gouli. Log lifts, chase numbers, earn the next
            plate.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm font-bold uppercase h-fit"
        >
          <Link href="/exercises" className="nav-link py-3 md:py-1">
            Exercises
          </Link>
          <Link href="/plans" className="nav-link py-3 md:py-1">
            Plans
          </Link>
          <Link href="/days" className="nav-link py-3 md:py-1">
            Days
          </Link>
        </nav>
        <div className="font-mono text-xs text-[var(--muted)] md:text-right md:self-end">
          <p>&copy; {new Date().getFullYear()} trainwithgouli</p>
          <p className="mt-1">trainwithgouli.mzm.co.in</p>
        </div>
      </div>
    </footer>
  );
}
