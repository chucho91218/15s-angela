import { strToU8, zipSync } from 'fflate'
import { formatDateTime, GUEST_TYPE_LABELS, type FilteredConfirmation } from './rsvp.ts'

const HEADERS = [
  'Fecha',
  'Personas del grupo',
  'Nombre y apellido',
  'Tipo',
  'Restricción',
  'Notas',
]
const COLUMN_WIDTHS = [18, 10, 34, 22, 26, 44]

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const SHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const CONTENT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types'

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const columnLetter = (index: number) => String.fromCharCode(65 + index)

// Los textos van como "inlineStr": Excel nunca los interpreta como una fórmula.
function cell(value: string | number, column: number, row: number) {
  const ref = `${columnLetter(column)}${row}`
  if (typeof value === 'number') return `<c r="${ref}"><v>${value}</v></c>`
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
}

function rowXml(values: (string | number)[], row: number) {
  return `<row r="${row}">${values.map((value, column) => cell(value, column, row)).join('')}</row>`
}

export function buildGuestsWorkbook(list: FilteredConfirmation[]): Uint8Array<ArrayBuffer> {
  const rows = list.flatMap((confirmation) =>
    confirmation.guests.map((guest) => [
      formatDateTime(confirmation.createdAt),
      confirmation.totalGuests,
      guest.name,
      GUEST_TYPE_LABELS[guest.type],
      guest.dietary,
      confirmation.notes,
    ]),
  )
  const sheetData = [HEADERS, ...rows]
    .map((values, index) => rowXml(values, index + 1))
    .join('')
  const cols = COLUMN_WIDTHS.map(
    (width, index) =>
      `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
  ).join('')

  return zipSync({
    '[Content_Types].xml': strToU8(
      `${XML_HEADER}<Types xmlns="${CONTENT_NS}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    ),
    '_rels/.rels': strToU8(
      `${XML_HEADER}<Relationships xmlns="${PACKAGE_REL_NS}"><Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    'xl/workbook.xml': strToU8(
      `${XML_HEADER}<workbook xmlns="${SHEET_NS}" xmlns:r="${REL_NS}"><sheets><sheet name="Invitados" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      `${XML_HEADER}<Relationships xmlns="${PACKAGE_REL_NS}"><Relationship Id="rId1" Type="${REL_NS}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    ),
    'xl/worksheets/sheet1.xml': strToU8(
      `${XML_HEADER}<worksheet xmlns="${SHEET_NS}"><cols>${cols}</cols><sheetData>${sheetData}</sheetData></worksheet>`,
    ),
  })
}
