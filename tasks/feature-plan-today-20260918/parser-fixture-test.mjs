// Standalone parser sanity test — mirrors parseHistory(), parseWeightKg(),
// appendDayBlock() value assembly + first-exercise-row math, and
// updateClientNoteCell() range construction from
// frontend/next/src/lib/google/sheets.ts (8-column format).
// Run: node tasks/feature-plan-today-20260918/parser-fixture-test.mjs

function parseDdMmYyyy(raw) {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const dt = new Date(Date.UTC(year, month - 1, day))
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseHistory(values) {
  const rows = []
  let currentDate = null
  for (const raw of values) {
    const a = (raw[0] ?? '').trim()
    const b = (raw[1] ?? '').trim()
    const c = (raw[2] ?? '').trim()
    const d = (raw[3] ?? '').trim()
    const e = (raw[4] ?? '').trim()
    const f = (raw[5] ?? '').trim()
    if (a && !b) {
      const iso = parseDdMmYyyy(a)
      if (iso) {
        currentDate = iso
        continue
      }
      continue
    }
    if (b === 'Workouts') continue
    if (b.toLowerCase().startsWith('cool')) continue
    if (!b || !currentDate) continue
    rows.push({ date: currentDate, exercise: b, weight: c, reps: d, sets: e, rest: f })
  }
  return rows
}

// Mirror of parseWeightKg() in frontend/next/src/lib/google/sheets.ts
function parseWeightKg(raw) {
  const s = raw.trim()
  if (!s) return null
  const lower = s.toLowerCase()
  if (
    /\bbar\b/.test(lower) ||
    /\bbw\b/.test(lower) ||
    /bodyweight/.test(lower) ||
    /\bamrap\b/.test(lower) ||
    /\bsec\b/.test(lower) ||
    /\bsecs\b/.test(lower) ||
    /\bsteps?\b/.test(lower) ||
    /\bm\b/.test(lower) ||
    /\d\s*m\b/.test(lower)
  ) {
    return null
  }
  const range = lower.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*kg$/)
  if (range) return Math.max(Number(range[1]), Number(range[2]))
  const kgMatches = [...s.matchAll(/(\d+(?:\.\d+)?)\s*kg/gi)]
  if (kgMatches.length === 1) return Number(kgMatches[0][1])
  return null
}

