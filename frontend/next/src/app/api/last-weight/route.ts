import { NextResponse } from 'next/server'
import { serverClient, getAuthUser } from '@/lib/pocketbase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const exerciseId = searchParams.get('exerciseId')
  if (!exerciseId) return NextResponse.json({ weight: null })

  const user = await getAuthUser()
  if (!user) return NextResponse.json({ weight: null })

  const pb = await serverClient()
  try {
    const set = await pb.collection('workout_sets').getFirstListItem(
      `exercise_id = "${exerciseId}" && workout_day_id.user_id = "${user.id}"`,
      { sort: '-created' },
    )
    return NextResponse.json({ weight: set?.weight ?? null })
  } catch {
    return NextResponse.json({ weight: null })
  }
}
