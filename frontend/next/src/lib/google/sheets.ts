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
