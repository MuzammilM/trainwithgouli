import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/pocketbase/server'
import { fetchClientHistory } from '@/lib/google/sheets'
import { resolveTargetClient } from '@/lib/google/resolve-client'

/**
 * GET /api/sheets/history[?client=<email>]
 * Coach: requires ?client=<email> matching a clients record they coach.
 * Client role: always resolves to their own record by user.email.
 * Returns { rows } | 401 | 400 | 404.
 */
export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const client = await resolveTargetClient(user, searchParams.get('client'))
  if (!client) return NextResponse.json({ error: 'unknown-client' }, { status: 400 })
  if (!client.sheetId) return NextResponse.json({ error: 'no-sheet' }, { status: 404 })

  try {
    const rows = await fetchClientHistory(client.sheetId, client.email)
    return NextResponse.json({ rows })
  } catch {
    return NextResponse.json({ error: 'no-sheet' }, { status: 404 })
  }
}
