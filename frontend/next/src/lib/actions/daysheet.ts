'use server'

import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { serviceClient } from '@/lib/pocketbase/admin'
import { appendDayBlock, type DayRow } from '@/lib/google/sheets'
import { carryOverByName, normalizeEntries, type ExerciseEntry } from '@/lib/exercise'

export type SaveDayResult = { ok: true } | { ok: false; message: string }

type ClientRecord = {
  id: string
  coach: string
  email: string
  sheet_id: string
}

type WorkoutDay = {
  id: string
  user: string
  date: string
  exercises: unknown
  created_by: string
  sheet_row_start: number | null
  sheet_order: string[] | null
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
  const sets = formData.getAll('sets[]').map((v) => String(v).trim() || '3')
  const notes = formData.getAll('notes[]').map((v) => String(v).trim())

  while (sets.length < exercises.length) sets.push('3')

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
      sets: sets[i] || '3',
      rest: notes[i] || undefined,
    })
  }

  if (rows.length === 0) {
    return { ok: false, message: 'Add at least one exercise with weight and reps.' }
  }

  let rowStart = 0
  try {
    rowStart = await appendDayBlock(client.sheet_id, client.email, date, rows)
  } catch {
    return { ok: false, message: 'Could not write to the Google Sheet. Try again.' }
  }

  // Upsert the workout_days record so /today-client renders the assignment.
  // The sheet write already succeeded — a PB failure must not break the save.
  const clientEmail = client.email.trim().toLowerCase()
  try {
    const admin = await serviceClient()

    // Resolve the client's users-record id by email (log-and-continue if absent).
    let clientUserId: string | null = null
    try {
      const u = await admin
        .collection('users')
        .getFirstListItem(`email = "${clientEmail}"`, { fields: 'id' })
      clientUserId = u.id
    } catch {
      console.warn(
        `[saveDaySheet] no users record for ${clientEmail} — sheet saved, workout_days skipped`,
      )
    }

    if (clientUserId) {
      // Rebuild entries from the saved rows; carry over done/client_notes by name.
      const fresh: ExerciseEntry[] = rows.map((r) => ({
        name: r.exercise,
        weight: r.weight ?? '',
        sets: r.sets,
        reps: r.reps,
        rest: r.rest ?? '',
        done: false,
        coach_notes: r.coach_notes ?? '',
        client_notes: '',
        circuit: null,
      }))

      const [y, m, d] = date.split('-').map(Number)
      const next = new Date(y, (m ?? 1) - 1, d ?? 1)
      next.setDate(next.getDate() + 1)
      const nextDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
      const existing = await admin
        .collection('workout_days')
        .getFirstListItem<WorkoutDay>(
          `user = "${clientUserId}" && date >= "${date} 00:00:00" && date < "${nextDate} 00:00:00"`,
        )
        .catch(() => null)

      const sheetOrder = fresh.map((e) => e.name)
      if (existing) {
        const carried = carryOverByName(normalizeEntries(existing.exercises), fresh)
        await admin.collection('workout_days').update(existing.id, {
          exercises: carried,
          sheet_row_start: rowStart > 0 ? rowStart : existing.sheet_row_start,
          sheet_order: sheetOrder,
        })
      } else {
        await admin.collection('workout_days').create({
          user: clientUserId,
          date,
          exercises: fresh,
          created_by: user.id,
          sheet_row_start: rowStart > 0 ? rowStart : null,
          sheet_order: sheetOrder,
        })
      }
    }
  } catch (err) {
    console.warn('[saveDaySheet] workout_days upsert failed (sheet write kept):', err)
  }

  redirect('/today-coach?saved=1')
}
