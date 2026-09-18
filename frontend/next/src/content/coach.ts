// PLACEHOLDER-FREE — real content v1
// Single source of truth for the coach hero band on the home page.
// Icons are referenced by name and mapped to lucide-react components in page.tsx.

export type CoachCredentialIcon =
  | 'medal'
  | 'trophy'
  | 'users'
  | 'heartpulse'
  | 'clock'

export type CoachCtaVariant = 'primary' | 'outline'

export const COACH = {
  eyebrow: 'STRENGTH / MARTIAL ARTS / REHABILITATION / REAL PROGRESS',
  nameTop: 'Harish',
  nameBottom: 'Gouli',
  roles: 'COACH / ATHLETE / MENTOR',
  bio: 'Strength, skill and a smarter you. Coaching for real progress — from the mat to everyday life.',
  ctas: [
    { label: 'Start training', href: '/login', variant: 'primary' },
    { label: 'View programs', href: '/plans', variant: 'outline' },
  ],
  credentials: [
    { icon: 'medal', label: 'BJJ Blue Belt', sub: '4 stripes' },
    { icon: 'trophy', label: 'MMA & BJJ', sub: 'Champion' },
    { icon: 'users', label: 'National level', sub: 'Athletes coached' },
    { icon: 'heartpulse', label: 'Rehabilitation', sub: 'Specialist' },
    { icon: 'clock', label: '15+ years', sub: 'Experience' },
  ],
  footerLeft: 'CUSTOM TRAINING. REAL RESULTS.',
  footerRight: 'MYSORE, INDIA',
  backgroundWords: ['MMA', 'BJJ', 'STRENGTH', 'REHAB'],
  sideNotes: [
    { text: 'DISCIPLINE BUILDS FREEDOM', position: 'top' },
    { text: 'BETTER PEOPLE THROUGH HARD WORK', position: 'bottom' },
  ],
  photo: {
    src: '/images/coach-gouli.jpg',
    alt: 'Harish Gouli in a blue BJJ gi, wearing his competition medals',
  },
} as const satisfies {
  eyebrow: string
  nameTop: string
  nameBottom: string
  roles: string
  bio: string
  ctas: readonly { label: string; href: string; variant: CoachCtaVariant }[]
  credentials: readonly {
    icon: CoachCredentialIcon
    label: string
    sub: string
  }[]
  footerLeft: string
  footerRight: string
  backgroundWords: readonly string[]
  sideNotes: readonly { text: string; position: 'top' | 'bottom' }[]
  photo: { src: string; alt: string }
}
