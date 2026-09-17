import PocketBase from 'pocketbase'

export function createClient(): PocketBase {
  return new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.mzm.co.in')
}
