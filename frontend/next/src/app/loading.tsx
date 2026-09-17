export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center" role="status" aria-label="Loading">
      {/* Indeterminate red chalk-line at the top edge */}
      <div className="fixed top-0 left-0 right-0 h-[3px] overflow-hidden" aria-hidden>
        <div className="loading-bar h-full w-1/4 bg-[var(--accent)]" />
      </div>
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
        Loading&hellip;
      </p>
    </div>
  )
}
