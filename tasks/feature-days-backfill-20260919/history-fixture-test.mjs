/**
 * Fixture test: DD/MM/YYYY → ISO conversion + history grouping for the
 * /days backfill (task feature-days-backfill-20260919).
 *
 * Mirrors frontend/next/src/lib/history.ts (parseDdMmYyyy, groupHistoryByDate)
 * — same repo pattern as the earlier parser-fixture-test.mjs files.
 * Run: node tasks/feature-days-backfill-20260919/history-fixture-test.mjs
 */

let failures = 0
function check(name, cond) {
  if (cond) {
    console.log(`PASS ${name}`)
  } else {
    failures++
    console.error(`FAIL ${name}`)
  }
}

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

function groupHistoryByDate(rows) {
  const groups = []
  const byDate = new Map()
  for (const row of rows) {
    const raw = (row.date ?? '').trim()
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : parseDdMmYyyy(raw)
    if (!iso) continue
    let group = byDate.get(iso)
    if (!group) {
      group = { date: iso, rows: [] }
      byDate.set(iso, group)
      groups.push(group)
    }
    group.rows.push(row)
  }
  return groups
}

// --- parseDdMmYyyy ---
check('valid 01/09/2026 → 2026-09-01', parseDdMmYyyy('01/09/2026') === '2026-09-01')
check('single-digit day/month 1/9/2026 → 2026-09-01', parseDdMmYyyy('1/9/2026') === '2026-09-01')
check('day-first not month-first: 05/01/2026 → 2026-01-05', parseDdMmYyyy('05/01/2026') === '2026-01-05')
check('invalid calendar date 31/02/2026 → null', parseDdMmYyyy('31/02/2026') === null)
check('month > 12 rejected 01/13/2026 → null', parseDdMmYyyy('01/13/2026') === null)
check('garbage text → null', parseDdMmYyyy('Train with Harry Gouli') === null)
check('empty string → null', parseDdMmYyyy('') === null)
check('US-style YYYY/MM/DD rejected → null', parseDdMmYyyy('2026/09/01') === null)

// --- groupHistoryByDate ---
const r = (date, exercise) => ({ date, exercise, weight: '60kg', reps: '10', sets: '3', rest: '60s' })

// DD/MM/YYYY rows grouped, sheet order preserved
const g1 = groupHistoryByDate([r('01/09/2026', 'Squat'), r('01/09/2026', 'Press'), r('02/09/2026', 'Deadlift')])
check('groups two dates from DD/MM/YYYY', g1.length === 2)
check('first group date is ISO', g1[0].date === '2026-09-01')
check('rows kept in sheet order', g1[0].rows.map((x) => x.exercise).join(',') === 'Squat,Press')
check('second group date', g1[1].date === '2026-09-02')

// Same date split across the sheet merges into one group
const g2 = groupHistoryByDate([r('01/09/2026', 'A'), r('02/09/2026', 'B'), r('01/09/2026', 'C')])
check('split blocks for same date merge', g2.length === 2 && g2[0].rows.length === 2)

// Invalid dates skipped, valid ones still grouped
const g3 = groupHistoryByDate([r('31/02/2026', 'Bad'), r('03/09/2026', 'Good'), r('nope', 'Also bad')])
check('invalid-date rows skipped, valid kept', g3.length === 1 && g3[0].date === '2026-09-03' && g3[0].rows[0].exercise === 'Good')

// Already-ISO dates pass through
const g4 = groupHistoryByDate([r('2026-09-05', 'X')])
check('ISO dates accepted as-is', g4.length === 1 && g4[0].date === '2026-09-05')

// Empty input
check('empty input → no groups', groupHistoryByDate([]).length === 0)

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('\nAll checks passed')
