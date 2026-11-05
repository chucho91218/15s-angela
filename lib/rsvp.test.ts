import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  filterConfirmations,
  parseConfirmation,
  summarize,
  type Confirmation,
} from './rsvp.ts'

const guest = (name = 'Ana Pérez') => ({
  name,
  type: 'mayor',
  dietary: 'Ninguna',
})

function assertRejected(input: unknown) {
  const result = parseConfirmation(input)
  assert.equal(result.ok, false)
}

test('acepta una confirmación válida y limpia los espacios', () => {
  assert.deepEqual(
    parseConfirmation({
      guests: [
        { name: '  Ana   Pérez ', type: 'menor', dietary: 'Vegano/a' },
      ],
      notes: '  Llegamos tarde  ',
    }),
    {
      ok: true,
      value: {
        guests: [{ name: 'Ana Pérez', type: 'menor', dietary: 'Vegano/a' }],
        notes: 'Llegamos tarde',
      },
    },
  )
})

test('acepta hasta 10 personas', () => {
  const guests = Array.from({ length: 10 }, () => guest())
  const result = parseConfirmation({ guests, notes: '' })
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.guests.length, 10)
})

test('rechaza 11 personas', () => {
  assertRejected({ guests: Array.from({ length: 11 }, () => guest()), notes: '' })
})

test('rechaza una confirmación sin personas', () => {
  assertRejected({ guests: [], notes: '' })
})

test('rechaza datos que no tienen la forma esperada', () => {
  for (const input of [null, 'hola', 42, [], {}, { guests: 'x' }, { guests: [null] }, { guests: [{ name: 5, type: 'mayor', dietary: 'Ninguna' }] }]) {
    assertRejected(input)
  }
})

test('rechaza un nombre vacío e indica qué persona es', () => {
  const result = parseConfirmation({
    guests: [guest(), guest('   ')],
    notes: '',
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, /2/)
})

test('rechaza un nombre de más de 100 caracteres', () => {
  assertRejected({ guests: [guest('a'.repeat(101))], notes: '' })
})

test('rechaza un tipo de invitación desconocido', () => {
  assertRejected({ guests: [{ ...guest(), type: 'vip' }], notes: '' })
})

test('rechaza una restricción que no está en la lista', () => {
  assertRejected({ guests: [{ ...guest(), dietary: 'Carnívoro' }], notes: '' })
})

test('rechaza notas de más de 500 caracteres', () => {
  assertRejected({ guests: [guest()], notes: 'a'.repeat(501) })
})

test('acepta una confirmación sin notas', () => {
  const result = parseConfirmation({ guests: [guest()] })
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.notes, '')
})

test('descarta campos que no pertenecen a la confirmación', () => {
  const result = parseConfirmation({
    guests: [{ ...guest(), song: 'Quevedo', admin: true }],
    notes: '',
    id: 'inventado',
  })
  assert.deepEqual(result, {
    ok: true,
    value: {
      guests: [{ name: 'Ana Pérez', type: 'mayor', dietary: 'Ninguna' }],
      notes: '',
    },
  })
})

test('quita caracteres de control de los textos', () => {
  const result = parseConfirmation({
    guests: [guest('Ana\u0000 Pérez\u0007')],
    notes: 'Hola\u0000',
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.value.guests[0].name, 'Ana Pérez')
    assert.equal(result.value.notes, 'Hola')
  }
})

const family: Confirmation = {
  id: 'a',
  createdAt: '2026-11-02T21:30:00.000Z',
  notes: 'Llegamos tarde',
  guests: [
    { name: 'María Ángeles Ruiz', type: 'mayor', dietary: 'Alergia a frutos secos' },
    { name: 'Martín Ruiz', type: 'mayor', dietary: 'Celíaco/a (sin TACC)' },
    { name: 'Sofía Ruiz', type: 'menor', dietary: 'Ninguna' },
  ],
}
const alone: Confirmation = {
  id: 'b',
  createdAt: '2026-10-30T15:05:00.000Z',
  notes: '',
  guests: [{ name: 'Carla Gómez', type: 'mayor', dietary: 'Ninguna' }],
}

test('cuenta personas, mayores, menores y restricciones', () => {
  assert.deepEqual(summarize([family, alone]), {
    people: 4,
    adults: 3,
    minors: 1,
    withRestriction: 2,
  })
})

test('el resumen de una lista vacía da todo en cero', () => {
  assert.deepEqual(summarize([]), {
    people: 0,
    adults: 0,
    minors: 0,
    withRestriction: 0,
  })
})

const names = (list: ReturnType<typeof filterConfirmations>) =>
  list.flatMap((c) => c.guests.map((g) => g.name))

test('sin filtros devuelve a todos', () => {
  assert.deepEqual(names(filterConfirmations([family, alone], {})), [
    'María Ángeles Ruiz',
    'Martín Ruiz',
    'Sofía Ruiz',
    'Carla Gómez',
  ])
})

test('filtra por tipo', () => {
  assert.deepEqual(names(filterConfirmations([family, alone], { type: 'menor' })), [
    'Sofía Ruiz',
  ])
})

test('filtra por una restricción puntual', () => {
  assert.deepEqual(
    names(filterConfirmations([family, alone], { dietary: 'Celíaco/a (sin TACC)' })),
    ['Martín Ruiz'],
  )
})

test('filtra por cualquier restricción', () => {
  assert.deepEqual(names(filterConfirmations([family, alone], { dietary: 'any' })), [
    'María Ángeles Ruiz',
    'Martín Ruiz',
  ])
})

test('busca por nombre sin importar acentos ni mayúsculas', () => {
  assert.deepEqual(names(filterConfirmations([family, alone], { q: 'ANGELES' })), [
    'María Ángeles Ruiz',
  ])
  assert.deepEqual(names(filterConfirmations([family, alone], { q: '  gómez ' })), [
    'Carla Gómez',
  ])
})

test('combina los filtros', () => {
  assert.deepEqual(
    names(filterConfirmations([family, alone], { q: 'ruiz', type: 'mayor', dietary: 'any' })),
    ['María Ángeles Ruiz', 'Martín Ruiz'],
  )
})

test('un grupo filtrado conserva sus notas y su cantidad total', () => {
  const [result] = filterConfirmations([family, alone], { type: 'menor' })
  assert.equal(result.id, 'a')
  assert.equal(result.notes, 'Llegamos tarde')
  assert.equal(result.totalGuests, 3)
  assert.equal(result.guests.length, 1)
})

test('quita los grupos sin ninguna coincidencia', () => {
  assert.deepEqual(filterConfirmations([family, alone], { q: 'nadie' }), [])
})
