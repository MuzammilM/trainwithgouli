'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'

export async function createPlan(formData: FormData): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const name = (formData.get('name') as string).trim()
  const isPublic = formData.get('is_public') === 'on'
  const exerciseIds = formData.getAll('exercise_ids[]') as string[]
  const sets = formData.getAll('sets[]') as string[]
  const reps = formData.getAll('reps[]') as string[]
  const restSeconds = formData.getAll('rest_seconds[]') as string[]

  const plan = await pb.collection('workout_plans').create({
    name,
    is_public: isPublic,
    created_by: user.id,
  })

  await insertPlanExercises(pb, plan.id, exerciseIds, sets, reps, restSeconds)

  revalidatePath('/plans')
  redirect('/plans')
}

export async function updatePlan(id: string, formData: FormData): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const plan = await pb.collection('workout_plans').getOne(id)
  const canEdit = user.role === 'coach' || plan.created_by === user.id
  if (!canEdit) throw new Error('Forbidden')

  const name = (formData.get('name') as string).trim()
  const isPublic = formData.get('is_public') === 'on'
  const exerciseIds = formData.getAll('exercise_ids[]') as string[]
  const sets = formData.getAll('sets[]') as string[]
  const reps = formData.getAll('reps[]') as string[]
  const restSeconds = formData.getAll('rest_seconds[]') as string[]

  await pb.collection('workout_plans').update(id, { name, is_public: isPublic })

  const existing = await pb.collection('plan_exercises').getFullList({
    filter: `plan_id = "${id}"`,
  })
  for (const pe of existing) {
    await pb.collection('plan_exercises').delete(pe.id)
  }

  await insertPlanExercises(pb, id, exerciseIds, sets, reps, restSeconds)

  revalidatePath('/plans')
  redirect('/plans')
}

export async function deletePlan(id: string): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const plan = await pb.collection('workout_plans').getOne(id)
  const canEdit = user.role === 'coach' || plan.created_by === user.id
  if (!canEdit) throw new Error('Forbidden')

  await pb.collection('workout_plans').delete(id)

  revalidatePath('/plans')
}

type PbClient = Awaited<ReturnType<typeof serverClient>>

async function insertPlanExercises(
  pb: PbClient,
  planId: string,
  exerciseIds: string[],
  sets: string[],
  reps: string[],
  restSeconds: string[],
): Promise<void> {
  const rows = exerciseIds
    .map((exerciseId, index) => ({
      plan_id: planId,
      exercise_id: exerciseId,
      order_index: index,
      sets: Number(sets[index]) || null,
      reps: Number(reps[index]) || null,
      rest_seconds: Number(restSeconds[index]) || null,
    }))
    .filter((pe) => pe.exercise_id)

  for (const row of rows) {
    await pb.collection('plan_exercises').create(row)
  }
}
