'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function assertAuthenticated(userId: string | undefined): asserts userId is string {
  if (!userId) throw new Error('Unauthorized')
}

export async function createExercise(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string) || null
  const youtubeUrl = (formData.get('youtube_url') as string) || null

  const { error } = await supabase
    .from('exercises')
    .insert({ name, description, youtube_url: youtubeUrl, created_by: user.id })

  if (error) throw new Error(error.message)

  revalidatePath('/exercises')
  redirect('/exercises')
}

export async function updateExercise(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string) || null
  const youtubeUrl = (formData.get('youtube_url') as string) || null

  const { error } = await supabase
    .from('exercises')
    .update({ name, description, youtube_url: youtubeUrl })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/exercises')
  redirect('/exercises')
}

export async function deleteExercise(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertAuthenticated(user?.id)

  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/exercises')
}
