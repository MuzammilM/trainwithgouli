'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { getAuthUser } from '@/lib/pocketbase/server'
import { serverClient } from '@/lib/pocketbase/server'
import { serviceClient } from '@/lib/pocketbase/admin'
import { verifySheetAccess } from '@/lib/google/sheets'

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
