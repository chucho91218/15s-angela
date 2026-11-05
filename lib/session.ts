export const SESSION_COOKIE = 'admin_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' }
const TOKEN = /^(\d+)\.([0-9a-f]{64})$/
const encode = (text: string) => new TextEncoder().encode(text)

function importKey(secret: string) {
  return crypto.subtle.importKey('raw', encode(secret), ALGORITHM, false, [
    'sign',
    'verify',
  ])
}

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')

const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16))

export async function createSessionToken(secret: string, now = Date.now()) {
  const expiresAt = now + SESSION_TTL_SECONDS * 1000
  const signature = await crypto.subtle.sign(
    ALGORITHM,
    await importKey(secret),
    encode(`session:${expiresAt}`),
  )
  return `${expiresAt}.${toHex(signature)}`
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
) {
  const match = token?.match(TOKEN)
  if (!match || !secret) return false
  const [, expiresAt, signature] = match
  const valid = await crypto.subtle.verify(
    ALGORITHM,
    await importKey(secret),
    fromHex(signature),
    encode(`session:${expiresAt}`),
  )
  return valid && now <= Number(expiresAt)
}

// Compara firmas para no revelar por el tiempo de respuesta cuánto del PIN coincide.
export async function pinMatches(
  input: string,
  expected: string | undefined,
  secret: string | undefined,
) {
  if (!input || !expected || !secret) return false
  const key = await importKey(secret)
  const signature = await crypto.subtle.sign(ALGORITHM, key, encode(`pin:${expected}`))
  return crypto.subtle.verify(ALGORITHM, key, signature, encode(`pin:${input}`))
}
