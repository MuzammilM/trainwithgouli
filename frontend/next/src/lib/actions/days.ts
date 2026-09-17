'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'

export async function createDay(formData: FormData): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const date = formData.get('date') as string
  const notes = (formData.get('notes') as string) || null

  const day = await pb.collection('workout_days').create({
    user_id: user.id,
    date,
    notes,
  })

  await insertSets(pb, day.id, formData)

  revalidatePath('/days')
  redirect(`/days/${day.id}`)
}

export async function updateDay(id: string, formData: FormData): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const day = await pb.collection('workout_days').getOne(id)
  const canEdit = user.role === 'coach' || day.user_id === user.id
  if (!canEdit) throw new Error('Forbidden')

  const date = formData.get('date') as string
  const notes = (formData.get('notes') as string) || null

  await pb.collection('workout_days').update(id, { date, notes })

  const existing = await pb.collection('workout_sets').getFullList({
    filter: `workout_day_id = "${id}"`,
  })
  for (const set of existing) {
    await pb.collection('workout_sets').delete(set.id)
  }

  await insertSets(pb, id, formData)

  revalidatePath('/days')
  redirect(`/days/${id}`)
}

type PbClient = Awaited<ReturnType<typeof serverClient>>

async function insertSets(pb: PbClient, dayId: string, formData: FormData): Promise<void> {
  const exerciseIds = formData.getAll('exercise_ids[]') as string[]
  const weights = formData.getAll('weights[]') as string[]
  const reps = formData.getAll('reps[]') as string[]
  const sets = formData.getAll('sets[]') as string[]
  const rowNotes = formData.getAll('notes[]') as string[]

  const rows = exerciseIds
    .map((exerciseId, index) => ({
      workout_day_id: dayId,
      exercise_id: exerciseId,
      weight: Number(weights[index]) || 0,
      reps: Number(reps[index]) || 0,
      sets: Number(sets[index]) || 1,
      notes: rowNotes[index] || null,
    }))
    .filter((row) => row.exercise_id)

  for (const row of rows) {
    await pb.collection('workout_sets').create(row)
  }
}

export async function deleteDay(id: string): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const day = await pb.collection('workout_days').getOne(id)
  const canEdit = user.role === 'coach' || day.user_id === user.id
  if (!canEdit) throw new Error('Forbidden')

  await pb.collection('workout_days').delete(id)

  revalidatePath('/days')
  redirect('/days')
}
