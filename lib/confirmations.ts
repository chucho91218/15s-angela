import type { Confirmation, NewConfirmation } from './rsvp.ts'
import type { Store } from './store.ts'

const PREFIX = 'confirmations'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function isConfirmation(value: unknown): value is Confirmation {
  const candidate = value as Confirmation | null
  return (
    typeof candidate?.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    Array.isArray(candidate.guests)
  )
}

// Cada confirmación es un archivo propio: dos invitados a la vez no se pisan.
export async function saveConfirmation(
  store: Store,
  value: NewConfirmation,
  now = new Date(),
): Promise<Confirmation> {
  const confirmation = {
    ...value,
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
  }
  await store.put(`${PREFIX}/${confirmation.id}.json`, confirmation)
  return confirmation
}

export async function listConfirmations(store: Store): Promise<Confirmation[]> {
  const keys = await store.list(PREFIX)
  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        const value = await store.get(key)
        if (isConfirmation(value)) return value
      } catch {
        // Se informa abajo: un archivo dañado no debe dejar sin panel al organizador.
      }
      console.error(`Confirmación ilegible, se omite: ${key}`)
      return null
    }),
  )
  return results
    .filter((value): value is Confirmation => value !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function deleteConfirmation(store: Store, id: string) {
  if (!UUID.test(id)) return false
  await store.del(`${PREFIX}/${id}.json`)
  return true
}
