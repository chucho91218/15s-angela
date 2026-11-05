'use client'

import { useMemo, useState, useTransition } from 'react'
import { logout, removeConfirmation } from '@/app/admin/actions'
import {
  ANY_RESTRICTION,
  DIETARY_OPTIONS,
  filterConfirmations,
  NO_RESTRICTION,
  type Confirmation,
  type Guest,
  type GuestType,
} from '@/lib/rsvp'

type PanelConfirmation = Confirmation & { dateLabel: string }
type VisibleConfirmation = PanelConfirmation & { totalGuests: number }

const NO_FILTERS = { q: '', type: '', dietary: '' }
const SHORT_TYPE: Record<GuestType, string> = { mayor: 'Mayor', menor: 'Menor' }

const CONTROL_STYLES =
  'min-h-11 w-full rounded-lg border-2 border-[#14110f] bg-[#fffdf8] px-3 text-base text-[#14110f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14110f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5efe3]'
const BUTTON_STYLES =
  'inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-[#14110f] bg-transparent px-3 text-[15px] font-semibold text-[#14110f] transition-colors hover:bg-[#e7ddc9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14110f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5efe3] disabled:opacity-60'

const peopleLabel = (count: number) => `${count} ${count === 1 ? 'persona' : 'personas'}`

function GuestType({ guest }: { guest: Guest }) {
  return guest.type === 'menor' ? (
    <strong className="font-bold">{SHORT_TYPE.menor}</strong>
  ) : (
    <>{SHORT_TYPE.mayor}</>
  )
}

// La negrita distingue a quien tiene una restricción sin depender del color.
function GuestDietary({ guest }: { guest: Guest }) {
  return guest.dietary === NO_RESTRICTION ? (
    <span className="text-[#4a443c]">{guest.dietary}</span>
  ) : (
    <strong className="font-bold">{guest.dietary}</strong>
  )
}

