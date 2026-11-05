import { test, type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { access, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  deleteConfirmation,
  listConfirmations,
  saveConfirmation,
} from './confirmations.ts'
import { clearAttempts, clientId, registerAttempt } from './rate-limit.ts'
import { createFileStore } from './store.ts'

async function tempRoot(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'rsvp-store-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}

test('guarda y recupera un valor', async (t) => {
  const store = createFileStore(await tempRoot(t))
  await store.put('confirmations/uno.json', { a: 1 })
  assert.deepEqual(await store.get('confirmations/uno.json'), { a: 1 })
})

test('un valor inexistente devuelve null', async (t) => {
  const store = createFileStore(await tempRoot(t))
  assert.equal(await store.get('confirmations/nada.json'), null)
})

test('lista solo las claves del prefijo pedido', async (t) => {
  const store = createFileStore(await tempRoot(t))
  await store.put('confirmations/uno.json', {})
  await store.put('confirmations/dos.json', {})
  await store.put('rate/tres.json', {})
  assert.deepEqual((await store.list('confirmations')).sort(), [
    'confirmations/dos.json',
    'confirmations/uno.json',
  ])
})

test('listar un prefijo sin datos devuelve una lista vacía', async (t) => {
  const store = createFileStore(await tempRoot(t))
  assert.deepEqual(await store.list('confirmations'), [])
})

test('borra un valor y borrar uno inexistente no falla', async (t) => {
  const store = createFileStore(await tempRoot(t))
  await store.put('confirmations/uno.json', {})
  await store.del('confirmations/uno.json')
  await store.del('confirmations/uno.json')
  assert.equal(await store.get('confirmations/uno.json'), null)
})

test('no deja archivos temporales después de guardar', async (t) => {
  const root = await tempRoot(t)
  const store = createFileStore(root)
  await store.put('confirmations/uno.json', {})
  assert.deepEqual(await readdir(join(root, 'confirmations')), ['uno.json'])
})

test('rechaza claves que intentan salir de la carpeta de datos', async (t) => {
  const root = await tempRoot(t)
  const store = createFileStore(join(root, 'data'))
  const outside = join(root, 'secreto.json')
  await writeFile(outside, '{"secreto":true}')

  for (const key of ['../secreto.json', 'a/../../secreto.json', '/etc/passwd', '', 'con espacio.json', 'a\\b.json']) {
    await assert.rejects(store.get(key), `get debería rechazar ${key}`)
    await assert.rejects(store.put(key, {}), `put debería rechazar ${key}`)
    await assert.rejects(store.del(key), `del debería rechazar ${key}`)
  }
  await access(outside)
})

const newConfirmation = {
  guests: [{ name: 'Ana Pérez', type: 'mayor' as const, dietary: 'Ninguna' }],
  notes: '',
}

test('guarda una confirmación con id y fecha del servidor', async (t) => {
  const store = createFileStore(await tempRoot(t))
  const saved = await saveConfirmation(store, newConfirmation, new Date('2026-11-02T21:30:00.000Z'))
  assert.equal(saved.createdAt, '2026-11-02T21:30:00.000Z')
  assert.match(saved.id, /^[0-9a-f-]{36}$/)
  assert.deepEqual(await listConfirmations(store), [saved])
})

test('dos confirmaciones guardadas a la vez no se pisan', async (t) => {
  const store = createFileStore(await tempRoot(t))
  await Promise.all(
    Array.from({ length: 20 }, () => saveConfirmation(store, newConfirmation)),
  )
  assert.equal((await listConfirmations(store)).length, 20)
})

test('lista las confirmaciones de la más nueva a la más vieja', async (t) => {
  const store = createFileStore(await tempRoot(t))
  const vieja = await saveConfirmation(store, newConfirmation, new Date('2026-10-01T00:00:00.000Z'))
  const nueva = await saveConfirmation(store, newConfirmation, new Date('2026-11-01T00:00:00.000Z'))
  assert.deepEqual(
    (await listConfirmations(store)).map((c) => c.id),
    [nueva.id, vieja.id],
  )
})

test('un archivo dañado no impide ver el resto', async (t) => {
  const root = await tempRoot(t)
  const store = createFileStore(root)
  const buena = await saveConfirmation(store, newConfirmation)
  await writeFile(join(root, 'confirmations', 'danado.json'), '{no es json')
  await store.put('confirmations/rara.json', { guests: 'no es una lista' })

  t.mock.method(console, 'error', () => {})
  assert.deepEqual(
    (await listConfirmations(store)).map((c) => c.id),
    [buena.id],
  )
})

test('elimina una confirmación por id', async (t) => {
  const store = createFileStore(await tempRoot(t))
  const saved = await saveConfirmation(store, newConfirmation)
  assert.equal(await deleteConfirmation(store, saved.id), true)
  assert.deepEqual(await listConfirmations(store), [])
})

test('no elimina nada con un id inválido', async (t) => {
  const root = await tempRoot(t)
  const store = createFileStore(root)
  await store.put('rate/importante.json', { a: 1 })
  assert.equal(await deleteConfirmation(store, '../rate/importante'), false)
  assert.deepEqual(await store.get('rate/importante.json'), { a: 1 })
})

const limit = { max: 3, windowMs: 1000 }

test('permite hasta el máximo de intentos y después bloquea', async (t) => {
  const store = createFileStore(await tempRoot(t))
  const results = []
  for (let i = 0; i < 4; i++) {
    results.push(await registerAttempt(store, 'login', '1.1.1.1', limit, 5000))
  }
  assert.deepEqual(results.map((r) => r.allowed), [true, true, true, false])
  assert.equal(results[3].retryAfterMs, 1000)
})

test('los intentos de una dirección no bloquean a otra', async (t) => {
  const store = createFileStore(await tempRoot(t))
  for (let i = 0; i < 4; i++) await registerAttempt(store, 'login', '1.1.1.1', limit, 5000)
  assert.equal((await registerAttempt(store, 'login', '2.2.2.2', limit, 5000)).allowed, true)
})

test('desbloquea cuando pasa la ventana de tiempo', async (t) => {
  const store = createFileStore(await tempRoot(t))
  for (let i = 0; i < 4; i++) await registerAttempt(store, 'login', '1.1.1.1', limit, 5000)
  assert.equal((await registerAttempt(store, 'login', '1.1.1.1', limit, 5999)).allowed, false)
  assert.equal((await registerAttempt(store, 'login', '1.1.1.1', limit, 6000)).allowed, true)
})

test('borrar los intentos vuelve a permitir', async (t) => {
  const store = createFileStore(await tempRoot(t))
  for (let i = 0; i < 4; i++) await registerAttempt(store, 'login', '1.1.1.1', limit, 5000)
  await clearAttempts(store, 'login', '1.1.1.1')
  assert.equal((await registerAttempt(store, 'login', '1.1.1.1', limit, 5000)).allowed, true)
})

test('los intentos no guardan la dirección en texto claro', async (t) => {
  const root = await tempRoot(t)
  const store = createFileStore(root)
  await registerAttempt(store, 'login', '1.1.1.1', limit, 5000)
  const [file] = await readdir(join(root, 'rate', 'login'))
  assert.equal(file.includes('1.1.1.1'), false)
})

test('identifica al cliente por la cabecera de Cloudflare antes que por otras', () => {
  const headers = new Headers({
    'cf-connecting-ip': '9.9.9.9',
    'x-forwarded-for': '1.1.1.1',
  })
  assert.equal(clientId(headers), '9.9.9.9')
})

test('sin Cloudflare usa la primera dirección reenviada', () => {
  assert.equal(clientId(new Headers({ 'x-forwarded-for': ' 1.1.1.1 , 2.2.2.2' })), '1.1.1.1')
})

test('sin cabeceras agrupa a todos bajo un mismo identificador', () => {
  assert.equal(clientId(new Headers()), 'desconocido')
})
