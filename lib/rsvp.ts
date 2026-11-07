export const MAX_GUESTS = 10
export const MAX_NAME_LENGTH = 100
export const MAX_NOTES_LENGTH = 500

export const NO_RESTRICTION = 'Ninguna'
export const ANY_RESTRICTION = 'any'
export const DIETARY_OPTIONS = [
  NO_RESTRICTION,
  'Vegetariano/a',
  'Vegano/a',
  'Celíaco/a (sin TACC)',
  'Diabético/a',
  'Sin lactosa',
  'Alergia a frutos secos',
  'Alergia a mariscos',
  'Hipertenso/a (sin sal)',
  'Otra (aclarar en notas)',
]

export const GUEST_TYPE_LABELS = {
  mayor: 'Mayor',
  menor: 'Menor (hasta 12 años)',
} as const

// Nueva constante para Cena o Brindis
export const ASSISTANCE_TYPE_LABELS = {
  cena: 'Cena (21:30 hs)',
  brindis: 'Brindis (01:30 hs)',
} as const

export type GuestType = keyof typeof GUEST_TYPE_LABELS
export type AssistanceType = keyof typeof ASSISTANCE_TYPE_LABELS // Nuevo tipo

// Agregamos assistance a Guest
export type Guest = { name: string; type: GuestType; dietary: string; assistance: AssistanceType }
export type NewConfirmation = { guests: Guest[]; notes: string }
export type Confirmation = NewConfirmation & { id: string; createdAt: string }
export type FilteredConfirmation = Confirmation & { totalGuests: number }
// Agregamos assistance a los filtros
export type Filters = { q?: string; type?: string; dietary?: string; assistance?: string }

type ParseResult =
  | { ok: true; value: NewConfirmation }
  | { ok: false; error: string }

const INVALID_DATA = 'No pudimos leer los datos. Revisalos e intentá de nuevo.'

function cleanName(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanNotes(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isGuestType(value: unknown): value is GuestType {
  return value === 'mayor' || value === 'menor'
}

function isAssistanceType(value: unknown): value is AssistanceType {
  return value === 'cena' || value === 'brindis'
}

// Frontera de confianza: todo lo que llega del formulario público pasa por acá.
export function parseConfirmation(input: unknown): ParseResult {
  if (!isRecord(input) || !Array.isArray(input.guests)) {
    return { ok: false, error: INVALID_DATA }
  }
  if (input.guests.length < 1 || input.guests.length > MAX_GUESTS) {
    return { ok: false, error: `Podés confirmar de 1 a ${MAX_GUESTS} personas.` }
  }

  const guests: Guest[] = []
  for (const [index, raw] of input.guests.entries()) {
    const person = index + 1
    if (!isRecord(raw) || typeof raw.name !== 'string') {
      return { ok: false, error: INVALID_DATA }
    }
    const name = cleanName(raw.name)
    if (!name) {
      return { ok: false, error: `Falta el nombre de la persona ${person}.` }
    }
    if (name.length > MAX_NAME_LENGTH) {
      return {
        ok: false,
        error: `El nombre de la persona ${person} es demasiado largo.`,
      }
    }
    if (!isGuestType(raw.type)) {
      return { ok: false, error: `Elegí el tipo de invitación de la persona ${person}.` }
    }
    if (!isAssistanceType(raw.assistance)) {
        return { ok: false, error: `Elegí la asistencia (Cena o Brindis) de la persona ${person}.` }
    }
    if (typeof raw.dietary !== 'string' || !DIETARY_OPTIONS.includes(raw.dietary)) {
      return { ok: false, error: `Elegí la restricción de la persona ${person}.` }
    }
    guests.push({ name, type: raw.type, dietary: raw.dietary, assistance: raw.assistance })
  }

  if (input.notes !== undefined && typeof input.notes !== 'string') {
    return { ok: false, error: INVALID_DATA }
  }
  const notes = cleanNotes(input.notes ?? '')
  if (notes.length > MAX_NOTES_LENGTH) {
    return {
      ok: false,
      error: `Las notas pueden tener hasta ${MAX_NOTES_LENGTH} caracteres.`,
    }
  }

  return { ok: true, value: { guests, notes } }
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Cordoba',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatDateTime(iso: string) {
  const parts = Object.fromEntries(
    DATE_FORMAT.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  )
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}

export function summarize(list: Confirmation[]) {
  const guests = list.flatMap((confirmation) => confirmation.guests)
  return {
    people: guests.length,
    adults: guests.filter((guest) => guest.type === 'mayor').length,
    minors: guests.filter((guest) => guest.type === 'menor').length,
    withRestriction: guests.filter((guest) => guest.dietary !== NO_RESTRICTION).length,
    // Agregamos contadores para el resumen si se necesitan
    dinner: guests.filter((guest) => guest.assistance === 'cena').length,
    toast: guests.filter((guest) => guest.assistance === 'brindis').length,
  }
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function matchesDietary(guest: Guest, dietary: string | undefined) {
  if (!dietary) return true
  if (dietary === ANY_RESTRICTION) return guest.dietary !== NO_RESTRICTION
  return guest.dietary === dietary
}

export function filterConfirmations<T extends Confirmation>(
  list: T[],
  { q = '', type = '', dietary = '', assistance = '' }: Filters,
): (T & { totalGuests: number })[] {
  const search = normalizeSearch(q)
  return list.flatMap((confirmation) => {
    const guests = confirmation.guests.filter(
      (guest) =>
        (!type || guest.type === type) &&
        (!assistance || guest.assistance === assistance) &&
        matchesDietary(guest, dietary) &&
        (!search || normalizeSearch(guest.name).includes(search)),
    )
    return guests.length
      ? [{ ...confirmation, guests, totalGuests: confirmation.guests.length }]
      : []
  })
}