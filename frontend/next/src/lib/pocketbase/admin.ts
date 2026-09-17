import 'server-only'
import PocketBase from 'pocketbase'

/**
 * Service (superuser) client for privileged server-side operations.
 * Credentials are runtime-only env vars — never NEXT_PUBLIC, never bundled.
 * Throws lazily at call time so builds without the creds still succeed.
 */
export async function serviceClient(): Promise<PocketBase> {
  const email = process.env.POCKETBASE_SERVICE_EMAIL
  const password = process.env.POCKETBASE_SERVICE_PASSWORD
  if (!email || !password) {
    throw new Error('POCKETBASE_SERVICE_EMAIL / POCKETBASE_SERVICE_PASSWORD are not configured')
  }
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.mzm.co.in')
  await pb.collection('_superusers').authWithPassword(email, password)
  return pb
}
