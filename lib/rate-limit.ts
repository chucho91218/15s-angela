import type { Store } from './store.ts'

export type Limit = { max: number; windowMs: number }
type Attempts = { count: number; resetAt: number }

// Se guarda un hash para no dejar direcciones IP en texto claro.
async function keyFor(scope: string, id: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id))
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  return `rate/${scope}/${hash}.json`
}

export async function registerAttempt(
  store: Store,
  scope: string,
  id: string,
  { max, windowMs }: Limit,
  now = Date.now(),
) {
  const key = await keyFor(scope, id)
  const saved = await store.get<Attempts>(key)
  const attempts =
    saved && now < saved.resetAt
      ? { count: saved.count + 1, resetAt: saved.resetAt }
      : { count: 1, resetAt: now + windowMs }
  await store.put(key, attempts)

  const allowed = attempts.count <= max
  return { allowed, retryAfterMs: allowed ? 0 : attempts.resetAt - now }
}

export async function clearAttempts(store: Store, scope: string, id: string) {
  await store.del(await keyFor(scope, id))
}

// En Cloudflare, cf-connecting-ip no puede falsificarse desde afuera.
// DEBT: fuera de Cloudflare, x-forwarded-for sí se puede falsificar. Techo: quien
// lo haga esquiva el límite por dirección. Camino de upgrade: confiar solo en la
// cabecera del proxy real cuando se defina dónde se publica.
export function clientId(headers: Headers) {
  return (
    headers.get('cf-connecting-ip') ??
    (headers.get('x-forwarded-for')?.split(',')[0].trim() || 'desconocido')
  )
}
