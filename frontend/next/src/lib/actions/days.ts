'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function assertAuthenticated(userId: string | undefined): asserts userId is string {
  if (!userId) throw new Error('Unauthorized')
}

export async function createDay(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const date = formData.get('date') as string
  const notes = (formData.get('notes') as string) || null

  const { data: day, error } = await supabase
    .from('workout_days')
    .insert({ user_id: user.id, date, notes })
    .select()
    .single()

  if (error || !day) throw new Error(error?.message || 'Failed to create day')

  await insertSets(supabase, day.id, formData)

  revalidatePath('/days')
  redirect(`/days/${day.id}`)
}

export async function updateDay(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const date = formData.get('date') as string
  const notes = (formData.get('notes') as string) || null

  const { error } = await supabase.from('workout_days').update({ date, notes }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('workout_sets').delete().eq('workout_day_id', id)
  await insertSets(supabase, Number(id), formData)

  revalidatePath('/days')
  redirect(`/days/${id}`)
}

async function insertSets(supabase: SupabaseClient, dayId: number, formData: FormData): Promise<void> {
  const exerciseIds = formData.getAll('exercise_ids[]') as string[]
  const weights = formData.getAll('weights[]') as string[]
  const reps = formData.getAll('reps[]') as string[]
  const sets = formData.getAll('sets[]') as string[]
  const rowNotes = formData.getAll('notes[]') as string[]

  const rows = exerciseIds
    .map((exerciseId, index) => ({
      workout_day_id: dayId,
      exercise_id: Number(exerciseId),
      weight: Number(weights[index]) || 0,
      reps: Number(reps[index]) || 0,
      sets: Number(sets[index]) || 1,
      notes: rowNotes[index] || null,
    }))
    .filter((row) => row.exercise_id)

  if (rows.length > 0) {
    const { error } = await supabase.from('workout_sets').insert(rows)
    if (error) throw new Error(error.message)
  }
}

export async function deleteDay(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const { error } = await supabase.from('workout_days').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/days')
  redirect('/days')
}