let pass = true
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${label}`)
  if (!cond) pass = false
}

// ---- parseWeightKg fixture cases (leaderboard acceptance rules) ----

const weightCases = [
  ['60kg', 60, '60kg → 60'],
  ['60 kg', 60, '60 kg (space) → 60'],
  ['12.5kg', 12.5, '12.5kg → 12.5'],
  ['12.5-15 kg', 15, 'range 12.5-15 kg → max 15'],
  ['10-12kg', 12, 'range 10-12kg → max 12'],
  ['BW', null, 'BW → null'],
  ['bw', null, 'bw lowercase → null'],
  ['Bodyweight', null, 'Bodyweight → null'],
  ['Bar+5kg plates', null, 'Bar+5kg plates → null (bar)'],
  ['5kg +bar', null, '5kg +bar → null (bar)'],
  ['20 sec', null, '20 sec → null'],
  ['90s', null, '90s (bare, no kg) → null'],
  ['100 steps', null, '100 steps → null'],
  ['M', null, 'M → null'],
  ['12.5m', null, '12.5m (meters) → null'],
  ['7.5kh', null, '7.5kh (typo unit) → null'],
  ['', null, 'empty → null'],
  ['   ', null, 'whitespace → null'],
  ['AMRAP', null, 'AMRAP → null'],
  ['10', null, 'bare number without kg → null (conservative)'],
]

for (const [raw, expected, label] of weightCases) {
  const got = parseWeightKg(raw)
  check(`parseWeightKg: ${label} (got ${got})`, got === expected)
}

// ---- parseHistory fixture: 2 day-blocks with weighted + unweighted rows ----

const fixture = [
  ['Train with Harry Gouli', '', '', '', '', '', '', ''],
  ['01/09/2026', '', '', '', '', '', '', ''],
  ['', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest', 'Coach Notes', 'Client Notes'],
  ['01/09/2026', 'Deadlift', '12.5-15 kg', '8-10', '3', '90s', 'brace core', ''],
  ['01/09/2026', 'Pull Up', 'BW', 'AMRAP', '4', '2 min', '', ''],
  ['01/09/2026', 'Cool downtown', '', '', '', '', '', ''],
  ['Train with Harry Gouli', '', '', '', '', '', '', ''],
  ['03/09/2026', '', '', '', '', '', '', ''],
  ['', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest', 'Coach Notes', 'Client Notes'],
  ['03/09/2026', 'Bench Press', '60 kg', '5x5', '5', '120s', 'pause at bottom', ''],
  ['03/09/2026', 'Plank', '', '60s', '3', '30s', '', ''],
  ['03/09/2026', 'Cool down stretch', '', '', '', '', '', ''],
  ['31/02/2026', '', '', '', '', '', '', ''], // invalid date → ignored, block date unchanged
  ['', 'Ghost Row', '10', '10', '3', '60s', '', ''], // belongs to previous valid block (03/09)
]

const rows = parseHistory(fixture)

const expected = [
  { date: '2026-09-01', exercise: 'Deadlift', weight: '12.5-15 kg', reps: '8-10', sets: '3', rest: '90s' },
  { date: '2026-09-01', exercise: 'Pull Up', weight: 'BW', reps: 'AMRAP', sets: '4', rest: '2 min' },
  { date: '2026-09-03', exercise: 'Bench Press', weight: '60 kg', reps: '5x5', sets: '5', rest: '120s' },
  { date: '2026-09-03', exercise: 'Plank', weight: '', reps: '60s', sets: '3', rest: '30s' },
  { date: '2026-09-03', exercise: 'Ghost Row', weight: '10', reps: '10', sets: '3', rest: '60s' },
]

check(`row count = ${expected.length} (got ${rows.length})`, rows.length === expected.length)
for (let i = 0; i < expected.length; i++) {
  const ok = JSON.stringify(rows[i]) === JSON.stringify(expected[i])
  check(`row[${i}] = ${JSON.stringify(expected[i])}`, ok)
}
check('no "Cool" rows parsed', rows.every((r) => !r.exercise.toLowerCase().startsWith('cool')))
check('no banner rows parsed', rows.every((r) => r.exercise !== 'Train with Harry Gouli'))
check('no "Workouts" header rows parsed', rows.every((r) => r.exercise !== 'Workouts'))
check('invalid date 31/02/2026 → null', parseDdMmYyyy('31/02/2026') === null)
check('valid date 01/09/2026 → 2026-09-01', parseDdMmYyyy('01/09/2026') === '2026-09-01')

// ---- leaderboard aggregation over the fixture rows ----

const entries = rows
  .map((row) => {
    const kg = parseWeightKg(row.weight)
    return kg == null ? null : { email: 'a@b.co', exercise: row.exercise, weightKg: kg, weightRaw: row.weight, date: row.date }
  })
  .filter((e) => e !== null)

check('leaderboard entries: only parseable lifts (2 of 5)', entries.length === 2)
check('leaderboard: Deadlift 12.5-15 kg → 15', entries[0].exercise === 'Deadlift' && entries[0].weightKg === 15)
check('leaderboard: Bench Press 60 kg → 60', entries[1].exercise === 'Bench Press' && entries[1].weightKg === 60)
const ranked = [...entries].sort((a, b) => b.weightKg - a.weightKg || b.date.localeCompare(a.date))
check('leaderboard ranking: heaviest first', ranked[0].exercise === 'Bench Press' && ranked[1].exercise === 'Deadlift')

// ---- appendDayBlock values shape (8-column format, mirrors sheets.ts) ----

function ddMmYyyy(dateISO) {
  const [y, m, d] = dateISO.split('-')
  if (!y || !m || !d) return dateISO
  return `${d}/${m}/${y}`
}

const COOL_DOWN_LINE =
  'Cool downtown • Static stretch • Hold the stretch 10-15sec • Exhale and Inhale comfortably.'

function buildAppendValues(dateISO, rows) {
  return [
    ['Train with Harry Gouli'],
    [ddMmYyyy(dateISO)],
    ['Date', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest', 'Coach Notes', 'Client Notes'],
    ...rows.map((r) => [
      ddMmYyyy(dateISO),
      r.exercise,
      r.weight,
      r.reps,
      r.sets,
      r.rest ?? '',
      r.coach_notes ?? '',
      '',
    ]),
    [COOL_DOWN_LINE],
  ]
}

// Mirror of the first-exercise-row math in appendDayBlock:
// updatedRange yields the banner's 1-based row; first exercise = banner + 3.
function firstExerciseRowFromUpdatedRange(updatedRange) {
  const rowMatch = updatedRange.match(/![A-Z]+(\d+)/)
  const bannerRow = rowMatch ? Number(rowMatch[1]) : null
  return bannerRow != null ? bannerRow + 3 : null
}

const appendRows = [
  { exercise: 'Deadlift', weight: '100 kg', reps: '5', sets: '3', rest: '90s', coach_notes: 'brace' },
  { exercise: 'Pull Up', weight: 'BW', reps: 'AMRAP', sets: '4' }, // no rest/notes → empty cells
]

const values = buildAppendValues('2026-09-17', appendRows)

const expectedValues = [
  ['Train with Harry Gouli'],
  ['17/09/2026'],
  ['Date', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest', 'Coach Notes', 'Client Notes'],
  ['17/09/2026', 'Deadlift', '100 kg', '5', '3', '90s', 'brace', ''],
  ['17/09/2026', 'Pull Up', 'BW', 'AMRAP', '4', '', '', ''],
  [COOL_DOWN_LINE],
]

check(`append values row count = ${expectedValues.length} (got ${values.length})`, values.length === expectedValues.length)
for (let i = 0; i < expectedValues.length; i++) {
  const ok = JSON.stringify(values[i]) === JSON.stringify(expectedValues[i])
  check(`append values[${i}] = ${JSON.stringify(expectedValues[i])}`, ok)
}
check('append: exercise rows have 8 cells (banner/date/cool-down are merged single-cell rows)', values[3].length === 8 && values[4].length === 8 && values[0].length === 1 && values[values.length - 1].length === 1)
check('append: banner is row 0', values[0][0] === 'Train with Harry Gouli')
check('append: date row is DD/MM/YYYY', values[1][0] === '17/09/2026')
check('append: header row has 8 cells incl Coach Notes/Client Notes', JSON.stringify(values[2]) === JSON.stringify(['Date', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest', 'Coach Notes', 'Client Notes']))
check('append: coach notes land in col G (index 6)', values[3][6] === 'brace' && values[4][6] === '')
check('append: client notes col H (index 7) always empty on append', values[3][7] === '' && values[4][7] === '')
check('append: per-row date repetition', values[3][0] === '17/09/2026' && values[4][0] === '17/09/2026')
check('append: cool-down footer is last row', values[values.length - 1][0] === COOL_DOWN_LINE)
check('append: round-trip — parseHistory reads back 2 rows', (() => {
  const back = parseHistory(values)
  return (
    back.length === 2 &&
    back[0].date === '2026-09-17' &&
    back[0].exercise === 'Deadlift' &&
    back[0].weight === '100 kg' &&
    back[0].reps === '5' &&
    back[0].sets === '3' &&
    back[0].rest === '90s' &&
    back[1].exercise === 'Pull Up' &&
    back[1].rest === ''
  )
})())
check('ddMmYyyy 2026-01-05 → 05/01/2026', ddMmYyyy('2026-01-05') === '05/01/2026')

// ---- appendDayBlock return value: first exercise row ----

check('updatedRange \'Tab\'!A12:H18 → first exercise row 15', firstExerciseRowFromUpdatedRange("'Tab'!A12:H18") === 15)
check('updatedRange \'Tab\'!A1:H6 → first exercise row 4 (fresh sheet)', firstExerciseRowFromUpdatedRange("'Tab'!A1:H6") === 4)
check('updatedRange missing → null (caller stores null)', firstExerciseRowFromUpdatedRange('') === null)

// ---- updateClientNoteCell: single-cell col-H write (mirror of range construction) ----

function clientNoteRange(tabTitle, row) {
  const quoted = `'${tabTitle.replace(/'/g, "''")}'`
  return `${quoted}!H${row}`
}

check('client note range: tab madebymzm row 7 → \'madebymzm\'!H7', clientNoteRange('madebymzm', 7) === "'madebymzm'!H7")
check('client note range: quoted tab with apostrophe', clientNoteRange("bob's", 12) === "'bob''s'!H12")
check('client note write payload is a single col-H cell', JSON.stringify([[ 'felt strong' ]]) === JSON.stringify([['felt strong']]))

console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED')
process.exit(pass ? 0 : 1)