function DeleteButton({
  confirmation,
  onError,
}: {
  confirmation: VisibleConfirmation
  onError: (message: string) => void
}) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    const question = `¿Eliminar toda esta confirmación (${peopleLabel(confirmation.totalGuests)})? No se puede deshacer.`
    if (!window.confirm(question)) return
    onError('')
    startTransition(async () => {
      try {
        const result = await removeConfirmation(confirmation.id)
        if (!result.ok) onError(result.error)
      } catch {
        onError('No pudimos eliminarla. Revisá tu conexión e intentá de nuevo.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Eliminar la confirmación de ${confirmation.guests[0].name}`}
      className={`${BUTTON_STYLES} shrink-0`}
    >
      {pending ? 'Eliminando…' : 'Eliminar'}
    </button>
  )
}

function groupDetail(confirmation: VisibleConfirmation) {
  const shown = confirmation.guests.length
  return shown < confirmation.totalGuests ? `coincide${shown === 1 ? '' : 'n'} ${shown}` : ''
}

// En el celular cada grupo es una franja con sus personas abajo: nada queda oculto
// ni obliga a deslizar de costado.
function PhoneTable({
  list,
  onError,
}: {
  list: VisibleConfirmation[]
  onError: (message: string) => void
}) {
  return (
    <table className="w-full table-fixed border-collapse text-[15px] leading-snug xl:hidden">
      <colgroup>
        <col />
        <col className="w-[66px]" />
        <col className="w-[38%]" />
      </colgroup>
      <thead className="bg-[#e7ddc9]">
        <tr>
          {['Nombre', 'Tipo', 'Restricción'].map((title) => (
            <th key={title} scope="col" className="px-2 py-2.5 text-left text-[13px] font-bold">
              {title}
            </th>
          ))}
        </tr>
      </thead>
      {list.map((confirmation) => {
        const detail = groupDetail(confirmation)
        return (
          <tbody key={confirmation.id}>
            <tr>
              <th
                scope="rowgroup"
                colSpan={3}
                className="border-t-2 border-[#14110f] bg-[#efe6d4] px-2 py-1.5 text-left font-normal"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px]">
                    <strong className="font-bold">{peopleLabel(confirmation.totalGuests)}</strong>
                    {detail && ` (${detail})`}
                    <br />
                    {confirmation.dateLabel}
                  </span>
                  <DeleteButton confirmation={confirmation} onError={onError} />
                </div>
              </th>
            </tr>
            {confirmation.guests.map((guest, index) => (
              <tr key={index} className="border-t border-[#b9ad97] align-top">
                <td data-guest-name className="break-words px-2 py-2.5">
                  {guest.name}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5">
                  <GuestType guest={guest} />
                </td>
                <td className="break-words px-2 py-2.5">
                  <GuestDietary guest={guest} />
                </td>
              </tr>
            ))}
            {confirmation.notes && (
              <tr className="border-t border-[#b9ad97]">
                <td colSpan={3} className="whitespace-pre-line break-words px-2 py-2.5 text-[14px]">
                  <strong className="font-bold">Notas:</strong> {confirmation.notes}
                </td>
              </tr>
            )}
          </tbody>
        )
      })}
    </table>
  )
}

function DesktopTable({
  list,
  onError,
}: {
  list: VisibleConfirmation[]
  onError: (message: string) => void
}) {
  return (
    <table className="hidden w-full table-fixed border-collapse text-[15px] leading-snug xl:table">
      <colgroup>
        <col className="w-[164px]" />
        <col className="w-[96px]" />
        <col className="w-[24%]" />
        <col className="w-[84px]" />
        <col className="w-[18%]" />
        <col />
        <col className="w-[128px]" />
      </colgroup>
      <thead className="bg-[#e7ddc9]">
        <tr>
          {['Fecha', 'Personas', 'Nombre', 'Tipo', 'Restricción', 'Notas'].map((title) => (
            <th key={title} scope="col" className="px-3 py-3 text-left text-[13px] font-bold">
              {title}
            </th>
          ))}
          <th scope="col" className="px-3 py-3 text-left text-[13px] font-bold">
            Acción
          </th>
        </tr>
      </thead>
      {list.map((confirmation) => {
        const rows = confirmation.guests.length
        const detail = groupDetail(confirmation)
        return (
          <tbody key={confirmation.id} className="border-t-2 border-[#14110f]">
            {confirmation.guests.map((guest, index) => (
              <tr key={index} className={index ? 'border-t border-[#b9ad97]' : undefined}>
                {index === 0 && (
                  <>
                    <td rowSpan={rows} className="px-3 py-2.5 align-middle">
                      {confirmation.dateLabel}
                    </td>
                    <td rowSpan={rows} className="px-3 py-2.5 align-middle">
                      {confirmation.totalGuests}
                      {detail && (
                        <span className="block text-[13px] text-[#4a443c]">{detail}</span>
                      )}
                    </td>
                  </>
                )}
                <td data-guest-name className="break-words px-3 py-2.5">
                  {guest.name}
                </td>
                <td className="px-3 py-2.5">
                  <GuestType guest={guest} />
                </td>
                <td className="break-words px-3 py-2.5">
                  <GuestDietary guest={guest} />
                </td>
                {index === 0 && (
                  <>
                    <td
                      rowSpan={rows}
                      className="whitespace-pre-line break-words border-l border-[#b9ad97] px-3 py-2.5 align-middle"
                    >
                      {confirmation.notes || <span className="text-[#4a443c]">Sin notas</span>}
                    </td>
                    <td rowSpan={rows} className="px-3 py-2.5 align-middle">
                      <DeleteButton confirmation={confirmation} onError={onError} />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        )
      })}
    </table>
  )
}

export function GuestPanel({
  confirmations,
  summary,
}: {
  confirmations: PanelConfirmation[]
  summary: { people: number; adults: number; minors: number; withRestriction: number }
}) {
  const [filters, setFilters] = useState(NO_FILTERS)
  const [error, setError] = useState('')

  const list = useMemo(
    () => filterConfirmations(confirmations, filters),
    [confirmations, filters],
  )
  const shownPeople = list.reduce((total, item) => total + item.guests.length, 0)
  const isFiltering = Boolean(filters.q.trim() || filters.type || filters.dietary)
  const updateFilter = (field: keyof typeof NO_FILTERS, value: string) =>
    setFilters((current) => ({ ...current, [field]: value }))

  const stats = [
    { label: 'Personas', value: summary.people },
    { label: 'Mayores', value: summary.adults },
    { label: 'Menores', value: summary.minors },
    { label: 'Con restricción', value: summary.withRestriction },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl px-2 py-5 sm:px-6 md:py-8">
      <header className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em]">
            Panel del evento
          </p>
          <h1 className="mt-1 font-serif text-3xl italic md:text-4xl">Los 15 de Ángela</h1>
        </div>
        <form action={logout}>
          <button type="submit" className={BUTTON_STYLES}>
            Salir
          </button>
        </form>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            data-stat
            className="flex flex-col-reverse rounded-lg border-2 border-[#14110f] bg-[#fffdf8] px-3 py-2 text-center"
          >
            <dt className="text-[14px] font-medium">{label}</dt>
            <dd className="font-serif text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="Filtros" className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="filter-q" className="mb-1 block text-[14px] font-semibold">
            Buscar por nombre
          </label>
          <input
            id="filter-q"
            type="search"
            value={filters.q}
            onChange={(event) => updateFilter('q', event.target.value)}
            className={CONTROL_STYLES}
          />
        </div>
        <div>
          <label htmlFor="filter-type" className="mb-1 block text-[14px] font-semibold">
            Tipo
          </label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(event) => updateFilter('type', event.target.value)}
            className={CONTROL_STYLES}
          >
            <option value="">Todos</option>
            <option value="mayor">Mayores</option>
            <option value="menor">Menores</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-dietary" className="mb-1 block text-[14px] font-semibold">
            Restricción
          </label>
          <select
            id="filter-dietary"
            value={filters.dietary}
            onChange={(event) => updateFilter('dietary', event.target.value)}
            className={CONTROL_STYLES}
          >
            <option value="">Todas</option>
            <option value={ANY_RESTRICTION}>Con alguna restricción</option>
            {DIETARY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <a
          href={`/admin/export?${new URLSearchParams(filters)}`}
          className={BUTTON_STYLES}
        >
          {isFiltering ? 'Exportar lo filtrado' : 'Exportar lista'}
        </a>
      </section>

      <p aria-live="polite" className="mt-4 px-1 text-[14px]">
        Se muestran {shownPeople} de {summary.people} personas
      </p>

      {error && (
        <p role="alert" data-error className="mt-2 px-1 text-base font-semibold text-[#8f1022]">
          {error}
        </p>
      )}

      {list.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-lg border-2 border-[#14110f] bg-[#fffdf8]">
          <PhoneTable list={list} onError={setError} />
          <DesktopTable list={list} onError={setError} />
        </div>
      ) : (
        <div className="mt-2 rounded-lg border-2 border-[#14110f] bg-[#fffdf8] px-4 py-8 text-center text-base">
          {isFiltering ? (
            <>
              <p>Ningún invitado coincide con estos filtros.</p>
              <button
                type="button"
                onClick={() => setFilters(NO_FILTERS)}
                className={`${BUTTON_STYLES} mt-3`}
              >
                Limpiar filtros
              </button>
            </>
          ) : (
            <p>Todavía no hay confirmaciones. Cuando un invitado confirme, va a aparecer acá.</p>
          )}
        </div>
      )}
    </main>
  )
}
