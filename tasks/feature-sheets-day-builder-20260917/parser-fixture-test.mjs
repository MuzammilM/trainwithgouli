// Standalone parser sanity test — mirrors parseHistory() and appendDayBlock()
// value assembly from frontend/next/src/lib/google/sheets.ts (house format, columns A–F).
// Run: node tasks/feature-sheets-day-builder-20260917/parser-fixture-test.mjs

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

// Fixture: 2 day-blocks — banner, date headers, column header, exercise rows
// with free-text weights, a "Cool downtown" footer, and an invalid date.
const fixture = [
  ['Train with Harry Gouli', '', '', '', '', ''],
  ['01/09/2026', '', '', '', '', ''],
  ['', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest'],
  ['01/09/2026', 'Deadlift', '12.5-15 kg', '8-10', '3', '90s'],
  ['01/09/2026', 'Pull Up', 'BW', 'AMRAP', '4', '2 min'],
  ['01/09/2026', 'Cool downtown', '', '', '', ''],
  ['Train with Harry Gouli', '', '', '', '', ''],
  ['03/09/2026', '', '', '', '', ''],
  ['', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest'],
  ['03/09/2026', 'Bench Press', '60 kg', '5x5', '5', '120s'],
  ['03/09/2026', 'Plank', '', '60s', '3', '30s'],
  ['03/09/2026', 'Cool down stretch', '', '', '', ''],
  ['31/02/2026', '', '', '', '', ''], // invalid date → ignored, block date unchanged
  ['', 'Ghost Row', '10', '10', '3', '60s'], // belongs to previous valid block (03/09)
]

const rows = parseHistory(fixture)

const expected = [
  { date: '2026-09-01', exercise: 'Deadlift', weight: '12.5-15 kg', reps: '8-10', sets: '3', rest: '90s' },
  { date: '2026-09-01', exercise: 'Pull Up', weight: 'BW', reps: 'AMRAP', sets: '4', rest: '2 min' },
  { date: '2026-09-03', exercise: 'Bench Press', weight: '60 kg', reps: '5x5', sets: '5', rest: '120s' },
  { date: '2026-09-03', exercise: 'Plank', weight: '', reps: '60s', sets: '3', rest: '30s' },
  { date: '2026-09-03', exercise: 'Ghost Row', weight: '10', reps: '10', sets: '3', rest: '60s' },
]

let pass = true
function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${label}`)
  if (!cond) pass = false
}

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

// ---- appendDayBlock values shape (mirrors the assembly in sheets.ts) ----

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
    ['Date', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest'],
    ...rows.map((r) => [ddMmYyyy(dateISO), r.exercise, r.weight, r.reps, r.sets, r.rest ?? '']),
    [COOL_DOWN_LINE],
  ]
}

const appendRows = [
  { exercise: 'Deadlift', weight: '100 kg', reps: '5', sets: '3', rest: '90s' },
  { exercise: 'Pull Up', weight: 'BW', reps: 'AMRAP', sets: '4' }, // no rest → empty cell
]

const values = buildAppendValues('2026-09-17', appendRows)

const expectedValues = [
  ['Train with Harry Gouli'],
  ['17/09/2026'],
  ['Date', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest'],
  ['17/09/2026', 'Deadlift', '100 kg', '5', '3', '90s'],
  ['17/09/2026', 'Pull Up', 'BW', 'AMRAP', '4', ''],
  [COOL_DOWN_LINE],
]

check(`append values row count = ${expectedValues.length} (got ${values.length})`, values.length === expectedValues.length)
for (let i = 0; i < expectedValues.length; i++) {
  const ok = JSON.stringify(values[i]) === JSON.stringify(expectedValues[i])
  check(`append values[${i}] = ${JSON.stringify(expectedValues[i])}`, ok)
}
check('append: banner is row 0', values[0][0] === 'Train with Harry Gouli')
check('append: date row is DD/MM/YYYY', values[1][0] === '17/09/2026')
check('append: header row matches house columns', JSON.stringify(values[2]) === JSON.stringify(['Date', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest']))
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

console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED')
process.exit(pass ? 0 : 1)
