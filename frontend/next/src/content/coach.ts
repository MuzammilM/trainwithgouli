// PLACEHOLDER — replace with real coach data
// Single source of truth for the "The Coach" hero band on the home page.
// Swapping in real copy/photos later is a one-file change.

export const COACH_PLACEHOLDER = {
  kicker: 'The Coach',
  name: 'Harish Gouli',
  bio: 'Strength first. Every program here is built on progressive overload — add weight, add reps, log the session, repeat. No shortcuts, no gimmicks, no six-week miracles. Just the bar, the logbook, and the work.',
  stats: [
    { label: 'Years coaching', value: '10+' },
    { label: 'Clients trained', value: '50+' },
    { label: 'Sessions logged', value: '1,200+' },
  ],
  cta: { label: 'Start training', href: '/signup' },
} as const
