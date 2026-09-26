'use client'

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react'
import { BODY_PARTS } from '@/lib/body-parts'

export interface PickerExercise {
  id: string
  name: string
  body_part?: string[] | null
  youtube_url?: string | null
}

/**
 * Fuzzy subsequence score for an exercise name. Every query character must
 * appear in the name in order (case-insensitive); consecutive-character runs
 * and word-start matches score higher. Returns null when the name is not a
 * subsequence match for the query.
 */
function fuzzyScore(query: string, name: string): number | null {
  const q = query.toLowerCase()
  const n = name.toLowerCase()
  if (!q) return 0
  let score = 0
  let from = 0
  for (let i = 0; i < q.length; i++) {
    const idx = n.indexOf(q[i], from)
    if (idx === -1) return null
    if (idx === from && i > 0) score += 2 // extends a consecutive run
    if (idx === 0 || /[^a-z0-9]/.test(n[idx - 1])) score += 3 // word start
    score += 1
    from = idx + 1
  }
  if (n.startsWith(q)) score += 8
  else if (n.includes(q)) score += 4
  return score
}

const MAX_FUZZY_MATCHES = 10

/**
 * Shared exercise picker: fuzzy-search combobox (type to filter, dropdown of
 * matches) + body-part tag chips as an optional filter layer. Used by
 * DayBuilder (/days, /today-coach) and TemplateForm (plan template
 * create/edit).
 *
 * The combobox input shows the selected exercise NAME; onSelect receives the
 * chosen name plus the full exercise record so callers can keep whatever
 * extra fields (id, youtube_url) they need. Callers own the persisted form
 * field (hidden input / serialized state) — this component only renders the
 * visible input and dropdown.
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
  /** Accessible label for the combobox input (defaults to "Exercise"). */
  name?: string
}) {
  const [search, setSearch] = useState(selectedName)
  const [chip, setChip] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [prevSelected, setPrevSelected] = useState(selectedName)
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const optionId = (i: number) => `${baseId}-opt-${i}`

  // Keep the input in sync when the caller changes the committed selection
  // (e.g. row reset, template edit prefill). Adjusting during render (not in
  // an effect) avoids cascading renders.
  if (selectedName !== prevSelected) {
    setPrevSelected(selectedName)
    setSearch(selectedName)
  }

  const matches = useMemo(() => {
    const pool = chip
      ? exercises.filter((ex) => Array.isArray(ex.body_part) && ex.body_part.includes(chip))
      : exercises
    const q = search.trim()
    if (!q) return pool
    const scored: { ex: PickerExercise; score: number }[] = []
    for (const ex of pool) {
      const s = fuzzyScore(q, ex.name)
      if (s !== null) scored.push({ ex, score: s })
    }
    scored.sort((a, b) => b.score - a.score || a.ex.name.localeCompare(b.ex.name))
    return scored.slice(0, MAX_FUZZY_MATCHES).map((s) => s.ex)
  }, [exercises, search, chip])

  // Keep the keyboard-highlighted option visible in the scrollable list.
  useEffect(() => {
    if (open && highlight >= 0) {
      document.getElementById(`${baseId}-opt-${highlight}`)?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, highlight, baseId])

  function commit(exerciseName: string) {
    onSelect(exerciseName, exercises.find((e) => e.name === exerciseName))
    setSearch(exerciseName)
    setOpen(false)
    setHighlight(-1)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setHighlight(matches.length ? 0 : -1)
      } else if (matches.length) {
        setHighlight((h) => Math.min(h + 1, matches.length - 1))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setHighlight(matches.length ? matches.length - 1 : -1)
      } else if (matches.length) {
        setHighlight((h) => Math.max(h - 1, 0))
      }
    } else if (e.key === 'Enter') {
      // While picking, Enter must never submit the surrounding form.
      if (open) {
        e.preventDefault()
        if (highlight >= 0 && matches[highlight]) commit(matches[highlight].name)
        else setOpen(false)
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
        setHighlight(-1)
        setSearch(selectedName) // restore the committed selection
      }
    }
  }

  return (
    <>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
            setHighlight(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false)
            setHighlight(-1)
            setSearch(selectedName) // revert to the committed selection
          }}
          onKeyDown={handleKeyDown}
          aria-label={name ?? 'Exercise'}
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={open && highlight >= 0 ? optionId(highlight) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Search exercises…"
          className="w-full px-2 py-2 border-2 border-[var(--border)] bg-[var(--surface)]"
        />
        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={`${name ?? 'Exercise'} options`}
            className="absolute left-0 right-0 top-full z-20 mt-0.5 max-h-64 overflow-y-auto border-2 border-[var(--border)] bg-[var(--surface)]"
          >
            {matches.map((ex, i) => (
              <li
                key={ex.id}
                id={optionId(i)}
                role="option"
                aria-selected={ex.name === selectedName}
                onMouseDown={(e) => e.preventDefault()} // keep focus on the input
                onClick={() => commit(ex.name)}
                className={`flex min-h-[40px] cursor-pointer select-none items-center px-3 text-sm ${
                  i === highlight
                    ? 'bg-[var(--surface-2)] text-[var(--accent)]'
                    : ex.name === selectedName
                      ? 'text-[var(--accent)]'
                      : ''
                }`}
              >
                {ex.name}
              </li>
            ))}
            {matches.length === 0 && (
              <li className="flex min-h-[40px] items-center px-3 text-sm text-[var(--muted)]">
                No matches
              </li>
            )}
          </ul>
        )}
      </div>
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
      </div>
    </>
  )
}
