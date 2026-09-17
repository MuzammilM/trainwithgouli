import { NextResponse } from 'next/server'
import { getAuthUser, serverClient, type PbUser } from '@/lib/pocketbase/server'

export type ResolvedClient = { email: string; sheetId: string | null }

/**
 * Resolve the target client record for a sheets API request.
 * Coach: requires ?client=<email> matching a clients record they coach.
 * Client role: always resolves to their own record by user.email.
 * Returns null when the client is unknown.
 */
export async function resolveTargetClient(
  user: PbUser,
  clientParam: string | null,
): Promise<ResolvedClient | null> {
  const pb = await serverClient()
  if (user.role === 'coach') {
    if (!clientParam) return null
    const record = await pb
      .collection('clients')
      .getFirstListItem(`coach = "${user.id}" && email = "${clientParam.trim().toLowerCase()}"`)
      .catch(() => null)
    if (!record) return null
    return { email: record.email, sheetId: (record.sheet_id as string) || null }
  }
  const record = await pb
    .collection('clients')
    .getFirstListItem(`email = "${user.email.trim().toLowerCase()}"`)
    .catch(() => null)
  if (!record) return null
  return { email: record.email, sheetId: (record.sheet_id as string) || null }
}
