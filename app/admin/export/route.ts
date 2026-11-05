import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { listConfirmations } from '@/lib/confirmations'
import { filterConfirmations } from '@/lib/rsvp'
import { store } from '@/lib/store'
import { buildGuestsWorkbook } from '@/lib/xlsx'

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) redirect('/admin')

  const params = request.nextUrl.searchParams
  const list = filterConfirmations(await listConfirmations(store), {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    dietary: params.get('dietary') ?? '',
  })

  return new Response(buildGuestsWorkbook(list), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="invitados-angela.xlsx"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
