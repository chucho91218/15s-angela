import { test } from 'node:test'
import assert from 'node:assert/strict'
import { strFromU8, unzipSync } from 'fflate'
import { buildGuestsWorkbook } from './xlsx.ts'
import { formatDateTime, type FilteredConfirmation } from './rsvp.ts'

const confirmation = (over: Partial<FilteredConfirmation> = {}): FilteredConfirmation => ({
  id: 'a',
  createdAt: '2026-11-02T21:30:00.000Z',
  notes: 'Llegamos tarde',
  totalGuests: 3,
  guests: [
    { name: 'María Ángeles Ruiz', type: 'mayor', dietary: 'Celíaco/a (sin TACC)' },
    { name: 'Sofía Ruiz', type: 'menor', dietary: 'Ninguna' },
  ],
  ...over,
})

function sheet(list: FilteredConfirmation[]) {
  const files = unzipSync(buildGuestsWorkbook(list))
  return strFromU8(files['xl/worksheets/sheet1.xml'])
}

const rowsOf = (xml: string) => xml.match(/<row[ >]/g)?.length ?? 0

test('muestra la fecha en hora de Argentina', () => {
  assert.equal(formatDateTime('2026-11-02T21:30:00.000Z'), '02/11/2026 18:30')
  assert.equal(formatDateTime('2026-11-03T02:05:00.000Z'), '02/11/2026 23:05')
})

test('incluye todas las partes que necesita un archivo de Excel', () => {
  const files = unzipSync(buildGuestsWorkbook([confirmation()]))
  assert.deepEqual(Object.keys(files).sort(), [
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/_rels/workbook.xml.rels',
    'xl/workbook.xml',
    'xl/worksheets/sheet1.xml',
  ])
})

test('genera un encabezado y una fila por persona', () => {
  assert.equal(rowsOf(sheet([confirmation(), confirmation({ id: 'b' })])), 5)
})

test('una lista vacía genera solo el encabezado', () => {
  assert.equal(rowsOf(sheet([])), 1)
})

test('escribe los datos de cada persona con etiquetas legibles', () => {
  const xml = sheet([confirmation()])
  for (const text of [
    'Nombre y apellido',
    '02/11/2026 18:30',
    'María Ángeles Ruiz',
    'Celíaco/a (sin TACC)',
    'Menor (hasta 12 años)',
    'Llegamos tarde',
  ]) {
    assert.ok(xml.includes(text), `falta ${text}`)
  }
})

test('escribe la cantidad total del grupo, aunque el filtro muestre menos', () => {
  assert.match(sheet([confirmation()]), /<c[^>]*><v>3<\/v><\/c>/)
})

test('escapa los caracteres especiales de XML', () => {
  const xml = sheet([
    confirmation({
      notes: 'A & B <b>',
      guests: [{ name: 'Ana <script>', type: 'mayor', dietary: 'Ninguna' }],
    }),
  ])
  assert.ok(xml.includes('A &amp; B &lt;b&gt;'))
  assert.ok(xml.includes('Ana &lt;script&gt;'))
  assert.equal(xml.includes('<script>'), false)
})

test('un nombre que parece fórmula queda como texto', () => {
  const xml = sheet([
    confirmation({
      guests: [{ name: '=HYPERLINK("http://malo")', type: 'mayor', dietary: 'Ninguna' }],
    }),
  ])
  assert.equal(xml.includes('<f>'), false)
  assert.match(xml, /t="inlineStr"[^>]*><is><t[^>]*>=HYPERLINK/)
})

test('quita caracteres que invalidarían el archivo', () => {
  const xml = sheet([confirmation({ notes: 'Hola\u0001\u000bmundo' })])
  assert.ok(xml.includes('Holamundo'))
})
