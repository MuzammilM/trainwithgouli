import 'server-only'
import PocketBase from 'pocketbase'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const PB_AUTH_COOKIE = 'pb_auth'

export type PbUser = {
  id: string
  email: string
  name: string
  role: string
}

export async function serverClient(): Promise<PocketBase> {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.mzm.co.in')
  const cookieStore = await cookies()
  const token = cookieStore.get(PB_AUTH_COOKIE)?.value
  if (token) pb.authStore.save(token)
  return pb
}

/**
 * Returns the authenticated user for the current request (memoized per request),
 * or null when there is no valid session cookie.
 */
export const getAuthUser = cache(async (): Promise<PbUser | null> => {
  const pb = await serverClient()
  if (!pb.authStore.isValid) return null
  try {
    await pb.collection('users').authRefresh()
  } catch {
    return null
  }
  const record = pb.authStore.record
  if (!record) return null
  return {
    id: record.id,
    email: record.email,
    name: record.name || record.email,
    role: record.role,
  }
})
