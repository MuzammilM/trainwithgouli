'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function assertAuthenticated(userId: string | undefined): asserts userId is string {
  if (!userId) throw new Error('Unauthorized')
}

export async function createPlan(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const name = (formData.get('name') as string).trim()
  const isPublic = formData.get('is_public') === 'on'
  const exerciseIds = formData.getAll('exercise_ids[]') as string[]
  const sets = formData.getAll('sets[]') as string[]
  const reps = formData.getAll('reps[]') as string[]
  const restSeconds = formData.getAll('rest_seconds[]') as string[]

  const { data: plan, error } = await supabase
    .from('workout_plans')
    .insert({ name, is_public: isPublic, created_by: user.id })
    .select()
    .single()

  if (error || !plan) throw new Error(error?.message || 'Failed to create plan')

  const planExercises = exerciseIds
    .map((exerciseId, index) => ({
      plan_id: plan.id,
      exercise_id: Number(exerciseId),
      order_index: index,
      sets: Number(sets[index]) || null,
      reps: Number(reps[index]) || null,
      rest_seconds: Number(restSeconds[index]) || null,
    }))
    .filter((pe) => pe.exercise_id)

  if (planExercises.length > 0) {
    const { error: insertError } = await supabase.from('plan_exercises').insert(planExercises)
    if (insertError) throw new Error(insertError.message)
  }

  revalidatePath('/plans')
  redirect('/plans')
}

export async function updatePlan(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const name = (formData.get('name') as string).trim()
  const isPublic = formData.get('is_public') === 'on'
  const exerciseIds = formData.getAll('exercise_ids[]') as string[]
  const sets = formData.getAll('sets[]') as string[]
  const reps = formData.getAll('reps[]') as string[]
  const restSeconds = formData.getAll('rest_seconds[]') as string[]

  const { error } = await supabase
    .from('workout_plans')
    .update({ name, is_public: isPublic })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await supabase.from('plan_exercises').delete().eq('plan_id', id)

  const planExercises = exerciseIds
    .map((exerciseId, index) => ({
      plan_id: Number(id),
      exercise_id: Number(exerciseId),
      order_index: index,
      sets: Number(sets[index]) || null,
      reps: Number(reps[index]) || null,
      rest_seconds: Number(restSeconds[index]) || null,
    }))
    .filter((pe) => pe.exercise_id)

  if (planExercises.length > 0) {
    const { error: insertError } = await supabase.from('plan_exercises').insert(planExercises)
    if (insertError) throw new Error(insertError.message)
  }

  revalidatePath('/plans')
  redirect('/plans')
}

export async function deletePlan(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const { error } = await supabase.from('workout_plans').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/plans')
}
