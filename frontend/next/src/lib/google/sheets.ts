import 'server-only'
import { google } from 'googleapis'
import { parseDdMmYyyy, type HistoryRow } from '@/lib/history'

// Re-exported for existing callers; the implementations live in lib/history.ts
// (pure, unit-testable, no googleapis dependency).
export { parseDdMmYyyy } from '@/lib/history'
export type { HistoryRow } from '@/lib/history'

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const SHEETS_SCOPE_READWRITE = 'https://www.googleapis.com/auth/spreadsheets'

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
 * Pass writable=true for read/write scope (appends, formatting).
 */
function getSheetsClient(writable = false) {
  const keyFile = process.env.GOOGLE_SA_KEY_FILE
  const keyJson = process.env.GOOGLE_SA_KEY
  const scopes = [writable ? SHEETS_SCOPE_READWRITE : SHEETS_SCOPE]
  let auth
  if (keyFile) {
    auth = new google.auth.GoogleAuth({ keyFile, scopes })
  } else if (keyJson) {
    const credentials = JSON.parse(keyJson)
    auth = new google.auth.GoogleAuth({ credentials, scopes })
  } else {
    throw new Error('missing-sa-config')
  }
  return google.sheets({ version: 'v4', auth })
}

/**
 * Parse a free-text weight cell into a numeric kg value for the leaderboard.
 * Conservative: returns null unless the cell is a clean number or range with
 * an optional "kg" unit.
 *
 * Excluded (null): empty cells, anything mentioning bar/BW/bodyweight/AMRAP,
 * time or distance units (sec, steps, standalone "m"), and bare numbers
 * without a kg unit.
 *
 * Accepted: "60kg" → 60, "12.5kg" → 12.5, "12.5-15 kg" → 15 (range max).
 */
export function parseWeightKg(raw: string): number | null {
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
    // standalone "m" (meters) — attached ("12.5m") or separated ("12.5 m")
    /\bm\b/.test(lower) ||
    /\d\s*m\b/.test(lower)
  ) {
    return null
  }

  // Range "a-b kg" (optional single kg after the second number) → max
  const range = lower.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*kg$/)
  if (range) return Math.max(Number(range[1]), Number(range[2]))

  // Single "N kg" (unit optional per match, but required for acceptance)
  const kgMatches = [...s.matchAll(/(\d+(?:\.\d+)?)\s*kg/gi)]
  if (kgMatches.length === 1) return Number(kgMatches[0][1])

  return null
}

/**
 * Parse the fixed house format: a vertical stack of day-blocks in columns A–H
 * (Date | Workouts | Weights | Repetition | Sets | Rest | Coach Notes | Client Notes).
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
    const g = (raw[6] ?? '').trim()
    const h = (raw[7] ?? '').trim()

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
      ...(g ? { coach_notes: g } : {}),
      ...(h ? { client_notes: h } : {}),
    })
  }

  return rows
}

type HistoryCacheEntry = { rows: HistoryRow[]; at: number }
const HISTORY_TTL_MS = 5 * 60 * 1000
const historyCache = new Map<string, HistoryCacheEntry>()

/**
 * Drop the cached history for a sheet. Must be called after any write
 * (appendDayBlock) so the 5-minute cache never serves stale rows.
 */
export function clearHistoryCache(sheetId: string): void {
  historyCache.delete(sheetId)
}

/**
 * Resolve the tab title for a client's sheet: the email local part
 * (e.g. "madebymzm" for madebymzm@gmail.com), falling back to the first
 * visible sheet. Returns null when the spreadsheet has no visible sheets.
 */
async function resolveTabTitle(sheetId: string, email: string): Promise<string | null> {
  const sheets = getSheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId })
  const sheetList = meta.data.sheets ?? []
  const visible = sheetList.filter((s) => s.properties?.hidden !== true)
  const localPart = email.split('@')[0].trim().toLowerCase()
  const target =
    visible.find((s) => (s.properties?.title ?? '').trim().toLowerCase() === localPart) ?? visible[0]
  return target?.properties?.title ?? null
}

/**
 * Fetch a client's workout history from their sheet.
 * The tab is named the email local part (e.g. "madebymzm" for madebymzm@gmail.com);
 * falls back to the first visible sheet. Results cached per sheetId for 5 minutes.
 */
