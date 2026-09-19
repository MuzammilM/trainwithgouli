/**
 * Shared exercise-entry shape for workout_templates.exercises and
 * workout_days.exercises (array items in both collections).
 */
export type ExerciseEntry = {
  name: string
  weight?: string
  sets: string
  reps: string
  rest: string
  done: boolean
  coach_notes: string
  client_notes: string
  circuit: string | null
}

export function emptyEntry(name = ''): ExerciseEntry {
  return {
    name,
    weight: '',
    sets: '3',
    reps: '10',
    rest: '60s',
    done: false,
    coach_notes: '',
    client_notes: '',
    circuit: null,
  }
}

/** Normalize a raw PB JSON value into a well-formed ExerciseEntry array. */
export function normalizeEntries(raw: unknown): ExerciseEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map((e) => {
    const r = (e ?? {}) as Record<string, unknown>
    return {
      name: String(r.name ?? ''),
      weight: r.weight == null ? '' : String(r.weight),
      sets: String(r.sets ?? ''),
      reps: String(r.reps ?? ''),
      rest: String(r.rest ?? ''),
      done: Boolean(r.done),
      coach_notes: String(r.coach_notes ?? ''),
      client_notes: String(r.client_notes ?? ''),
      circuit: r.circuit == null ? null : String(r.circuit),
    }
  })
}

/** Next free circuit id ("c1", "c2", …) not already used in the array. */
export function nextCircuitId(entries: ExerciseEntry[]): string {
  let n = 1
  const used = new Set(entries.map((e) => e.circuit).filter(Boolean))
  while (used.has(`c${n}`)) n++
  return `c${n}`
}

/**
 * Dissolve circuit ids that no longer have 2+ members (e.g. after ungrouping
 * or reordering split a group). Mutates nothing — returns a new array.
 */
export function dissolveLonelyCircuits(entries: ExerciseEntry[]): ExerciseEntry[] {
  const counts = new Map<string, number>()
  for (const e of entries) {
    if (e.circuit) counts.set(e.circuit, (counts.get(e.circuit) ?? 0) + 1)
  }
  return entries.map((e) =>
    e.circuit && (counts.get(e.circuit) ?? 0) < 2 ? { ...e, circuit: null } : e,
  )
}

/**
 * Expand an index to the full contiguous circuit block containing it
 * (same circuit id, adjacent rows). Circuits always move as a unit.
 */
export function circuitBlock(entries: ExerciseEntry[], index: number): [number, number] {
  const id = entries[index]?.circuit
  if (!id) return [index, index]
  let start = index
  let end = index
  while (start > 0 && entries[start - 1].circuit === id) start--
  while (end < entries.length - 1 && entries[end + 1].circuit === id) end++
  return [start, end]
}
