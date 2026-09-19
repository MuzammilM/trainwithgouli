'use server'

import { revalidatePath } from 'next/cache'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { serviceClient } from '@/lib/pocketbase/admin'
import {
  appendDayBlock,
  clearHistoryCache,
  fetchClientHistory,
  updateClientNoteCell,
  type DayRow,
} from '@/lib/google/sheets'
import {
  carryOverByName,
  normalizeEntries,
  type ExerciseEntry,
} from '@/lib/exercise'

export type ActionResult = { ok: boolean; message?: string }

type WorkoutDay = {
  id: string
  user: string
  date: string
  exercises: unknown
  notes: string | null
  created_by: string
  sheet_row_start: number | null
  sheet_order: string[] | null
}

type ClientRecord = {
  id: string
  coach: string
  email: string
  sheet_id: string
}

function revalidateToday(): void {
  revalidatePath('/today-client')
  revalidatePath('/today-coach')
}

/** Fetch a workout day and verify it belongs to the authed user (owner-only writes). */
async function getOwnDay(dayId: string) {
  const user = await getAuthUser()
  if (!user) return null
  const pb = await serverClient()
  const day = await pb.collection('workout_days').getOne<WorkoutDay>(dayId).catch(() => null)
  if (!day || day.user !== user.id) return null
  return { user, pb, day }
}

/** Toggle an exercise's done flag. Owner only. */
export async function toggleDone(dayId: string, index: number): Promise<void> {
  const ctx = await getOwnDay(dayId)
  if (!ctx) throw new Error('Forbidden')
  const entries = normalizeEntries(ctx.day.exercises)
  if (index < 0 || index >= entries.length) throw new Error('Bad index')
  entries[index] = { ...entries[index], done: !entries[index].done }
  await ctx.pb.collection('workout_days').update(dayId, { exercises: entries })
  revalidateToday()
}

/** Persist a full reordered exercises array (all fields preserved). Owner only. */
export async function reorder(dayId: string, exercises: ExerciseEntry[]): Promise<void> {
  const ctx = await getOwnDay(dayId)
  if (!ctx) throw new Error('Forbidden')
  const entries = normalizeEntries(exercises)
  if (entries.length !== normalizeEntries(ctx.day.exercises).length) {
    throw new Error('Reorder must preserve all exercises')
  }
  await ctx.pb.collection('workout_days').update(dayId, { exercises: entries })
  revalidateToday()
}

/**
 * Save a client note on one exercise. Owner only. Also mirrors the note into
 * the client's Google Sheet (col H) when sheet_row_start + sheet_order exist —
 * fail-soft, never blocks the app write.
 */
export async function saveClientNote(dayId: string, index: number, note: string): Promise<void> {
  const ctx = await getOwnDay(dayId)
  if (!ctx) throw new Error('Forbidden')
  const entries = normalizeEntries(ctx.day.exercises)
  if (index < 0 || index >= entries.length) throw new Error('Bad index')
  entries[index] = { ...entries[index], client_notes: note }
  await ctx.pb.collection('workout_days').update(dayId, { exercises: entries })

  // Sheet mirror — best effort only.
  try {
    if (ctx.day.sheet_row_start && ctx.day.sheet_order && ctx.day.sheet_order.length > 0) {
      const name = entries[index].name
      const orderIndex = ctx.day.sheet_order.indexOf(name)
      if (orderIndex >= 0) {
        const row = ctx.day.sheet_row_start + orderIndex
        const client = await ctx.pb
          .collection('clients')
          .getFirstListItem<ClientRecord>(`email = "${ctx.user.email.trim().toLowerCase()}"`)
          .catch(() => null)
        if (client?.sheet_id) {
          await updateClientNoteCell(client.sheet_id, client.email, row, note)
        }
      }
    }
  } catch {
    // Never block on sheet sync.
  }

  revalidateToday()
}

export type AssignResult = { ok: true; warning?: string } | { ok: false; message: string }

/**
 * Coach assigns a workout: create workout_days + append the day block to the
 * client's sheet. Sheet failure keeps the in-app record (sheet_row_start=null)
 * and returns a warning instead of failing.
 * useActionState signature: (prevState, formData).
 */
