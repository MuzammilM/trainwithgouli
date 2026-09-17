import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/pocketbase/server'
import { fetchClientHistory } from '@/lib/google/sheets'
import { resolveTargetClient } from '@/lib/google/resolve-client'

/**
 * GET /api/sheets/last?exercise=Deadlift[&client=<email>]
 * Returns the most recent row (by date) whose exercise matches
 * case-insensitively (trimmed): { found: true, exercise, weight, reps, sets, date }
 * or { found: false }. Same client resolution and cache as /api/sheets/history.
 */
export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const exerciseQuery = (searchParams.get('exercise') || '').trim()
  if (!exerciseQuery) return NextResponse.json({ found: false })

  const client = await resolveTargetClient(user, searchParams.get('client'))
  if (!client) return NextResponse.json({ error: 'unknown-client' }, { status: 400 })
  if (!client.sheetId) return NextResponse.json({ error: 'no-sheet' }, { status: 404 })

  try {
    const rows = await fetchClientHistory(client.sheetId, client.email)
    const needle = exerciseQuery.toLowerCase()
    let best: (typeof rows)[number] | null = null
    for (const row of rows) {
      if (row.exercise.trim().toLowerCase() !== needle) continue
      if (!best || row.date > best.date) best = row
    }
    if (!best) return NextResponse.json({ found: false })
    return NextResponse.json({
      found: true,
      exercise: best.exercise,
      weight: best.weight,
      reps: best.reps,
      sets: best.sets,
      date: best.date,
    })
  } catch {
    return NextResponse.json({ error: 'no-sheet' }, { status: 404 })
  }
}
