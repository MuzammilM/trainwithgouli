'use server'

import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { appendDayBlock, type DayRow } from '@/lib/google/sheets'

export type SaveDayResult = { ok: true } | { ok: false; message: string }

type ClientRecord = {
  id: string
  coach: string
  email: string
  sheet_id: string
}

/**
 * Save a workout day to the client's Google Sheet.
 * Coach: hidden clientEmail field must match a clients record they coach.
 * Client role: always their own record by user.email.
 * On success: redirect('/today-coach?saved=1'). On failure: { ok:false, message }.
 * useActionState signature: (prevState, formData).
 */
export async function saveDaySheet(
  _prev: SaveDayResult | null,
  formData: FormData,
): Promise<SaveDayResult> {
  const user = await getAuthUser()
  if (!user) return { ok: false, message: 'You are not signed in.' }

  const pb = await serverClient()

  let client: ClientRecord | null = null
  if (user.role === 'coach') {
    const clientEmail = String(formData.get('clientEmail') ?? '').trim().toLowerCase()
    if (!clientEmail) return { ok: false, message: 'Select a client first.' }
    client = (await pb
      .collection('clients')
      .getFirstListItem(`coach = "${user.id}" && email = "${clientEmail}"`)
      .catch(() => null)) as ClientRecord | null
    if (!client) return { ok: false, message: 'That client is not on your roster.' }
  } else {
    client = (await pb
      .collection('clients')
      .getFirstListItem(`email = "${user.email.trim().toLowerCase()}"`)
      .catch(() => null)) as ClientRecord | null
    if (!client) return { ok: false, message: 'No client record found for your account.' }
  }

  if (!client.sheet_id) {
    return { ok: false, message: 'This client has no Google Sheet linked yet.' }
  }

  const date = String(formData.get('date') ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: 'Pick a valid date.' }
  }

  const exercises = formData.getAll('exercise[]').map((v) => String(v).trim())
  const weights = formData.getAll('weight[]').map((v) => String(v).trim())
  const reps = formData.getAll('reps[]').map((v) => String(v).trim())
  const sets = formData.getAll('sets[]').map((v) => String(v).trim() || '1')
  const notes = formData.getAll('notes[]').map((v) => String(v).trim())

  const rows: DayRow[] = []
  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i]
    const weight = weights[i] ?? ''
    const rep = reps[i] ?? ''
    if (!exercise || !weight || !rep) continue
    rows.push({
      exercise,
      weight,
      reps: rep,
      sets: sets[i] || '1',
      rest: notes[i] || undefined,
    })
  }

  if (rows.length === 0) {
    return { ok: false, message: 'Add at least one exercise with weight and reps.' }
  }

  try {
    await appendDayBlock(client.sheet_id, client.email, date, rows)
  } catch {
    return { ok: false, message: 'Could not write to the Google Sheet. Try again.' }
  }

  redirect('/today-coach?saved=1')
}