export async function assignWorkout(
  _prev: AssignResult | null,
  formData: FormData,
): Promise<AssignResult> {
  const user = await getAuthUser()
  if (!user) return { ok: false, message: 'You are not signed in.' }
  if (user.role !== 'coach') return { ok: false, message: 'Only coaches can assign workouts.' }

  const clientEmail = String(formData.get('clientEmail') ?? '').trim().toLowerCase()
  const date = String(formData.get('date') ?? '').trim()
  if (!clientEmail) return { ok: false, message: 'Select a client.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: 'Pick a valid date.' }

  let raw: unknown
  try {
    raw = JSON.parse(String(formData.get('entries') ?? '[]'))
  } catch {
    return { ok: false, message: 'Could not read the exercise rows.' }
  }
  const parsed = normalizeEntries(raw).filter((e) => e.name.trim() !== '')
  if (parsed.length === 0) return { ok: false, message: 'Add at least one exercise.' }
  const entries: ExerciseEntry[] = parsed.map((e) => ({
    ...e,
    done: false,
    client_notes: '',
    circuit: null,
  }))

  const pb = await serverClient()
  const client = await pb
    .collection('clients')
    .getFirstListItem<ClientRecord>(`coach = "${user.id}" && email = "${clientEmail}"`)
    .catch(() => null)
  if (!client) return { ok: false, message: 'That client is not on your roster.' }
  if (!client.sheet_id) return { ok: false, message: 'This client has no Google Sheet linked yet.' }

  // Resolve the client's users record id via the service client (by email).
  let clientUserId: string | null = null
  try {
    const admin = await serviceClient()
    const u = await admin
      .collection('users')
      .getFirstListItem(`email = "${clientEmail}"`, { fields: 'id' })
    clientUserId = u.id
  } catch {
    return {
      ok: false,
      message: 'Could not resolve that client’s account — no user record found for their email.',
    }
  }
  if (!clientUserId) {
    return {
      ok: false,
      message: 'Could not resolve that client’s account — no user record found for their email.',
    }
  }

  let dayId: string
  try {
    const day = await pb.collection('workout_days').create({
      user: clientUserId,
      date,
      exercises: entries,
      created_by: user.id,
      sheet_order: entries.map((e) => e.name),
    })
    dayId = day.id
  } catch {
    return { ok: false, message: 'Could not save the workout in-app. Try again.' }
  }

  // Sheet sync — failure is non-fatal: keep the record, null the row anchor.
  try {
    const rows: DayRow[] = entries.map((e) => ({
      exercise: e.name,
      weight: e.weight ?? '',
      reps: e.reps,
      sets: e.sets,
      rest: e.rest,
      coach_notes: e.coach_notes,
    }))
    const rowStart = await appendDayBlock(client.sheet_id, client.email, date, rows)
    if (rowStart > 0) {
      await pb.collection('workout_days').update(dayId, { sheet_row_start: rowStart })
    }
  } catch {
    revalidateToday()
    return {
      ok: true,
      warning: 'Saved in-app; sheet sync failed — check SA has Editor access on the client’s sheet.',
    }
  }

  revalidateToday()
  return { ok: true }
}

/**
 * Coach edits an existing assignment: updates the exercises JSON in PB ONLY —
 * the sheet keeps the original copy (app is the live source).
 */
export async function updateAssignment(
  _prev: AssignResult | null,
  formData: FormData,
): Promise<AssignResult> {
  const user = await getAuthUser()
  if (!user) return { ok: false, message: 'You are not signed in.' }
  if (user.role !== 'coach') return { ok: false, message: 'Only coaches can edit assignments.' }

  const dayId = String(formData.get('dayId') ?? '')
  if (!dayId) return { ok: false, message: 'Missing assignment id.' }

  let raw: unknown
  try {
    raw = JSON.parse(String(formData.get('entries') ?? '[]'))
  } catch {
    return { ok: false, message: 'Could not read the exercise rows.' }
  }
  const entries = normalizeEntries(raw).filter((e) => e.name.trim() !== '')
  if (entries.length === 0) return { ok: false, message: 'Add at least one exercise.' }

  const pb = await serverClient()
  try {
    await pb.collection('workout_days').update(dayId, { exercises: entries })
  } catch {
    return { ok: false, message: 'Could not save the workout. Try again.' }
  }

  revalidateToday()
  return { ok: true }
}

/** Coach deletes an assignment (PB delete only — the sheet copy stays). */
export async function deleteAssignment(dayId: string): Promise<void> {
  const user = await getAuthUser()
  if (!user || user.role !== 'coach') throw new Error('Forbidden')
  const pb = await serverClient()
  await pb.collection('workout_days').delete(dayId)
  revalidateToday()
}

/**
 * One-click import: rebuild today's exercises from the client's Google Sheet
 * block (the coach may have edited the sheet directly, drifting the DB).
 * Owner only. Carries over done/client_notes by name match; keeps
 * sheet_row_start, sets sheet_order to the block's names. Fail-soft: a sheet
 * read failure returns an error message instead of throwing.
 */
export async function importSheetBlock(
  dayId: string,
): Promise<{ ok: boolean; message?: string }> {
  const ctx = await getOwnDay(dayId)
  if (!ctx) throw new Error('Forbidden')
  const { user, pb, day } = ctx

  // Resolve the client's clients-record (sheet_id + email) by the user's email.
  const client = await pb
    .collection('clients')
    .getFirstListItem<ClientRecord>(`email = "${user.email.trim().toLowerCase()}"`)
    .catch(() => null)
  if (!client?.sheet_id) {
    return { ok: false, message: 'No Google Sheet linked to your account — nothing to import.' }
  }

  // Fresh read: drop the 5-min cache so direct sheet edits are visible.
  try {
    clearHistoryCache(client.sheet_id)
    const history = await fetchClientHistory(client.sheet_id, client.email)

    // Local-timezone today in ISO (matches the page's localIsoToday).
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`

    const todayRows = history.filter((r) => r.date === today)
    if (todayRows.length === 0) {
      return { ok: false, message: 'No exercises for today found in the sheet.' }
    }

    const fresh: ExerciseEntry[] = todayRows.map((r) => ({
      name: r.exercise,
      weight: r.weight,
      sets: r.sets || '1',
      reps: r.reps,
      rest: r.rest,
      done: false,
      coach_notes: '',
      client_notes: '',
      circuit: null,
    }))
    const carried = carryOverByName(normalizeEntries(day.exercises), fresh)

    await pb.collection('workout_days').update(dayId, {
      exercises: carried,
      sheet_order: fresh.map((e) => e.name),
      // sheet_row_start intentionally kept as-is.
    })
  } catch {
    return { ok: false, message: 'Could not read the Google Sheet — try again.' }
  }

  revalidatePath('/today-client')
  return { ok: true }
}
