'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { BODY_PARTS } from '@/lib/body-parts'

function readBodyParts(formData: FormData): string[] {
  const selected = formData
    .getAll('body_part[]')
    .map((v) => String(v).trim().toLowerCase())
    .filter((v) => (BODY_PARTS as readonly string[]).includes(v))
  return Array.from(new Set(selected)).slice(0, 5)
}

export async function createExercise(formData: FormData): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string) || null
  const youtubeUrl = (formData.get('youtube_url') as string) || null
  const bodyPart = readBodyParts(formData)

  await pb.collection('exercises').create({
    name,
    description,
    youtube_url: youtubeUrl,
    body_part: bodyPart,
    created_by: user.id,
  })

  revalidatePath('/exercises')
  redirect('/exercises')
}

export async function updateExercise(id: string, formData: FormData): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const exercise = await pb.collection('exercises').getOne(id)
  const canEdit = user.role === 'coach' || exercise.created_by === user.id
  if (!canEdit) throw new Error('Forbidden')

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string) || null
  const youtubeUrl = (formData.get('youtube_url') as string) || null
  const bodyPart = readBodyParts(formData)

  await pb.collection('exercises').update(id, {
    name,
    description,
    youtube_url: youtubeUrl,
    body_part: bodyPart,
  })

  revalidatePath('/exercises')
  redirect('/exercises')
}

export async function deleteExercise(id: string): Promise<void> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const pb = await serverClient()
  const exercise = await pb.collection('exercises').getOne(id)
  const canEdit = user.role === 'coach' || exercise.created_by === user.id
  if (!canEdit) throw new Error('Forbidden')

  await pb.collection('exercises').delete(id)

  revalidatePath('/exercises')
}
