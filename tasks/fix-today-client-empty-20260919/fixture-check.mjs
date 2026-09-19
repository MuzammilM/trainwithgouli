/**
 * Fixture check for fix-today-client-empty-20260919 helpers:
 * carryOverByName + nameMultisetsEqual (from frontend/next/src/lib/exercise.ts).
 * Run: node tasks/fix-today-client-empty-20260919/fixture-check.mjs
 * (pure functions — no build needed; duplicated logic kept in sync by contract doc)
 */
import assert from 'node:assert/strict'

// Inline copies of the two pure helpers under test (source of truth:
// frontend/next/src/lib/exercise.ts — verified by grep after edits).
function carryOverByName(prev, next) {
  const pool = prev.map((e) => ({
    name: e.name.trim().toLowerCase(),
    done: e.done,
    client_notes: e.client_notes,
  }))
  return next.map((entry) => {
    const key = entry.name.trim().toLowerCase()
    const idx = pool.findIndex((p) => p.name === key)
    if (idx === -1) return { ...entry, circuit: null }
    const match = pool[idx]
    pool.splice(idx, 1)
    return { ...entry, done: match.done, client_notes: match.client_notes, circuit: null }
  })
}

function nameMultisetsEqual(a, b) {
  if (a.length !== b.length) return false
  const norm = (list) => list.map((n) => n.trim().toLowerCase()).sort().join('\u0000')
  return norm(a) === norm(b)
}

const base = { weight: '', sets: '3', reps: '10', rest: '60s', coach_notes: '' }

// 1. Carry-over: done + client_notes move by name; new names reset circuit.
const prev = [
  { ...base, name: 'Squat', done: true, client_notes: 'felt heavy', circuit: 'c1' },
  { ...base, name: 'Press', done: false, client_notes: '', circuit: null },
]
const next = [
  { ...base, name: 'Squat', done: false, client_notes: '', circuit: null },
  { ...base, name: 'Row', done: false, client_notes: '', circuit: null },
]
const carried = carryOverByName(prev, next)
assert.equal(carried[0].done, true)
assert.equal(carried[0].client_notes, 'felt heavy')
assert.equal(carried[0].circuit, null, 'circuit reset on carry-over')
assert.equal(carried[1].done, false)
assert.equal(carried[1].client_notes, '')

// 2. First-match consumption with duplicate names.
const dupPrev = [
  { ...base, name: 'Pull-up', done: true, client_notes: 'first', circuit: null },
  { ...base, name: 'Pull-up', done: false, client_notes: 'second', circuit: null },
]
const dupNext = [
  { ...base, name: 'Pull-up', done: false, client_notes: '', circuit: null },
  { ...base, name: 'Pull-up', done: false, client_notes: '', circuit: null },
]
const dupCarried = carryOverByName(dupPrev, dupNext)
assert.equal(dupCarried[0].client_notes, 'first')
assert.equal(dupCarried[1].client_notes, 'second')

// 3. Case/whitespace-insensitive matching.
const caseCarried = carryOverByName(
  [{ ...base, name: '  squat ', done: true, client_notes: 'x', circuit: null }],
  [{ ...base, name: 'SQUAT', done: false, client_notes: '', circuit: null }],
)
assert.equal(caseCarried[0].done, true)
assert.equal(caseCarried[0].client_notes, 'x')

// 4. Multiset compare: order-insensitive, case-insensitive.
assert.equal(nameMultisetsEqual(['Bench', 'Row'], ['row', 'bench']), true)
assert.equal(nameMultisetsEqual(['Bench', 'Row'], ['Row']), false)
assert.equal(nameMultisetsEqual(['Bench', 'Bench'], ['Bench', 'Row']), false)
assert.equal(nameMultisetsEqual([], []), true)
assert.equal(nameMultisetsEqual([' Bench '], ['bench']), true)

console.log('fixture-check: all assertions passed')
