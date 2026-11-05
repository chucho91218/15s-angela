import { GuestPanel } from '@/components/admin/guest-panel'
import { LoginForm } from '@/components/admin/login-form'
import { isAdmin } from '@/lib/admin-auth'
import { listConfirmations } from '@/lib/confirmations'
import { formatDateTime, summarize } from '@/lib/rsvp'
import { store } from '@/lib/store'

export default async function AdminPage() {
  if (!(await isAdmin())) return <LoginForm />

  const list = await listConfirmations(store)
  return (
    <GuestPanel
      summary={summarize(list)}
      confirmations={list.map((confirmation) => ({
        ...confirmation,
        // Se calcula acá para que servidor y navegador muestren exactamente lo mismo.
        dateLabel: formatDateTime(confirmation.createdAt),
      }))}
    />
  )
}
