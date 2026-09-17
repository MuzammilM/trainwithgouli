'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PocketBase from 'pocketbase'
import { serviceClient } from '@/lib/pocketbase/admin'
import { PB_AUTH_COOKIE } from '@/lib/pocketbase/server'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // ~30 days

/**
 * Validates an OAuth token produced by the client-side Google sign-in and,
 * if the user passes the invite allowlist, sets the httpOnly session cookie.
 * Allowlist: role === 'coach' OR email exists in the `clients` collection.
 */
export async function setSession(token: string): Promise<void> {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.mzm.co.in')
  pb.authStore.save(token)

  let allowed = false
  try {
    await pb.collection('users').authRefresh()
    const record = pb.authStore.record
    if (record) {
      if (record.role === 'coach') {
        allowed = true
      } else {
        const admin = await serviceClient()
        const clients = await admin.collection('clients').getFullList({
          filter: `email = "${record.email}"`,
          limit: 1,
        })
        allowed = clients.length > 0
      }
    }
  } catch {
    allowed = false
  }

  const cookieStore = await cookies()
  if (!allowed) {
    cookieStore.delete(PB_AUTH_COOKIE)
    redirect('/login?error=not-registered')
  }

  cookieStore.set(PB_AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
  redirect('/')
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(PB_AUTH_COOKIE)
  redirect('/login')
}
