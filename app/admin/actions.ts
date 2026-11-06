'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin-auth'
import { deleteConfirmation } from '@/lib/confirmations'
import { clearAttempts, clientId, registerAttempt } from '@/lib/rate-limit'
import {
  createSessionToken,
  pinMatches,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from '@/lib/session'
import { store } from '@/lib/store'

const LOGIN_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 }
const COOKIE_PATH = '/admin'

export type LoginState = { error: string }

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const expectedPin = process.env.ADMIN_PIN
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!expectedPin || !secret) {
    return { error: 'El panel todavía no está configurado.' }
  }

  const id = clientId(await headers())
  const attempt = await registerAttempt(store, 'login', id, LOGIN_LIMIT)
  if (!attempt.allowed) {
    const minutes = Math.ceil(attempt.retryAfterMs / 60000)
    return {
      error: `Demasiados intentos. Probá de nuevo En ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
    }
  }

  const pin = formData.get('pin')
  if (typeof pin !== 'string' || !(await pinMatches(pin, expectedPin, secret))) {
    return { error: 'PIN incorrecto.' }
  }

  await clearAttempts(store, 'login', id)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: SESSION_TTL_SECONDS,
  })
  redirect('/admin')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', { path: COOKIE_PATH, maxAge: 0 })
  redirect('/admin')
}

export async function removeConfirmation(
  id: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isAdmin())) {
    return { ok: false, error: 'Tu sesión venció. Recargá la página y volvé a ingresar.' }
  }
  try {
    if (typeof id !== 'string' || !(await deleteConfirmation(store, id))) {
      return { ok: false, error: 'No encontramos esa confirmación.' }
    }
  } catch (error) {
    console.error('No se pudo eliminar una confirmación', error)
    return { ok: false, error: 'No pudimos eliminarla. Intentá de nuevo.' }
  }
  revalidatePath('/admin')
  return { ok: true }
}
