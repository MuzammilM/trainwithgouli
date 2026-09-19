'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { getAuthUser } from '@/lib/pocketbase/server'
import { serverClient } from '@/lib/pocketbase/server'
import { serviceClient } from '@/lib/pocketbase/admin'
import { verifySheetAccess, fetchClientHistory } from '@/lib/google/sheets'
import { groupHistoryByDate, type HistoryRow } from '@/lib/history'

export type AddClientResult =
  | { ok: true; account?: 'created' | 'existing' }
  | { ok: false; code: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALIAS_MAX = 40

// Trim + collapse internal whitespace; hard-cap at 40 (matches users.alias).
function sanitizeAlias(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, ALIAS_MAX)
}

export async function addClient(formData: FormData): Promise<AddClientResult> {
  const user = await getAuthUser()
  if (!user || user.role !== 'coach') {
    return { ok: false, code: 'forbidden' }
  }

  const email = String(formData.get('email') || '').trim().toLowerCase()
  const sheetUrl = String(formData.get('sheet_url') || '').trim()
  const alias = sanitizeAlias(String(formData.get('alias') || ''))

  if (!EMAIL_RE.test(email)) return { ok: false, code: 'invalid-email' }
  if (!sheetUrl) return { ok: false, code: 'invalid-sheet-url' }

  // Hard gate: the service account must be able to open the sheet before we save.
  const access = await verifySheetAccess(sheetUrl)
  if (!access.ok) {
    return { ok: false, code: access.code }
  }

  // Ensure a users record exists for this email so the client can log in
  // (OAuth2 auto-create is unreliable on PocketBase 0.40.4). Uses the service
  // client — a user token cannot enumerate users under the tightened rules.
  // Never blocks the client add: login allowlisting also checks clients records.
  let account: 'created' | 'existing' | undefined
  try {
    const admin = await serviceClient()
    const existing = await admin.collection('users').getFullList({
      filter: `email = "${email}"`,
      fields: 'id',
    })
    if (existing.length > 0) {
      account = 'existing'
      // Coach-set alias on an existing account: only fill it when the user has
      // no alias yet — never overwrite a self-chosen alias.
      if (alias) {
        const target = existing[0]
        try {
          const rec = await admin.collection('users').getOne(target.id, { fields: 'id,alias' })
          if (!String(rec.alias ?? '').trim()) {
            await admin.collection('users').update(target.id, { alias })
          }
        } catch {
          // alias backfill is best-effort; the client add itself must not fail
        }
      }
    } else {
      const password = crypto.randomBytes(10).toString('hex') // 20 chars
      await admin.collection('users').create({
        email,
        role: 'client',
        verified: true,
        password,
        passwordConfirm: password,
        alias, // empty string when the coach left it blank
      })
      account = 'created'
    }
  } catch {
    account = undefined
  }

  const pb = await serverClient()
  await pb.collection('clients').create({
    coach: user.id,
    email,
    sheet_url: sheetUrl,
    sheet_id: access.sheetId,
    sheet_verified: true,
    verified_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  })

  revalidatePath('/clients')
  return { ok: true, account }
}

export async function removeClient(id: string): Promise<void> {
  const user = await getAuthUser()
  if (!user || user.role !== 'coach') throw new Error('Forbidden')

  const pb = await serverClient()
  const client = await pb.collection('clients').getOne(id)
  if (client.coach !== user.id) throw new Error('Forbidden')

  await pb.collection('clients').delete(id)
  revalidatePath('/clients')
}

export type ImportHistoryResult =
  | { ok: true; imported: number; skipped: number; errors: string[] }
  | { ok: false; code: string }

const IMPORT_ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Not allowed.',
  'client-not-found': 'Client record not found.',
  'no-sheet': 'This client has no verified sheet yet.',
  'user-not-found': 'No user account exists for this client email.',
  'service-error': 'Service account unavailable — try again later.',
  'sheet-error': 'Could not read the Google Sheet (access or format error).',
}

function errorMessage(code: string): string {
  return IMPORT_ERROR_MESSAGES[code] ?? `Import failed (${code})`
}

/**
 * Backfill /days history for one client from their Google Sheet (coach-only).
 * Past data only: every imported day is created with done:true entries.
 * Idempotent — a (user, date) that already has a workout_days record is
 * skipped, never overwritten. Fail-soft per date: one bad block does not
 * abort the rest; errors are collected and returned.
 */
export async function importClientHistory(clientId: string): Promise<ImportHistoryResult> {
  const user = await getAuthUser()
  if (!user || user.role !== 'coach') return { ok: false, code: 'forbidden' }

  const pb = await serverClient()
  let client: { coach: string; email: string; sheet_id: string }
  try {
    const rec = await pb.collection('clients').getOne(clientId)
    client = { coach: rec.coach, email: rec.email, sheet_id: rec.sheet_id }
  } catch {
    return { ok: false, code: 'client-not-found' }
  }
  if (client.coach !== user.id) return { ok: false, code: 'forbidden' }
  if (!client.sheet_id) return { ok: false, code: 'no-sheet' }

  // Resolve the client's users-record id via the service client (a user token
  // cannot enumerate other users under the tightened rules).
  let userId: string
  try {
    const admin = await serviceClient()
    const users = await admin.collection('users').getFullList({
      filter: `email = "${client.email}"`,
      fields: 'id',
    })
    if (users.length === 0) return { ok: false, code: 'user-not-found' }
    userId = users[0].id
  } catch {
    return { ok: false, code: 'service-error' }
  }

  let rows: HistoryRow[]
  try {
    rows = await fetchClientHistory(client.sheet_id, client.email)
  } catch {
    return { ok: false, code: 'sheet-error' }
  }

  // Dates already in workout_days for this user (PB date fields serialize as
  // "YYYY-MM-DD HH:MM:SS.000Z" — compare on the first 10 chars).
  const existing = await pb.collection('workout_days').getFullList({
    filter: `user = "${userId}"`,
    fields: 'id,date',
  })
  const existingDates = new Set(existing.map((d) => String(d.date).slice(0, 10)))

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const group of groupHistoryByDate(rows)) {
    if (existingDates.has(group.date)) {
      skipped++
      continue
    }
    try {
      await pb.collection('workout_days').create({
        user: userId,
        date: group.date,
        exercises: group.rows.map((r) => ({
          name: r.exercise,
          weight: r.weight,
          sets: r.sets,
          reps: r.reps,
          rest: r.rest,
          done: true, // past days are history
          coach_notes: r.coach_notes ?? '',
          client_notes: r.client_notes ?? '',
          circuit: null,
        })),
        created_by: user.id,
        sheet_row_start: null,
        sheet_order: group.rows.map((r) => r.exercise),
      })
      imported++
      existingDates.add(group.date)
    } catch {
      errors.push(`${group.date}: could not create the day record`)
    }
  }

  revalidatePath('/clients')
  revalidatePath('/days')
  return { ok: true, imported, skipped, errors }
}
