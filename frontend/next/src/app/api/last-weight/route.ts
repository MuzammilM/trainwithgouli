import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const exerciseId = searchParams.get('exerciseId')
  if (!exerciseId) return NextResponse.json({ weight: null })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ weight: null })

  const { data } = await supabase
    .from('workout_sets')
    .select('weight, created_at, workout_days!inner(user_id)')
    .eq('exercise_id', exerciseId)
    .eq('workout_days.user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ weight: data?.weight ?? null })
}
