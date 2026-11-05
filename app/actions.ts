'use server'

import { headers } from 'next/headers'
import { saveConfirmation } from '@/lib/confirmations'
import { clientId, registerAttempt } from '@/lib/rate-limit'
import { parseConfirmation } from '@/lib/rsvp'
import { store } from '@/lib/store'

// Holgado a propósito: muchos celulares comparten una misma dirección pública.
const SUBMIT_LIMIT = { max: 50, windowMs: 60 * 60 * 1000 }

export type SubmitResult = { ok: true } | { ok: false; error: string }

export async function submitConfirmation(input: unknown): Promise<SubmitResult> {
  // Trampa para robots: un invitado nunca ve este campo. Se responde como si
  // hubiera salido bien para que el robot no se entere de que lo detectamos.
  if ((input as { website?: unknown } | null)?.website) return { ok: true }

  const parsed = parseConfirmation(input)
  if (!parsed.ok) return parsed

  try {
    const attempt = await registerAttempt(
      store,
      'rsvp',
      clientId(await headers()),
      SUBMIT_LIMIT,
    )
    if (!attempt.allowed) {
      return {
        ok: false,
        error: 'Recibimos demasiadas confirmaciones seguidas. Probá de nuevo en un rato.',
      }
    }
    await saveConfirmation(store, parsed.value)
    return { ok: true }
  } catch (error) {
    console.error('No se pudo guardar una confirmación', error)
    return {
      ok: false,
      error: 'No pudimos guardar tu confirmación. Intentá de nuevo en unos minutos.',
    }
  }
}
