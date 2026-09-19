import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/pocketbase/server'

export const metadata = { title: 'Today' }

/** Role router: coaches get the assignment console, clients the checklist. */
export default async function TodayPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role === 'coach') redirect('/today-coach')
  redirect('/today-client')
}
