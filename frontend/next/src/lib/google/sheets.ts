import 'server-only'
import { google } from 'googleapis'

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'

/**
 * Extract the spreadsheet ID from a Google Sheets URL.
 * Handles https://docs.google.com/spreadsheets/d/<id>/... and ?id= / #gid= forms.
 */
export function parseSheetId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const dMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (dMatch) return dMatch[1]
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) return idMatch[1]
  // Bare ID pasted directly
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed
  return null
}

/**
 * Build a JWT-authenticated Sheets client. Lazy so the build never touches
 * the key file — the key is only read at request time.
 */
function getSheetsClient() {
  const keyFile = process.env.GOOGLE_SA_KEY_FILE
  const keyJson = process.env.GOOGLE_SA_KEY
  let auth
  if (keyFile) {
    auth = new google.auth.GoogleAuth({ keyFile, scopes: [SHEETS_SCOPE] })
  } else if (keyJson) {
    const credentials = JSON.parse(keyJson)
    auth = new google.auth.GoogleAuth({ credentials, scopes: [SHEETS_SCOPE] })
  } else {
    throw new Error('missing-sa-config')
  }
  return google.sheets({ version: 'v4', auth })
}

export type HistoryRow = {
  date: string
  exercise: string
  weight: string
  reps: string
  sets: string
  rest: string
}

/**
 * Parse DD/MM/YYYY into an ISO date string (YYYY-MM-DD).
 * Returns null for anything that is not a valid calendar date.
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

/**
 * Parse the fixed house format: a vertical stack of day-blocks in columns A–F
 * (Date | Workouts | Weights | Repetition | Sets | Rest).
 *
 * Per block, top to bottom:
 * 1. Banner row: A = "Train with Harry Gouli" (merged) → ignored
 * 2. Date header row: A = DD/MM/YYYY, B empty → sets current block date
 * 3. Header row: B = "Workouts" → ignored
 * 4. Exercise rows: A = date (repeated), B = name, C–F free text (kept raw)
 * 5. Cool-down row: B starts with "Cool" → ignored
 */
export function parseHistory(values: string[][]): HistoryRow[] {
  const rows: HistoryRow[] = []
  let currentDate: string | null = null

  for (const raw of values) {
    const a = (raw[0] ?? '').trim()
    const b = (raw[1] ?? '').trim()
    const c = (raw[2] ?? '').trim()
    const d = (raw[3] ?? '').trim()
    const e = (raw[4] ?? '').trim()
    const f = (raw[5] ?? '').trim()

    // Date header row: A holds a date, B empty → start new block
    if (a && !b) {
      const iso = parseDdMmYyyy(a)
      if (iso) {
        currentDate = iso
        continue
      }
      // Non-date banner/merged row with empty B → ignore
      continue
    }

    // Column header row ("Workouts" in B) → ignore
    if (b === 'Workouts') continue

    // Cool-down footer row → ignore
    if (b.toLowerCase().startsWith('cool')) continue

    // Exercise row: needs a name and a known current date
    if (!b || !currentDate) continue

    rows.push({
      date: currentDate,
      exercise: b,
      weight: c,
      reps: d,
      sets: e,
      rest: f,
    })
  }

  return rows
}

type HistoryCacheEntry = { rows: HistoryRow[]; at: number }
const HISTORY_TTL_MS = 5 * 60 * 1000
const historyCache = new Map<string, HistoryCacheEntry>()

/**
 * Fetch a client's workout history from their sheet.
 * The tab is named the email local part (e.g. "madebymzm" for madebymzm@gmail.com);
 * falls back to the first visible sheet. Results cached per sheetId for 5 minutes.
 */
export async function fetchClientHistory(sheetId: string, email: string): Promise<HistoryRow[]> {
  const cached = historyCache.get(sheetId)
  if (cached && Date.now() - cached.at < HISTORY_TTL_MS) return cached.rows

  const sheets = getSheetsClient()

  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId })
  const sheetList = meta.data.sheets ?? []
  const visible = sheetList.filter((s) => s.properties?.hidden !== true)
  const localPart = email.split('@')[0].trim().toLowerCase()
  const target =
    visible.find((s) => (s.properties?.title ?? '').trim().toLowerCase() === localPart) ?? visible[0]
  const tabTitle = target?.properties?.title
  if (!tabTitle) return []

  const quoted = `'${tabTitle.replace(/'/g, "''")}'`
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${quoted}!A1:F`,
  })

  const rows = parseHistory((res.data.values ?? []) as string[][])
  historyCache.set(sheetId, { rows, at: Date.now() })
  return rows
}

export type SheetAccessResult =
  | { ok: true; sheetId: string }
  | { ok: false; code: string }

/**
 * Verify the service account can actually read the sheet.
 * Hard gate: addClient must not save unless this returns ok.
 */
export async function verifySheetAccess(sheetUrl: string): Promise<SheetAccessResult> {
  const sheetId = parseSheetId(sheetUrl)
  if (!sheetId) return { ok: false, code: 'invalid-sheet-url' }

  let sheets
  try {
    sheets = getSheetsClient()
  } catch (err) {
    return { ok: false, code: err instanceof Error && err.message === 'missing-sa-config' ? 'missing-sa-config' : 'sa-error' }
  }

  try {
    await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'spreadsheetId',
    })
    return { ok: true, sheetId }
  } catch (err) {
    const code =
      (err as { code?: number | string })?.code != null
        ? String((err as { code?: number | string }).code)
        : 'unknown'
    return { ok: false, code }
  }
}
