'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getAuthUser, serverClient } from '@/lib/pocketbase/server'

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; code: string }

const NAME_MAX = 80
const ALIAS_MAX = 40
// Only +, digits, spaces, dashes; 8–15 characters.
const MOBILE_RE = /^[+0-9][0-9 +-]*$/

// Trim + collapse internal whitespace; hard-cap at 40 (matches users.alias).
function sanitizeAlias(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, ALIAS_MAX)
}

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const user = await getAuthUser()
  if (!user) return { ok: false, code: 'unauthenticated' }

  const name = String(formData.get('name') || '').trim()
  const mobile = String(formData.get('mobile') || '').trim()
  const alias = sanitizeAlias(String(formData.get('alias') || ''))
  const boardDisplayRaw = String(formData.get('board_display') || '').trim()

  if (!name || name.length > NAME_MAX) return { ok: false, code: 'invalid-name' }
  if (mobile && (mobile.length < 8 || mobile.length > 15 || !MOBILE_RE.test(mobile))) {
    return { ok: false, code: 'invalid-mobile' }
  }

  // board_display is only honored when the user has an alias; without one the
  // board always falls back to the real name path, so store the default.
  const boardDisplay = alias && boardDisplayRaw === 'name' ? 'name' : 'alias'

  const pb = await serverClient()
  try {
    // Self-update with the user's own token — allowed by the users update rule.
    await pb.collection('users').update(user.id, {
      name,
      mobile: mobile || '',
      alias,
      board_display: boardDisplay,
    })
  } catch {
    return { ok: false, code: 'save-failed' }
  }

  revalidatePath('/profile')
  redirect('/profile?saved=1')
}
