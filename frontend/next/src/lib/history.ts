/**
 * Pure helpers for importing a client's workout history from their Google
 * Sheet into workout_days. No server-only imports — safe to unit-test.
 */

export type HistoryRow = {
  date: string
  exercise: string
  weight: string
  reps: string
  sets: string
  rest: string
  coach_notes?: string
  client_notes?: string
}

/**
 * Parse DD/MM/YYYY into an ISO date string (YYYY-MM-DD).
 * Day-first parsing; returns null for anything that is not a valid
 * calendar date (bad format, month > 12, 31/02, etc.).
 */
export function parseDdMmYyyy(raw: string): string | null {
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

export type HistoryDayGroup = {
  /** ISO date (YYYY-MM-DD) */
  date: string
  /** Rows in sheet order */
  rows: HistoryRow[]
}

/**
 * Group history rows by date, preserving first-seen (sheet) order.
 * Accepts dates already in ISO form (YYYY-MM-DD, as parseHistory emits) or
 * raw DD/MM/YYYY strings; unparseable dates are skipped entirely.
 */
export function groupHistoryByDate(rows: HistoryRow[]): HistoryDayGroup[] {
  const groups: HistoryDayGroup[] = []
  const byDate = new Map<string, HistoryDayGroup>()

  for (const row of rows) {
    const raw = (row.date ?? '').trim()
    // Already ISO?
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : parseDdMmYyyy(raw)
    if (!iso) continue // unparseable date → skip the row
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
