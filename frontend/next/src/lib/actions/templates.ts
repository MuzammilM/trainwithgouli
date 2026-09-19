'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'
import { normalizeEntries, type ExerciseEntry } from '@/lib/exercise'

export type TemplateResult = { ok: true } | { ok: false; message: string }

function parseEntriesFromForm(formData: FormData): ExerciseEntry[] | null {
  let raw: unknown
  try {
    raw = JSON.parse(String(formData.get('entries') ?? '[]'))
  } catch {
    return null
  }
  const entries = normalizeEntries(raw)
    .map((e) => ({ ...e, done: false, client_notes: '', circuit: null }))
    .filter((e) => e.name.trim() !== '')
  return entries.length > 0 ? entries : null
}

/**
 * Create a workout template (coach only — PB rules also enforce coach write).
 * useActionState signature: (prevState, formData).
 */
export async function createTemplate(
  _prev: TemplateResult | null,
  formData: FormData,
): Promise<TemplateResult> {
  const user = await getAuthUser()
  if (!user) return { ok: false, message: 'You are not signed in.' }
  if (user.role !== 'coach') return { ok: false, message: 'Only coaches can create templates.' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { ok: false, message: 'Give the template a name.' }
  const entries = parseEntriesFromForm(formData)
  if (!entries) return { ok: false, message: 'Add at least one exercise.' }

  const pb = await serverClient()
  try {
    await pb.collection('workout_templates').create({
      name,
      exercises: entries,
      created_by: user.id,
    })
  } catch {
    return { ok: false, message: 'Could not save the template. Try again.' }
  }

  revalidatePath('/plan')
  redirect('/plan')
}

export async function updateTemplate(
  _prev: TemplateResult | null,
  formData: FormData,
): Promise<TemplateResult> {
  const user = await getAuthUser()
  if (!user) return { ok: false, message: 'You are not signed in.' }
  if (user.role !== 'coach') return { ok: false, message: 'Only coaches can edit templates.' }

  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, message: 'Missing template id.' }
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { ok: false, message: 'Give the template a name.' }
  const entries = parseEntriesFromForm(formData)
  if (!entries) return { ok: false, message: 'Add at least one exercise.' }

  const pb = await serverClient()
  try {
    await pb.collection('workout_templates').update(id, { name, exercises: entries })
  } catch {
    return { ok: false, message: 'Could not save the template. Try again.' }
  }

  revalidatePath('/plan')
  redirect('/plan')
}

export async function deleteTemplate(id: string): Promise<void> {
  const user = await getAuthUser()
  if (!user || user.role !== 'coach') throw new Error('Forbidden')

  const pb = await serverClient()
  await pb.collection('workout_templates').delete(id)
  revalidatePath('/plan')
}
