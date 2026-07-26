import { useEffect, useState } from 'react'

import { Link } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'

import { showAdminToast } from '#/components/ui/AdminToast'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  getCarCapacityBoard,
  setCarPartnerAllocations,
  type CarCapacityBoard,
} from '#/lib/car-functions'
import { formatPartnerCode, listActivePartnersForCapacity } from '#/lib/partner-functions'
import type { CarColor, CarStatus } from '#/db/schema'

const COLOR_OPTIONS: { value: CarColor; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'silver', label: 'Silver' },
  { value: 'grey', label: 'Grey' },
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'dark-blue', label: 'Dark Blue' },
  { value: 'maroon', label: 'Maroon' },
  { value: 'gold', label: 'Gold' },
  { value: 'beige', label: 'Beige' },
  { value: 'green', label: 'Green' },
  { value: 'other', label: 'Other' },
]

const COLOR_LABEL: Record<CarColor, string> = Object.fromEntries(
  COLOR_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CarColor, string>

type PartnerOption = {
  id: string
  name: string
  code: string
}

type DraftRow = {
  key: string
  partnerId: string
  maxUnits: string
  isActive: boolean
}

type OwnedUnitDraft = {
  key: string
  carId?: string
  plateNumber: string
  color: CarColor
  year: string
  status?: CarStatus
  isCurrent?: boolean
}

type Props = {
  carId: string
  canEdit: boolean
  onCapacitySynced?: (board: CarCapacityBoard) => void
}

function boardToDraft(board: CarCapacityBoard): DraftRow[] {
  return board.partnerAllocations.map((row) => ({
    key: row.modelId,
    partnerId: row.partnerId,
    maxUnits: String(row.maxUnits),
    isActive: row.isActive,
  }))
}

function ownedUnitDefaults(rows: OwnedUnitDraft[]): Pick<OwnedUnitDraft, 'color' | 'year'> {
  const template = rows.find((row) => row.isCurrent) ?? rows[0]
  return {
    color: template?.color ?? 'silver',
    year: template?.year ?? String(new Date().getFullYear()),
  }
}

function boardToOwnedDraft(board: CarCapacityBoard): OwnedUnitDraft[] {
  const rows: OwnedUnitDraft[] = board.ownedUnits.map((unit) => ({
    key: unit.id,
    carId: unit.id,
    plateNumber: unit.plateNumber,
    color: unit.color,
    year: String(unit.year),
    status: unit.status,
    isCurrent: unit.isCurrent,
  }))

  const defaults = ownedUnitDefaults(rows)

  if (rows.length === 0) {
    rows.push({
      key: board.carId,
      carId: board.carId,
      plateNumber: '',
      color: defaults.color,
      year: defaults.year,
      isCurrent: true,
    })
  }

  return rows
}

export function CarCapacityPanel({ carId, canEdit, onCapacitySynced }: Props) {
  const [board, setBoard] = useState<CarCapacityBoard | null>(null)
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [draftRows, setDraftRows] = useState<DraftRow[]>([])
  const [ownedDraftRows, setOwnedDraftRows] = useState<OwnedUnitDraft[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ownedUnitToRemove, setOwnedUnitToRemove] = useState<OwnedUnitDraft | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [nextBoard, partnerList] = await Promise.all([
          getCarCapacityBoard({ data: { carId } }),
          canEdit
            ? listActivePartnersForCapacity()
            : Promise.resolve([] as PartnerOption[]),
        ])
        if (cancelled) return
        setBoard(nextBoard)
        setDraftRows(boardToDraft(nextBoard))
        setOwnedDraftRows(boardToOwnedDraft(nextBoard))
        setPartners(partnerList)
        onCapacitySynced?.(nextBoard)
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Unable to load capacity.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [carId, canEdit])

  function addRow() {
    setDraftRows((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        partnerId: '',
        maxUnits: '1',
        isActive: true,
      },
    ])
  }

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setDraftRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    )
  }

  function removeRow(key: string) {
    setDraftRows((prev) => prev.filter((row) => row.key !== key))
  }

  function addOwnedUnit() {
    setOwnedDraftRows((prev) => {
      const defaults = ownedUnitDefaults(prev)
      return [
        ...prev,
        {
          key: `new-${Date.now()}`,
          plateNumber: '',
          color: defaults.color,
          year: defaults.year,
        },
      ]
    })
  }

  function updateOwnedUnit(key: string, patch: Partial<OwnedUnitDraft>) {
    setOwnedDraftRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    )
  }

  function removeOwnedUnit(key: string) {
    setOwnedDraftRows((prev) => {
      const row = prev.find((item) => item.key === key)
      if (!row || row.isCurrent || prev.length <= 1) return prev
      return prev.filter((item) => item.key !== key)
    })
  }

  function requestRemoveOwnedUnit(key: string) {
    const row = ownedDraftRows.find((item) => item.key === key)
    if (!row || row.isCurrent || ownedDraftRows.length <= 1) return
    setOwnedUnitToRemove(row)
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaveError(null)
    setSaving(true)
    try {
      for (const row of ownedDraftRows) {
        if (!row.plateNumber.trim()) {
          throw new Error('Enter a plate number for every owned unit.')
        }
        const year = Number(row.year)
        const currentYear = new Date().getFullYear()
        if (!Number.isInteger(year) || year < 1960 || year > currentYear + 1) {
          throw new Error(`Year must be between 1960 and ${currentYear + 1}.`)
        }
      }
      const ownedPlates = ownedDraftRows.map((row) => row.plateNumber.trim().toUpperCase())
      if (new Set(ownedPlates).size !== ownedPlates.length) {
        throw new Error('Each owned unit must have a unique plate number.')
      }
      if (!ownedDraftRows.some((row) => row.carId === carId)) {
        throw new Error('The current vehicle must remain in the owned unit list.')
      }

      for (const row of draftRows) {
        if (!row.partnerId) throw new Error('Select a partner for every row.')
        const units = Number(row.maxUnits)
        if (!Number.isInteger(units) || units < 1) {
          throw new Error('Partner units must be a whole number of at least 1.')
        }
      }
      const partnerIds = draftRows.map((r) => r.partnerId)
      if (new Set(partnerIds).size !== partnerIds.length) {
        throw new Error('Each partner can only be allocated once.')
      }

      const next = await setCarPartnerAllocations({
        data: {
          carId,
          ownedUnits: ownedDraftRows.map((row) => ({
            carId: row.carId,
            plateNumber: row.plateNumber,
            color: row.color,
            year: Number(row.year),
          })),
          rows: draftRows.map((row) => ({
            partnerId: row.partnerId,
            maxUnits: Number(row.maxUnits),
            isActive: row.isActive,
          })),
        },
      })
      setBoard(next)
      setDraftRows(boardToDraft(next))
      setOwnedDraftRows(boardToOwnedDraft(next))
      onCapacitySynced?.(next)
      showAdminToast('Capacity saved')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save capacity.')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !board) {
    return (
      <Card>
        <CardHeader>
          <CardDescription className="island-kicker">Fleet capacity</CardDescription>
          <CardTitle className="text-base">Booking slots for this model</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--sea-ink-soft)]">Loading capacity…</p>
        </CardContent>
      </Card>
    )
  }

  if (loadError || !board) {
    return (
      <Card>
        <CardHeader>
          <CardDescription className="island-kicker">Fleet capacity</CardDescription>
          <CardTitle className="text-base">Booking slots for this model</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="form-error">{loadError ?? 'Unable to load capacity.'}</p>
        </CardContent>
      </Card>
    )
  }

  const partnerOptions = (() => {
    const map = new Map(partners.map((p) => [p.id, p]))
    for (const alloc of board.partnerAllocations) {
      if (!map.has(alloc.partnerId)) {
        map.set(alloc.partnerId, {
          id: alloc.partnerId,
          name: alloc.partnerName,
          code: alloc.partnerCode,
        })
      }
    }
    return [...map.values()]
  })()

  const draftPartnerTotal = draftRows.reduce((total, row) => {
    if (!row.isActive) return total
    const units = Number(row.maxUnits)
    return total + (Number.isInteger(units) && units > 0 ? units : 0)
  }, 0)
  const ownedForCapacity = canEdit ? ownedDraftRows.length : board.ownedCount
  const previewMax = ownedForCapacity + (canEdit ? draftPartnerTotal : board.partnerOverbookTotal)

  const capacityForm = canEdit ? (
    <form className="space-y-6" onSubmit={handleSave}>
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--sea-ink)]">Self-owned</h3>
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
            {ownedForCapacity} unit{ownedForCapacity === 1 ? '' : 's'}
          </span>
        </div>
        <p className="mb-3 text-xs text-[var(--sea-ink-soft)]">
          Each owned unit is a fleet plate for this make and model. Add a row and enter the plate
          number to register another vehicle.
        </p>

        <ul className="space-y-2">
          {ownedDraftRows.map((unit) => (
            <li key={unit.key} className="space-y-2 rounded-lg border border-[var(--line)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[var(--sea-ink-soft)]">
                  Owned unit
                </p>
                {unit.isCurrent ? (
                  <span className="text-xs text-[var(--sea-ink-soft)]">This vehicle</span>
                ) : unit.carId ? (
                  <Link
                    to="/admin/cars/$carId"
                    params={{ carId: unit.carId }}
                    className="text-xs text-[var(--lagoon-deep,var(--sea-ink))] hover:underline"
                  >
                    Open vehicle
                  </Link>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_auto_auto] sm:items-end">
                <div>
                  <label className="field-label" htmlFor={`plate-${unit.key}`}>
                    Plate number
                  </label>
                  <input
                    id={`plate-${unit.key}`}
                    className="field-input h-10 min-h-10 min-w-0 font-mono uppercase"
                    value={unit.plateNumber}
                    onChange={(e) =>
                      updateOwnedUnit(unit.key, { plateNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. DEMO002"
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor={`color-${unit.key}`}>
                    Color
                  </label>
                  <select
                    id={`color-${unit.key}`}
                    className="field-input h-10 min-h-10 w-full"
                    value={unit.color}
                    onChange={(e) =>
                      updateOwnedUnit(unit.key, { color: e.target.value as CarColor })
                    }
                    required
                  >
                    {COLOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor={`year-${unit.key}`}>
                    Year
                  </label>
                  <input
                    id={`year-${unit.key}`}
                    type="number"
                    min={1960}
                    max={new Date().getFullYear() + 1}
                    className="field-input h-10 min-h-10 w-full"
                    value={unit.year}
                    onChange={(e) => updateOwnedUnit(unit.key, { year: e.target.value })}
                    required
                  />
                </div>
                <div className="flex h-10 items-center">
                  {unit.status ? <StatusBadge status={unit.status} size="sm" /> : null}
                </div>
                <div className="flex h-10 items-center">
                  <button
                    type="button"
                    className="button-secondary inline-flex h-10 w-10 items-center justify-center disabled:opacity-40"
                    aria-label="Remove owned unit"
                    disabled={unit.isCurrent || ownedDraftRows.length <= 1}
                    onClick={() => requestRemoveOwnedUnit(unit.key)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={addOwnedUnit}
          >
            <Plus size={14} />
            Add unit
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--sea-ink)]">Partner overbook</h3>
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
            +{draftPartnerTotal} unit{draftPartnerTotal === 1 ? '' : 's'}
          </span>
        </div>

        <div className="space-y-3">
          {draftRows.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">
              No partner allocations yet. Add a partner to allow overbook capacity.
            </p>
          ) : (
            <ul className="space-y-2">
              {draftRows.map((row) => (
                <li
                  key={row.key}
                  className="grid gap-2 rounded-lg border border-[var(--line)] p-3 sm:grid-cols-[1fr_6rem_auto]"
                >
                  <div>
                    <label className="field-label" htmlFor={`partner-${row.key}`}>
                      Partner
                    </label>
                    <select
                      id={`partner-${row.key}`}
                      className="field-input"
                      value={row.partnerId}
                      onChange={(e) => updateRow(row.key, { partnerId: e.target.value })}
                      required
                    >
                      <option value="">Select partner…</option>
                      {partnerOptions.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} ({formatPartnerCode(partner.code)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`units-${row.key}`}>
                      Units
                    </label>
                    <input
                      id={`units-${row.key}`}
                      type="number"
                      min={1}
                      className="field-input"
                      value={row.maxUnits}
                      onChange={(e) => updateRow(row.key, { maxUnits: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="button-secondary inline-flex h-10 w-10 items-center justify-center"
                      aria-label="Remove partner allocation"
                      onClick={() => removeRow(row.key)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
              <Plus size={14} />
              Add partner
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Max concurrent bookings:{' '}
          <span className="font-medium text-[var(--sea-ink)]">{previewMax}</span>
          <span className="text-[var(--sea-ink-soft)]">
            {' '}
            ({ownedForCapacity} owned + {draftPartnerTotal} partner)
          </span>
        </p>
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save capacity'}
        </button>
      </div>
      {saveError ? <p className="form-error">{saveError}</p> : null}
    </form>
  ) : (
    <>
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--sea-ink)]">Self-owned</h3>
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
            {board.ownedCount} unit{board.ownedCount === 1 ? '' : 's'}
          </span>
        </div>
        <p className="mb-3 text-xs text-[var(--sea-ink-soft)]">
          {board.ownedCount} fleet-owned plate{board.ownedCount === 1 ? '' : 's'} for this model.
        </p>
        {board.ownedUnits.length === 0 ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No fleet-owned plates for {board.make} {board.model}.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">
            {board.ownedUnits.map((unit) => (
              <li
                key={unit.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <Link
                    to="/admin/cars/$carId"
                    params={{ carId: unit.id }}
                    className="font-mono font-semibold text-[var(--lagoon-deep,var(--sea-ink))] hover:underline"
                  >
                    {unit.plateNumber}
                  </Link>
                  <span className="ml-2 text-xs text-[var(--sea-ink-soft)]">
                    ({COLOR_LABEL[unit.color]}) {unit.year}
                  </span>
                  {unit.isCurrent ? (
                    <span className="ml-2 text-xs text-[var(--sea-ink-soft)]">· This vehicle</span>
                  ) : null}
                </div>
                <StatusBadge status={unit.status} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--sea-ink)]">Partner overbook</h3>
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
            +{board.partnerOverbookTotal} unit{board.partnerOverbookTotal === 1 ? '' : 's'}
          </span>
        </div>
        {board.partnerAllocations.length === 0 ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">No partner allocations.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">
            {board.partnerAllocations.map((row) => (
              <li
                key={row.modelId}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--sea-ink)]">{row.partnerName}</p>
                  <p className="text-xs text-[var(--sea-ink-soft)]">
                    {formatPartnerCode(row.partnerCode)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[var(--sea-ink)]">{row.maxUnits} units</p>
                  <StatusBadge status={row.isActive ? 'active' : 'inactive'} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
          Max concurrent bookings:{' '}
          <span className="font-medium text-[var(--sea-ink)]">{board.maxConcurrent}</span>
        </p>
      </section>
    </>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardDescription className="island-kicker">Fleet capacity</CardDescription>
          <CardTitle className="text-base">Booking slots for this model</CardTitle>
        </CardHeader>
        <CardContent>{capacityForm}</CardContent>
      </Card>

      <ConfirmActionDialog
        open={ownedUnitToRemove != null}
        onOpenChange={(open) => {
          if (!open) setOwnedUnitToRemove(null)
        }}
        title={
          ownedUnitToRemove?.plateNumber.trim()
            ? `Remove ${ownedUnitToRemove.plateNumber.trim().toUpperCase()}?`
            : 'Remove owned unit?'
        }
        description={
          ownedUnitToRemove?.carId ? (
            <>
              This unit will be removed from capacity and the vehicle will be{' '}
              <strong>retired</strong> when you save. Active or pending rentals will block removal.
            </>
          ) : (
            <>
              Discard this unsaved unit? You can add it again before saving capacity.
            </>
          )
        }
        confirmLabel="Remove unit"
        onConfirm={() => {
          if (!ownedUnitToRemove) return
          removeOwnedUnit(ownedUnitToRemove.key)
          setOwnedUnitToRemove(null)
        }}
      />
    </>
  )
}
