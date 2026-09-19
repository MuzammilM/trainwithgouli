'use client'

import { useMemo, useState } from 'react'
import { BODY_PARTS } from '@/lib/body-parts'

export interface PickerExercise {
  id: string
  name: string
  body_part?: string[] | null
  youtube_url?: string | null
}

/**
 * Shared exercise picker: body-part tag chips + "Search exercises…" input
 * filtering a select of exercise names. Used by DayBuilder (/today-coach)
 * and TemplateForm (plan template create/edit).
 *
 * The select's value is the selected exercise NAME; onSelect receives the
 * chosen name plus the full exercise record so callers can keep whatever
 * extra fields (id, youtube_url) they need. Callers own the persisted form
 * field (hidden input / serialized state) — this component only renders the
 * visible select.
 */
export function ExercisePicker({
  exercises,
  selectedName,
  onSelect,
  name,
}: {
  exercises: PickerExercise[]
  selectedName: string
  onSelect: (name: string, exercise?: PickerExercise) => void
  /** Accessible label for the select (defaults to "Exercise"). */
  name?: string
}) {
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return exercises.filter((ex) => {
      if (chip && !(Array.isArray(ex.body_part) && ex.body_part.includes(chip))) return false
      if (q && !ex.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [exercises, search, chip])

  function handleSelect(exerciseName: string) {
    onSelect(exerciseName, exercises.find((e) => e.name === exerciseName))
  }

  return (
    <>
      <select
        value={selectedName}
        onChange={(e) => handleSelect(e.target.value)}
        aria-label={name ?? 'Exercise'}
        className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
      >
        <option value="">Select...</option>
        {filtered.map((ex) => (
          <option key={ex.id} value={ex.name}>
            {ex.name}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        {BODY_PARTS.map((part) => (
          <button
            key={part}
            type="button"
            onClick={() => setChip(chip === part ? null : part)}
            aria-pressed={chip === part}
            className={`font-mono text-[10px] uppercase border-2 px-2 py-1 ${
              chip === part
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-[var(--border)] hover:border-[var(--accent)]'
            }`}
          >
            {part}
          </button>
        ))}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises…"
          aria-label="Filter exercises"
          className="w-full md:ml-auto md:w-40 px-2 py-1 border-2 border-[var(--border)] bg-[var(--surface)] font-mono text-xs order-first md:order-last"
        />
      </div>
    </>
  )
}
