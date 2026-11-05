import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSessionToken, pinMatches, verifySessionToken } from './session.ts'

const SECRET = 'secreto-de-prueba-con-suficiente-largo'
const NOW = 1_800_000_000_000
const DAY = 24 * 60 * 60 * 1000

test('un token recién creado es válido', async () => {
  const token = await createSessionToken(SECRET, NOW)
  assert.equal(await verifySessionToken(token, SECRET, NOW + 1000), true)
})

test('el token sigue valiendo antes de los 7 días y vence después', async () => {
  const token = await createSessionToken(SECRET, NOW)
  assert.equal(await verifySessionToken(token, SECRET, NOW + 7 * DAY - 1), true)
  assert.equal(await verifySessionToken(token, SECRET, NOW + 7 * DAY + 1), false)
})

test('no se puede extender el vencimiento a mano', async () => {
  const token = await createSessionToken(SECRET, NOW)
  const [, signature] = token.split('.')
  const forged = `${NOW + 365 * DAY}.${signature}`
  assert.equal(await verifySessionToken(forged, SECRET, NOW), false)
})

test('rechaza una firma alterada', async () => {
  const token = await createSessionToken(SECRET, NOW)
  const last = token.at(-1) === '0' ? '1' : '0'
  assert.equal(await verifySessionToken(token.slice(0, -1) + last, SECRET, NOW), false)
})

test('rechaza un token firmado con otro secreto', async () => {
  const token = await createSessionToken('otro-secreto-distinto-al-original', NOW)
  assert.equal(await verifySessionToken(token, SECRET, NOW), false)
})

test('rechaza tokens vacíos o sin formato', async () => {
  for (const token of [undefined, '', 'basura', '.', '123.', '.abc', 'abc.def', `${NOW}.zz`]) {
    assert.equal(await verifySessionToken(token, SECRET, NOW), false, String(token))
  }
})

test('sin secreto configurado ningún token vale', async () => {
  const token = await createSessionToken(SECRET, NOW)
  assert.equal(await verifySessionToken(token, '', NOW), false)
  assert.equal(await verifySessionToken(token, undefined, NOW), false)
})

test('compara el PIN', async () => {
  assert.equal(await pinMatches('483920', '483920', SECRET), true)
  assert.equal(await pinMatches('483921', '483920', SECRET), false)
  assert.equal(await pinMatches('48392', '483920', SECRET), false)
  assert.equal(await pinMatches('4839200', '483920', SECRET), false)
})

test('sin PIN o sin secreto configurado nadie entra', async () => {
  assert.equal(await pinMatches('', '', SECRET), false)
  assert.equal(await pinMatches('', '483920', SECRET), false)
  assert.equal(await pinMatches('483920', undefined, SECRET), false)
  assert.equal(await pinMatches('483920', '483920', undefined), false)
  assert.equal(await pinMatches('483920', '483920', ''), false)
})
