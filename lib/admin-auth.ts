import 'server-only'

import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

export async function isAdmin() {
  const cookieStore = await cookies()
  return verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET,
  )
}
