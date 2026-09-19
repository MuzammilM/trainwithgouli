'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  setAllSets,
  toggleDone,
  toggleSet,
  reorder,
  saveClientNote,
  importSheetBlock,
} from '@/lib/actions/today'
import {
  circuitBlock,
  dissolveLonelyCircuits,
  isEntryDone,
  nextCircuitId,
  setCountOf,
  withSetToggled,
  type ExerciseEntry,
} from '@/lib/exercise'

type DayInfo = { dayId: string; sheetRowStart: number | null; sheetOrder: string[] | null }

export function TodayChecklist({
  dayId,
  initialEntries,
  sheetRowStart,
  sheetOrder,
  sheetMismatch = false,
  sheetCount = 0,
  dbCount = 0,
}: {
  dayId: string
  initialEntries: ExerciseEntry[]
  sheetRowStart: number | null
  sheetOrder: string[] | null
  sheetMismatch?: boolean
  sheetCount?: number
  dbCount?: number
}) {
  const [entries, setEntries] = useState<ExerciseEntry[]>(initialEntries)
  const [focused, setFocused] = useState<number | null>(null)
  const [showMismatch, setShowMismatch] = useState(sheetMismatch)
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const day: DayInfo = { dayId, sheetRowStart, sheetOrder }

  async function handleImport() {
    setImporting(true)
    setImportMessage(null)
    try {
      const res = await importSheetBlock(dayId)
      if (res.ok) {
        setShowMismatch(false)
      } else {
        setImportMessage(res.message ?? 'Import failed — try again.')
      }
    } catch {
      setImportMessage('Import failed — try again.')
    } finally {
      setImporting(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const done = entries.filter((e) => isEntryDone(e)).length

  function toggle(index: number) {
    // Master checkbox = check ALL sets (or uncheck all when already done).
    const current = entries[index]
    const allDone = isEntryDone(current)
    const n = setCountOf(current)
    const nextEntry: ExerciseEntry = current.sets_done
      ? {
          ...current,
          sets_done: Array.from({ length: n }, () => !allDone),
          done: !allDone,
        }
      : { ...current, done: !allDone }
    // Optimistic update
    setEntries((prev) => prev.map((e, i) => (i === index ? nextEntry : e)))
    // Auto-advance: completing the focused card moves focus to the next uncompleted
    setFocused((currentFocus) => {
      if (currentFocus !== index) return currentFocus
      if (!isEntryDone(nextEntry)) return currentFocus
      for (let step = 1; step < entries.length; step++) {
        const j = (index + step) % entries.length
        if (!isEntryDone(entries[j]) && j !== index) return j
      }
      return null
    })
    startTransition(() => {
      if (!current.sets_done) {
        // Legacy all-or-nothing entry — plain done flip keeps state consistent.
        toggleDone(dayId, index)
        return
      }
      // Per-set entry: one atomic all-sets write (clamped to setCountOf).
      setAllSets(dayId, index, !allDone)
    })
  }

  function toggleSetLocal(index: number, setIdx: number) {
    // Optimistic per-set flip
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? withSetToggled(e, setIdx) : e)),
    )
    startTransition(() => {
      toggleSet(dayId, index, setIdx)
    })
  }

  function persist(next: ExerciseEntry[]) {
    setEntries(next)
    startTransition(() => {
      reorder(dayId, next)
    })
  }

  function groupWithNext(index: number) {
    // Focused + next unchecked → shared circuit id
    let target = -1
    for (let step = 1; step < entries.length; step++) {
      const j = index + step
      if (j < entries.length && !entries[j].done && !entries[j].circuit) {
        target = j
        break
      }
    }
    if (target === -1) return
    const id = nextCircuitId(entries)
    const next = dissolveLonelyCircuits(
      entries.map((e, i) => (i === index || i === target ? { ...e, circuit: id } : e)),
    )
    persist(next)
  }

  function ungroup(index: number) {
    const next = dissolveLonelyCircuits(
      entries.map((e, i) => (i === index ? { ...e, circuit: null } : e)),
    )
    persist(next)
  }

  function onDragEnd(event: DragEndEvent) {
    const from = event.active.data.current?.index as number | undefined
    const to = event.over?.data.current?.index as number | undefined
    if (from == null || to == null || from === to) return
    setEntries((prev) => {
      const [bs, be] = circuitBlock(prev, from)
      const block = prev.slice(bs, be + 1)
      const rest = [...prev.slice(0, bs), ...prev.slice(be + 1)]
      // Insertion point after removing the block (block lands on the target slot)
      const blockLen = be - bs + 1
      const insert =
        to > be ? Math.max(0, to - blockLen + 1) : Math.min(to, rest.length)
      const next = dissolveLonelyCircuits([
        ...rest.slice(0, insert),
        ...block,
        ...rest.slice(insert),
      ])
      startTransition(() => {
        reorder(dayId, next)
      })
      return next
    })
    setFocused(null)
  }

  // Render as contiguous blocks (circuits grouped)
  const blocks: { circuit: string | null; items: { entry: ExerciseEntry; index: number }[] }[] = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const last = blocks[blocks.length - 1]
    if (e.circuit && last?.circuit === e.circuit) last.items.push({ entry: e, index: i })
    else blocks.push({ circuit: e.circuit ?? null, items: [{ entry: e, index: i }] })
  }

  return (
    <div className="space-y-4">
      {/* Sheet-drift banner */}
      {showMismatch && (
        <div className="border-2 border-[var(--accent)] bg-[var(--surface-2)] p-4 space-y-3">
          <p className="font-mono text-sm font-bold text-[var(--accent)]">
            This workout was changed in the Google Sheet ({sheetCount} exercises there vs {dbCount}{' '}
            here).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="px-3 py-1.5 border-2 border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] text-xs font-bold uppercase disabled:opacity-50"
            >
              {importing ? 'Importing…' : 'Import from sheet'}
            </button>
            <button
              type="button"
              onClick={() => setShowMismatch(false)}
              className="px-3 py-1.5 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--surface-2)]"
            >
              Dismiss
            </button>
          </div>
          {importMessage && (
            <p className="font-mono text-xs text-[var(--accent)]">{importMessage}</p>
          )}
        </div>
      )}

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)] mb-1">
          <span>
            {done}/{entries.length}
          </span>
        </div>
        <div className="h-2 bg-[var(--surface-2)] border border-[var(--border)]">
          <div
            className="h-full bg-[var(--accent)] transition-[width]"
            style={{ width: entries.length ? `${(done / entries.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={entries.map((_, i) => i)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, bi) => {
            const isCircuit = block.circuit != null
            const cards = block.items.map(({ entry, index }) => (
              <ExerciseCard
                key={index}
                index={index}
                entry={entry}
                focused={focused === index}
                dimmed={focused != null && focused !== index}
                onToggle={() => toggle(index)}
                onToggleSet={(setIdx) => toggleSetLocal(index, setIdx)}
                onFocus={() => setFocused((f) => (f === index ? null : index))}
                onGroupWithNext={
                  isCircuit ? undefined : focused === index ? () => groupWithNext(index) : undefined
                }
                onUngroup={isCircuit && focused === index ? () => ungroup(index) : undefined}
                day={day}
              />
            ))
            return isCircuit ? (
              <div
                key={bi}
                className="border-2 border-dashed border-[var(--accent)] p-3 space-y-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-bold">
                  Circuit — round through, then rest
                </p>
                {cards}
              </div>
            ) : (
              <div key={bi} className="space-y-3">
                {cards}
              </div>
            )
          })}
        </SortableContext>
      </DndContext>

      {entries.length === 0 && (
        <p className="font-mono text-[var(--muted)]">This workout has no exercises.</p>
      )}
    </div>
  )
}

function ExerciseCard({
  index,
  entry,
  focused,
  dimmed,
  onToggle,
  onToggleSet,
  onFocus,
  onGroupWithNext,
  onUngroup,
  day,
}: {
  index: number
  entry: ExerciseEntry
  focused: boolean
  dimmed: boolean
  onToggle: () => void
  onToggleSet: (setIdx: number) => void
  onFocus: () => void
  onGroupWithNext?: () => void
  onUngroup?: () => void
  day: DayInfo
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: index,
    data: { index },
  })
  const [note, setNote] = useState(entry.client_notes)
  const [, startTransition] = useTransition()
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => setNote(entry.client_notes), [entry.client_notes])

  function saveNote() {
    if (note === entry.client_notes) return
    startTransition(() => {
      saveClientNote(day.dayId, index, note)
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : undefined,
      }}
      className={`border-2 bg-[var(--surface)] p-4 transition-opacity ${
        focused ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-[var(--border)]'
      } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
    >
      <div className="flex items-start gap-3">
        {/* Grip handle */}
        <button
          type="button"
          aria-label={`Reorder ${entry.name}`}
          {...attributes}
          {...listeners}
          className="mt-1 px-1.5 py-2 text-[var(--muted)] cursor-grab touch-none active:cursor-grabbing select-none"
        >
          ⠿
        </button>

        {/* Master checkbox — check/uncheck ALL sets */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isEntryDone(entry)}
          aria-label={`Mark ${entry.name} ${isEntryDone(entry) ? 'not done' : 'done'}`}
          onClick={onToggle}
          className={`mt-1 size-6 shrink-0 border-2 flex items-center justify-center font-black ${
            isEntryDone(entry)
              ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]'
          }`}
        >
          {isEntryDone(entry) ? '✓' : ''}
        </button>

        <div className="flex-1 min-w-0" onClick={onFocus}>
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-lg font-black uppercase ${
                isEntryDone(entry) ? 'line-through opacity-60' : ''
              }`}
            >
              {entry.name}
            </h3>
            <span className="px-2 py-0.5 bg-[var(--info)] text-[var(--info-ink)] font-bold text-xs">
              R: {entry.reps}
            </span>
            {entry.rest && (
              <span className="px-2 py-0.5 border border-[var(--border)] text-[var(--muted)] text-xs font-mono">
                rest {entry.rest}
              </span>
            )}
          </div>
          {entry.weight && (
            <p className="mt-1 font-mono text-sm">Weight: {entry.weight}</p>
          )}
          {entry.coach_notes && (
            <p className="mt-1 font-mono text-xs text-[var(--muted)] italic">
              {entry.coach_notes}
            </p>
          )}
          <textarea
            ref={taRef}
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
            onBlur={saveNote}
            placeholder="Your notes…"
            rows={1}
            className="mt-2 w-full resize-none px-2 py-1.5 border border-[var(--border)] bg-[var(--background)] font-mono text-xs overflow-hidden"
          />
        </div>

        {/* Per-set checkboxes — right side of the header row */}
        <div className="shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1.5">
            {Array.from({ length: setCountOf(entry) }, (_, i) => {
              // Legacy entries (no sets_done): derive from done (all-or-nothing).
              const checked = entry.sets_done ? Boolean(entry.sets_done[i]) : entry.done
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[10px] text-[var(--muted)]">S{i + 1}</span>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`Set ${i + 1} of ${entry.name}`}
                    onClick={() => onToggleSet(i)}
                    className={`size-5 border-2 flex items-center justify-center text-[10px] font-black ${
                      checked
                        ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                        : 'border-[var(--accent)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Focus actions */}
      {focused && (
        <div className="mt-2 flex gap-2">
          {onGroupWithNext && (
            <button
              type="button"
              onClick={onGroupWithNext}
              className="px-2 py-1 border-2 border-[var(--accent)] text-[var(--accent)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
            >
              Group with next
            </button>
          )}
          {onUngroup && (
            <button
              type="button"
              onClick={onUngroup}
              className="px-2 py-1 border-2 border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
            >
              Ungroup
            </button>
          )}
        </div>
      )}
    </div>
  )
}