export async function fetchClientHistory(sheetId: string, email: string): Promise<HistoryRow[]> {
  const cached = historyCache.get(sheetId)
  if (cached && Date.now() - cached.at < HISTORY_TTL_MS) return cached.rows

  const tabTitle = await resolveTabTitle(sheetId, email)
  if (!tabTitle) return []

  const sheets = getSheetsClient()
  const quoted = `'${tabTitle.replace(/'/g, "''")}'`
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${quoted}!A1:F`,
  })

  const rows = parseHistory((res.data.values ?? []) as string[][])
  historyCache.set(sheetId, { rows, at: Date.now() })
  return rows
}

/** Format an ISO date (YYYY-MM-DD) as DD/MM/YYYY for the sheet house format. */
export function ddMmYyyy(dateISO: string): string {
  const [y, m, d] = dateISO.split('-')
  if (!y || !m || !d) return dateISO
  return `${d}/${m}/${y}`
}

export type DayRow = {
  exercise: string
  weight: string
  reps: string
  sets: string
  rest?: string
  coach_notes?: string
}

const COOL_DOWN_LINE =
  'Cool downtown • Static stretch • Hold the stretch 10-15sec • Exhale and Inhale comfortably.'

/**
 * Append a workout day-block to the client's sheet in the 8-column house format:
 * banner → DD/MM/YYYY date row → column headers (Date|Workouts|Weights|
 * Repetition|Sets|Rest|Coach Notes|Client Notes) → exercise rows (date repeated,
 * coach notes in col G, empty col H) → cool-down footer. Then applies minimal
 * formatting (bold banner with black background + white text, cream bold date
 * and header rows, italic cool-down) via one batchUpdate, all merged A:H.
 * Clears the history cache so subsequent reads see the new rows.
 *
 * Returns the 1-based row number of the FIRST exercise row of the appended
 * block (banner=1, date=2, header=3 → first exercise = banner row + 3), so
 * callers can store it in workout_days.sheet_row_start.
 */
export async function appendDayBlock(
  sheetId: string,
  email: string,
  dateISO: string,
  rows: DayRow[],
): Promise<number> {
  const tabTitle = await resolveTabTitle(sheetId, email)
  if (!tabTitle) throw new Error('no-tab')

  const sheets = getSheetsClient(true)
  const quoted = `'${tabTitle.replace(/'/g, "''")}'`

  const values = [
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

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${quoted}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  })

  // Derive the first appended row (the banner) from the updated range (e.g. 'Tab'!A12:H18)
  const updatedRange = appendRes.data.updates?.updatedRange ?? ''
  const rowMatch = updatedRange.match(/![A-Z]+(\d+)/)
  const bannerRow = rowMatch ? Number(rowMatch[1]) : null
  // First exercise row: banner=1, date=2, header=3 → 4 (+ block offset)
  const firstExerciseRow = bannerRow != null ? bannerRow + 3 : null

  if (bannerRow != null) {
    const bannerRowIndex = bannerRow - 1 // 0-based grid coordinates
    const dateRowIndex = bannerRowIndex + 1
    const coolDownRowIndex = bannerRowIndex + values.length - 1
    const sheetIdNumeric = await resolveNumericSheetId(sheetId, tabTitle)

    const headerRowIndex = bannerRowIndex + 2
    const CREAM = { red: 1, green: 0.9, blue: 0.6 } // #ffe599 house cream
    const BLACK = { red: 0, green: 0, blue: 0 }
    const WHITE = { red: 1, green: 1, blue: 1 }
    const fullRow = (rowIndex: number) => ({
      sheetId: sheetIdNumeric,
      startRowIndex: rowIndex,
      endRowIndex: rowIndex + 1,
      startColumnIndex: 0,
      endColumnIndex: 8,
    })

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          // Merge banner, date, and cool-down rows across A:H
          { mergeCells: { range: fullRow(bannerRowIndex), mergeType: 'MERGE_ALL' } },
          { mergeCells: { range: fullRow(dateRowIndex), mergeType: 'MERGE_ALL' } },
          { mergeCells: { range: fullRow(coolDownRowIndex), mergeType: 'MERGE_ALL' } },
          // Banner: black bg, white bold, centered
          {
            repeatCell: {
              range: fullRow(bannerRowIndex),
              cell: { userEnteredFormat: { backgroundColor: BLACK, horizontalAlignment: 'CENTER', textFormat: { foregroundColor: WHITE, bold: true } } },
              fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)',
            },
          },
          // Date row: cream bg, bold, centered
          {
            repeatCell: {
              range: fullRow(dateRowIndex),
              cell: { userEnteredFormat: { backgroundColor: CREAM, horizontalAlignment: 'CENTER', textFormat: { bold: true } } },
              fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat.bold)',
            },
          },
          // Header row: cream bg, bold, centered
          {
            repeatCell: {
              range: fullRow(headerRowIndex),
              cell: { userEnteredFormat: { backgroundColor: CREAM, horizontalAlignment: 'CENTER', textFormat: { bold: true } } },
              fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat.bold)',
            },
          },
          // Cool-down: italic
          {
            repeatCell: {
              range: fullRow(coolDownRowIndex),
              cell: { userEnteredFormat: { textFormat: { italic: true } } },
              fields: 'userEnteredFormat.textFormat.italic',
            },
          },
        ],
      },
    })
  }

  clearHistoryCache(sheetId)
  return firstExerciseRow ?? 0
}

/**
 * Write a single cell (column H = Client Notes) on the resolved tab.
 * Fail-soft: never throws — a sheet sync failure must never block the app.
 */
export async function updateClientNoteCell(
  sheetId: string,
  email: string,
  row: number,
  text: string,
): Promise<void> {
  try {
    const tabTitle = await resolveTabTitle(sheetId, email)
    if (!tabTitle || !Number.isFinite(row) || row < 1) return
    const sheets = getSheetsClient(true)
    const quoted = `'${tabTitle.replace(/'/g, "''")}'`
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${quoted}!H${row}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[text]] },
    })
  } catch {
    // Fail-soft by contract.
  }
}

/** Resolve the numeric sheetId (grid id) for a tab title. */
async function resolveNumericSheetId(spreadsheetId: string, tabTitle: string): Promise<number> {
  const sheets = getSheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const sheet = (meta.data.sheets ?? []).find(
    (s) => (s.properties?.title ?? '').trim().toLowerCase() === tabTitle.trim().toLowerCase(),
  )
  return sheet?.properties?.sheetId ?? 0
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
