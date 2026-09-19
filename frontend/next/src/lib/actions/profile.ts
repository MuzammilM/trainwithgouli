'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getAuthUser, serverClient } from '@/lib/pocketbase/server'

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; code: string }

const NAME_MAX = 80
// Only +, digits, spaces, dashes; 8–15 characters.
const MOBILE_RE = /^[+0-9][0-9 +-]*$/

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const user = await getAuthUser()
  if (!user) return { ok: false, code: 'unauthenticated' }

  const name = String(formData.get('name') || '').trim()
  const mobile = String(formData.get('mobile') || '').trim()

  if (!name || name.length > NAME_MAX) return { ok: false, code: 'invalid-name' }
  if (mobile && (mobile.length < 8 || mobile.length > 15 || !MOBILE_RE.test(mobile))) {
    return { ok: false, code: 'invalid-mobile' }
  }

  const pb = await serverClient()
  try {
    // Self-update with the user's own token — allowed by the users update rule.
    await pb.collection('users').update(user.id, { name, mobile: mobile || '' })
  } catch {
    return { ok: false, code: 'save-failed' }
  }

  revalidatePath('/profile')
  redirect('/profile?saved=1')
}
