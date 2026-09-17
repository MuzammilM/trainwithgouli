const CAPTIONS = [
  'reps lifted in the gym',
  'chalked up and logged',
  'forged under the bar',
  'earned one rep at a time',
  'no shortcuts. only sets.',
]

export function VersionPill() {
  const version = process.env.NEXT_PUBLIC_BUILD_VERSION || ''
  if (!version) return null

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  const caption = CAPTIONS[dayOfYear % CAPTIONS.length]

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-2 right-2 z-30 px-2 py-1 border border-[var(--border)] bg-[var(--surface)] font-mono text-[11px] text-[var(--muted)] pointer-events-none"
    >
      v{version} — {caption}
    </div>
  )
}
