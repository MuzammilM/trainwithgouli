#!/usr/bin/env node
/**
 * One-time workout-history backfill for trainwithgouli (task: backfill-workout-history-20260921).
 *
 * Reads backfill-data.json (14 normalized day blocks), then:
 *   --dry-run (default): reads the client's Google Sheet tab + PocketBase workout_days,
 *     reports per-date decisions (WRITE / REPLACE / SKIP). No writes.
 *   --write: SHEETS ONLY by default — appends missing day blocks to the sheet in the
 *     app's house format (banner / DD/MM/YYYY / headers / rows / cool-down, cream+black
 *     formatting, merges), and for dates flagged "replace": true, DELETES the existing
 *     block rows first, then appends the corrected block. PocketBase is NOT touched.
 *   --write --pb: additionally creates workout_days records (done:true) for written
 *     dates that have no existing PB record (replace dates with an existing PB record
 *     are warned about, not touched).
 *
 * Zero npm dependencies — SA JWT auth + Sheets REST + PocketBase REST via node core.
 * Env (sourced from ~/trainwithgouli/frontend.env by the caller):
 *   GOOGLE_SA_KEY_FILE | GOOGLE_SA_KEY, POCKETBASE_SERVICE_EMAIL,
 *   POCKETBASE_SERVICE_PASSWORD, NEXT_PUBLIC_POCKETBASE_URL (optional)
 */
'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const WRITE = process.argv.includes('--write')
const PB_WRITE = process.argv.includes('--pb') // default OFF: sheets-only backfill
const DATA_FILE = path.join(__dirname, 'backfill-data.json')
const BANNER = 'Train with Harry Gouli'
const COOL_DOWN_LINE =
  'Cool downtown • Static stretch • Hold the stretch 10-15sec • Exhale and Inhale comfortably.'
const HEADERS = ['Date', 'Workouts', 'Weights', 'Repetition', 'Sets', 'Rest', 'Coach Notes', 'Client Notes']
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'
const CREAM = { red: 1, green: 0.9, blue: 0.6 }
const BLACK = { red: 0, green: 0, blue: 0 }
const WHITE = { red: 1, green: 1, blue: 1 }

function die(msg, err) {
  console.error(`ERROR: ${msg}`)
  if (err) console.error(String(err).slice(0, 500))
  process.exit(1)
}

async function api(method, url, { token, body, form } = {}) {
  const headers = {}
  if (token) headers.authorization = `Bearer ${token}`
  let payload
  if (form) {
    headers['content-type'] = 'application/x-www-form-urlencoded'
    payload = new URLSearchParams(form).toString()
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(url, { method, headers, body: payload })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* non-json */ }
  if (!res.ok) die(`${method} ${url} → HTTP ${res.status}: ${text.slice(0, 400)}`)
  return json
}

// ---- Google SA auth ------------------------------------------------------
function saCredentials() {
  if (process.env.GOOGLE_SA_KEY) return JSON.parse(process.env.GOOGLE_SA_KEY)
  const keyFile = process.env.GOOGLE_SA_KEY_FILE || `${process.env.HOME}/trainwithgouli/google_sa.json`
  if (fs.existsSync(keyFile)) return JSON.parse(fs.readFileSync(keyFile, 'utf8'))
  die('No GOOGLE_SA_KEY / GOOGLE_SA_KEY_FILE available')
}

async function sheetsToken(scope) {
  const sa = saCredentials()
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })
  ).toString('base64url')
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  const sig = signer.sign(sa.private_key, 'base64url')
  const jwt = `${header}.${payload}.${sig}`
  const res = await api('POST', 'https://oauth2.googleapis.com/token', {
    form: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt },
  })
  return res.access_token
}

// ---- Sheets helpers ------------------------------------------------------
async function resolveTab(token, sheetId, email) {
  const meta = await api('GET', `${SHEETS_API}/${sheetId}`, { token })
  const visible = (meta.sheets || []).filter((s) => s.properties.hidden !== true)
  if (visible.length === 0) die('Spreadsheet has no visible sheets')
  const localPart = email.split('@')[0].trim().toLowerCase()
  const target =
    visible.find((s) => (s.properties.title || '').trim().toLowerCase() === localPart) || visible[0]
  return { title: target.properties.title, numericId: target.properties.sheetId }
}

async function getValues(token, sheetId, range) {
  const res = await api('GET', `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}`, { token })
  return res.values || []
}

/** Dates already present in the sheet (A = DD/MM/YYYY, B empty → date header row). */
function sheetDates(values) {
  const dates = new Set()
  for (const raw of values) {
    const a = (raw[0] ?? '').trim()
    const b = (raw[1] ?? '').trim()
    const m = a.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m && !b) {
      dates.add(`${m[3]}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`)
    }
  }
  return dates
}

/**
 * Locate the full row span of the block whose date header is `targetDdMmYyyy`
 * (banner row above → last row before the next banner / end of data).
 * Returns 1-based inclusive {start, end}, or null when not found.
 */
function findBlockSpan(values, targetDdMmYyyy) {
  const a = values.map((r) => (r[0] ?? '').trim())
  const dateIdx = a.findIndex((v) => v === targetDdMmYyyy)
  if (dateIdx === -1) return null
  let start = dateIdx
  while (start > 0 && a[start - 1] !== BANNER) start--
  // After the loop a[start-1] IS the banner (0-based) → 1-based banner row = start.
  let end = dateIdx
  while (end + 1 < a.length && a[end + 1] !== BANNER && a[end + 1] !== '') end++
  return { start, end: end + 1 } // 1-based inclusive
}

const ddMmYyyy = (iso) => iso.split('-').reverse().join('/')

// ---- PocketBase helpers --------------------------------------------------
function pbBase() {
  return (process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.mzm.co.in').replace(/\/$/, '')
}

async function pbAuth() {
  const email = process.env.POCKETBASE_SERVICE_EMAIL
  const password = process.env.POCKETBASE_SERVICE_PASSWORD
  if (!email || !password) die('POCKETBASE_SERVICE_EMAIL / POCKETBASE_SERVICE_PASSWORD missing')
  const res = await api('POST', `${pbBase()}/api/collections/_superusers/auth-with-password`, {
    body: { identity: email, password },
  })
  return res.token
}

async function pbList(token, collection, params) {
  const qs = new URLSearchParams(params).toString()
  const res = await api('GET', `${pbBase()}/api/collections/${collection}/records?${qs}`, { token })
  return res.items || []
}

async function pbCreate(token, collection, body) {
  return api('POST', `${pbBase()}/api/collections/${collection}/records`, { token, body })
}

// ---- Main ----------------------------------------------------------------
async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  const email = data.email
  console.log(`Mode: ${WRITE ? `WRITE (${PB_WRITE ? 'sheet + pocketbase' : 'SHEET ONLY'})` : 'DRY-RUN'} · target: ${email} · ${data.days.length} day blocks`)

  // PocketBase — always need the clients record (sheet_id). User/day info only
  // when PB_WRITE or dry-run (decision reporting).
  const pbToken = await pbAuth()
  const clients = await pbList(pbToken, 'clients', { filter: `(email='${email}')`, fields: 'coach,email,sheet_id' })
  if (clients.length === 0) die(`No clients record for ${email} — sheet unknown`)
  const client = clients[0]
  if (!client.sheet_id) die('clients record has no sheet_id')
  console.log(`Clients record: sheet_id=${client.sheet_id} coach=${client.coach}`)

  let userId = null
  const existingPbDates = new Set()
  if (!WRITE || PB_WRITE) {
    const users = await pbList(pbToken, 'users', { filter: `(email='${email}')`, fields: 'id,email,role' })
    if (users.length === 0) die(`No users record for ${email}`)
    userId = users[0].id
    console.log(`PocketBase user: ${userId} (role: ${users[0].role})`)
    const days = await pbList(pbToken, 'workout_days', { filter: `(user='${userId}')`, perPage: 500, fields: 'date' })
    for (const d of days) existingPbDates.add(String(d.date).slice(0, 10))
    console.log(`PocketBase already has ${existingPbDates.size} workout day(s) for this user`)
  }

  const scope = WRITE
    ? 'https://www.googleapis.com/auth/spreadsheets'
    : 'https://www.googleapis.com/auth/spreadsheets.readonly'
  const token = await sheetsToken(scope)
  const tab = await resolveTab(token, client.sheet_id, email)
  console.log(`Sheet tab: "${tab.title}" (grid id ${tab.numericId})`)

  const sheetValues = await getValues(token, client.sheet_id, `'${tab.title}'!A1:B10000`)
  const existingSheetDates = sheetDates(sheetValues)
  console.log(`Sheet already has ${existingSheetDates.size} date block(s)`)

  const plan = data.days.map((d) => ({
    date: d.date,
    rows: d.rows,
    replace: d.replace === true,
    sheetSkip: existingSheetDates.has(d.date),
    pbSkip: existingPbDates.has(d.date),
  }))

  console.log('\n--- Per-date decision ---')
  const toWrite = []
  for (const p of plan) {
    let status
    if (p.sheetSkip && p.replace) status = 'REPLACE (existing block will be overwritten)'
    else if (p.sheetSkip) status = 'SKIP (already in sheet)'
    else if (p.pbSkip && PB_WRITE) status = 'SKIP (already in pocketbase)'
    else status = 'WRITE'
    p.status = status
    console.log(`${p.date}  rows=${String(p.rows.length).padStart(2)}  ${status}`)
    if (status === 'WRITE' || status.startsWith('REPLACE')) toWrite.push(p)
  }
  console.log(`\nSummary: ${toWrite.length} to write/replace, ${plan.length - toWrite.length} to skip`)

  if (!WRITE) {
    console.log('\nDry-run only — no writes performed. Re-run with --write to execute.')
    return
  }
  if (toWrite.length === 0) {
    console.log('Nothing to write — all dates already exist. Exiting.')
    return
  }

  // ---- Replace: delete existing block rows (bottom-up so indices stay valid) ----
  const replacements = toWrite.filter((p) => p.sheetSkip && p.replace)
  if (replacements.length > 0) {
    const spans = replacements.map((p) => {
      const span = findBlockSpan(sheetValues, ddMmYyyy(p.date))
      if (!span) die(`Replace requested for ${p.date} but block not found in sheet`)
      return { ...span, date: p.date }
    })
    spans.sort((x, y) => y.start - x.start) // descending
    await api('POST', `${SHEETS_API}/${client.sheet_id}:batchUpdate`, {
      token,
      body: {
        requests: spans.map((s) => ({
          deleteDimension: {
            range: {
              sheetId: tab.numericId,
              dimension: 'ROWS',
              startIndex: s.start - 1, // 0-based, end exclusive
              endIndex: s.end,
            },
          },
        })),
      },
    })
    for (const s of spans) console.log(`Deleted existing block ${s.date} (rows ${s.start}-${s.end})`)
  }

  // ---- Sheet append (single call for all blocks) ----
  const blocks = toWrite.map((p) => ({
    date: p.date,
    rows: p.rows,
    values: [
      [BANNER],
      [ddMmYyyy(p.date)],
      HEADERS,
      ...p.rows.map((r) => [ddMmYyyy(p.date), r.name, r.weight, r.reps, r.sets, r.rest, r.coach_notes, '']),
      [COOL_DOWN_LINE],
    ],
  }))

  const allValues = blocks.flatMap((b) => b.values)
  const appendRes = await api(
    'POST',
    `${SHEETS_API}/${client.sheet_id}/values/${encodeURIComponent(`'${tab.title}'!A1`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { token, body: { values: allValues } }
  )
  const updatedRange = (appendRes.updates || {}).updatedRange || ''
  const m = updatedRange.match(/![A-Z]+(\d+)/)
  if (!m) die(`Could not derive start row from updatedRange: ${updatedRange}`)
  let cursor = Number(m[1])
  console.log(`\nSheet append OK — blocks start at row ${cursor}`)

  const requests = []
  for (const b of blocks) {
    const bannerRow = cursor // 1-based
    b.sheetRowStart = bannerRow + 3 // first exercise row (banner, date, header above)
    const bannerIdx = bannerRow - 1
    const fullRow = (rowIndex) => ({
      sheetId: tab.numericId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1,
      startColumnIndex: 0, endColumnIndex: 8,
    })
    requests.push(
      { mergeCells: { range: fullRow(bannerIdx), mergeType: 'MERGE_ALL' } },
      { mergeCells: { range: fullRow(bannerIdx + 1), mergeType: 'MERGE_ALL' } },
      { mergeCells: { range: fullRow(bannerIdx + b.values.length - 1), mergeType: 'MERGE_ALL' } },
      { repeatCell: { range: fullRow(bannerIdx), cell: { userEnteredFormat: { backgroundColor: BLACK, horizontalAlignment: 'CENTER', textFormat: { foregroundColor: WHITE, bold: true } } }, fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)' } },
      { repeatCell: { range: fullRow(bannerIdx + 1), cell: { userEnteredFormat: { backgroundColor: CREAM, horizontalAlignment: 'CENTER', textFormat: { bold: true } } }, fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat.bold)' } },
      { repeatCell: { range: fullRow(bannerIdx + 2), cell: { userEnteredFormat: { backgroundColor: CREAM, horizontalAlignment: 'CENTER', textFormat: { bold: true } } }, fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat.bold)' } },
      { repeatCell: { range: fullRow(bannerIdx + b.values.length - 1), cell: { userEnteredFormat: { textFormat: { italic: true } } }, fields: 'userEnteredFormat.textFormat.italic' } }
    )
    cursor += b.values.length
  }
  await api('POST', `${SHEETS_API}/${client.sheet_id}:batchUpdate`, { token, body: { requests } })
  console.log(`Formatting applied (${requests.length} requests across ${blocks.length} blocks)`)

  // ---- PocketBase (only with explicit --pb) ----
  if (!PB_WRITE) {
    console.log('\nSheet-only mode — PocketBase NOT touched (per user instruction).')
    console.log('DONE.')
    return
  }
  let created = 0
  for (const b of blocks) {
    if (existingPbDates.has(b.date)) {
      console.log(`PB skip ${b.date}: record already exists — reconcile manually with coach`)
      continue
    }
    await pbCreate(pbToken, 'workout_days', {
      user: userId,
      date: b.date,
      exercises: b.rows.map((r) => ({
        name: r.name, weight: r.weight, sets: r.sets, reps: r.reps, rest: r.rest,
        done: true, coach_notes: r.coach_notes || '', client_notes: '', circuit: null,
      })),
      created_by: client.coach,
      sheet_row_start: b.sheetRowStart,
      sheet_order: b.rows.map((r) => r.name),
    })
    created++
    console.log(`Created workout_days ${b.date} (sheet_row_start=${b.sheetRowStart}, ${b.rows.length} exercises)`)
  }
  console.log(`\nDONE: ${blocks.length} sheet blocks + ${created} workout_days records.`)
}

main().catch((err) => die('Unhandled failure', err))
