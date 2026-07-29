import { useEffect, useMemo, useState } from 'react'

import { Link } from '@tanstack/react-router'

import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { Button } from '#/components/ui/button'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { StatusBadge } from '#/components/ui/StatusBadge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import {
  formatOperationDate,
  OperationCustomerContactCell,
  OperationJobCarCell,
  OperationPaymentCell,
  OperationPickupCell,
  OperationReturnCell,
  OperationTotalCell,
  type OperationQueueFilters,
} from '#/components/admin/operations-queue-utils'
import { formatJobSource, jobBookingRef } from '#/lib/job-display'
import {
  adminUpdateRentalTrip,
  getRentalAuditLog,
  type RentalAuditEntry,
  type RentalListRow,
} from '#/lib/rental-functions'
import type { RentalType } from '#/db/schema'
import { listStaffUsers, type StaffUserRow } from '#/lib/staff-admin-functions'

type AllJobsTabProps = {
  rows: RentalListRow[]
  canEdit?: boolean
  onMutated?: () => void | Promise<void>
}

function toLocalDateInput(d: Date): string {
  const date = new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalDateTimeInput(d: Date | null): string {
  if (!d) return ''
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toTimeHm(t: string): string {
  return t.slice(0, 5)
}

function formatHandledAt(at: Date | null): string | null {
  if (!at) return null
  const time = new Date(at).toLocaleTimeString('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kuala_Lumpur',
  })
  return `${formatOperationDate(at)} · ${time}`
}

function HandledByRow({ label, name, at }: { label: string; name: string | null; at: Date | null }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs font-medium text-[var(--sea-ink-soft)]">{label}</span>
      <span className="text-right text-sm text-[var(--sea-ink)]">
        {name ?? '—'}
        {name && at ? (
          <span className="block text-[11px] text-[var(--sea-ink-soft)]">
            {formatHandledAt(at)}
          </span>
        ) : null}
      </span>
    </div>
  )
}

function filterAllRows(rows: RentalListRow[], filters: OperationQueueFilters) {
  const search = filters.search?.trim().toLowerCase()
  if (!search) return rows
  return rows.filter((row) => {
    const haystack = [
      row.customerFullName,
      row.customerPhone,
      row.customerIcOrPassport,
      row.customerEmail,
      row.carPlateNumber,
      row.carMake,
      row.carModel,
      row.pickUpLocation,
      row.returnLocation,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(search)
  })
}

export function AllJobsTab({ rows, canEdit = false, onMutated }: AllJobsTabProps) {
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [editRental, setEditRental] = useState<RentalListRow | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pickUpTime, setPickUpTime] = useState('09:00')
  const [returnTime, setReturnTime] = useState('09:00')
  const [pickUpLocation, setPickUpLocation] = useState('')
  const [returnLocation, setReturnLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [sheetTab, setSheetTab] = useState<'details' | 'logs'>('details')
  const [jobType, setJobType] = useState<RentalType>('booking')
  const [dailyRateRM, setDailyRateRM] = useState('')
  const [auditLog, setAuditLog] = useState<RentalAuditEntry[] | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [staffUsers, setStaffUsers] = useState<StaffUserRow[]>([])
  const [pickupById, setPickupById] = useState('')
  const [pickupAt, setPickupAt] = useState('')
  const [returnById, setReturnById] = useState('')
  const [returnAt, setReturnAt] = useState('')

  function openEdit(r: RentalListRow) {
    setEditRental(r)
    setStartDate(toLocalDateInput(r.startDate))
    setEndDate(toLocalDateInput(r.endDate))
    setPickUpTime(toTimeHm(r.pickUpTime ?? '09:00:00'))
    setReturnTime(toTimeHm(r.returnTime ?? '09:00:00'))
    setPickUpLocation(r.pickUpLocation ?? '')
    setReturnLocation(r.returnLocation ?? '')
    setJobType(r.type)
    setDailyRateRM((r.dailyRateSen / 100).toFixed(2))
    setPickupById(r.handoverByUserId ?? '')
    setPickupAt(toLocalDateTimeInput(r.actualPickupAt))
    setReturnById(r.returnByUserId ?? '')
    setReturnAt(toLocalDateTimeInput(r.actualReturnAt))
    setSheetTab('details')
    setAuditLog(null)
    setEditError(null)
    if (canEdit && staffUsers.length === 0) {
      listStaffUsers()
        .then(setStaffUsers)
        .catch(() => setStaffUsers([]))
    }
  }

  useEffect(() => {
    if (!editRental || sheetTab !== 'logs') return
    let cancelled = false
    setAuditLoading(true)
    getRentalAuditLog({ data: { rentalId: editRental.id } })
      .then((entries) => {
        if (!cancelled) setAuditLog(entries)
      })
      .catch(() => {
        if (!cancelled) setAuditLog([])
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [editRental, sheetTab])

  async function handleSave() {
    if (!editRental) return
    const rateRm = Number.parseFloat(dailyRateRM)
    if (!Number.isFinite(rateRm) || rateRm <= 0) {
      setEditError('Daily rate must be a positive amount.')
      return
    }
    setSaving(true)
    setEditError(null)
    try {
      await adminUpdateRentalTrip({
        data: {
          rentalId: editRental.id,
          type: jobType,
          startDate,
          endDate,
          pickUpTime: `${pickUpTime}:00`,
          returnTime: `${returnTime}:00`,
          pickUpLocation,
          returnLocation,
          dailyRateSen: Math.round(rateRm * 100),
          handoverByUserId: pickupById || null,
          actualPickupAt: pickupAt ? new Date(pickupAt).toISOString() : null,
          returnByUserId: returnById || null,
          actualReturnAt: returnAt ? new Date(returnAt).toISOString() : null,
        },
      })
      setEditRental(null)
      await onMutated?.()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const filteredRows = useMemo(
    () => filterAllRows(rows, { search: searchInput.trim() || undefined }),
    [rows, searchInput],
  )

  const columns = useMemo<Column<RentalListRow>[]>(
    () => [
      {
        key: 'job',
        header: 'Job',
        cellClassName: 'whitespace-normal',
        render: (r) => (
          <div className="flex flex-col gap-1">
            <Link
              to="/internal/jobs/$jobId"
              params={{ jobId: r.id }}
              className="admin-op-ref text-[var(--lagoon-deep)] no-underline hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {jobBookingRef(r.id)}
            </Link>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={r.status} size="sm" />
              <span className="category-pill">{formatJobSource(r)}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        cellClassName: 'admin-op-col-customer whitespace-normal',
        render: (r) => <OperationCustomerContactCell rental={r} />,
      },
      {
        key: 'car',
        header: 'Car',
        cellClassName: 'admin-op-col-car whitespace-normal',
        render: (r) => <OperationJobCarCell rental={r} />,
      },
      {
        key: 'startDate',
        header: 'Pickup',
        cellClassName: 'admin-op-col-due whitespace-normal',
        render: (r) => <OperationPickupCell rental={r} />,
      },
      {
        key: 'endDate',
        header: 'Return',
        cellClassName: 'admin-op-col-due whitespace-normal',
        render: (r) => <OperationReturnCell rental={r} />,
      },
      {
        key: 'paymentStatus',
        header: 'Payment',
        render: (r) => <OperationPaymentCell rental={r} />,
      },
      {
        key: 'total',
        header: 'Total',
        headerClassName: 'text-right',
        cellClassName: 'admin-op-col-money text-right',
        render: (r) => <OperationTotalCell rental={r} />,
      },
    ],
    [canEdit],
  )

  return (
    <div className="flex flex-col gap-3">
      <article className="workspace-panel island-shell admin-ops-panel p-0">
        <AdminListFilterBar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Customer, phone, IC, or plate…"
          searchAriaLabel="Search open jobs"
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          activeFilterCount={0}
          hasActiveFilters={Boolean(searchInput.trim())}
          onClearFilters={() => setSearchInput('')}
        />
        <DataTable
          className="admin-ops-table w-max min-w-full"
          columns={columns}
          data={filteredRows}
          getKey={(r) => r.id}
          onRowClick={openEdit}
          emptyState={
            <div className="text-center text-sm text-muted-foreground">
              No open jobs right now.
            </div>
          }
        />
        <div className="admin-infinite-status">
          {`${filteredRows.length.toLocaleString()} open job${filteredRows.length === 1 ? '' : 's'} · end of list`}
        </div>
      </article>

      <Sheet
        open={editRental !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditRental(null)
            setEditError(null)
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Job</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {canEdit ? 'Edit job details' : 'Job details'}
            </SheetTitle>
            {editRental ? (
              <p className="mt-1 font-mono text-xs text-[var(--sea-ink-soft)]">
                {jobBookingRef(editRental.id)} · {editRental.carPlateNumber ?? 'Unassigned'}
              </p>
            ) : null}
          </SheetHeader>
          <div className="flex gap-2 border-b border-[var(--line)] px-5 py-3">
            {(['details', 'logs'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSheetTab(t)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium capitalize transition ${
                  sheetTab === t
                    ? 'bg-[var(--sea-ink)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
                }`}
              >
                {t === 'logs' ? 'Logs' : 'Details'}
              </button>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            {sheetTab === 'logs' ? (
              auditLoading ? (
                <p className="text-sm text-[var(--sea-ink-soft)]">Loading logs…</p>
              ) : auditLog && auditLog.length > 0 ? (
                <ol className="flex flex-col gap-2">
                  {auditLog.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-xl border border-[var(--line)] px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[var(--sea-ink)]">
                          {entry.action.replaceAll('.', ' ')}
                        </span>
                        <span className="whitespace-nowrap text-[11px] text-[var(--sea-ink-soft)]">
                          {formatHandledAt(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                        by {entry.actorName ?? 'System'}
                        {entry.actorRole ? ` · ${entry.actorRole}` : ''}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-[var(--sea-ink-soft)]">No activity logged yet.</p>
              )
            ) : (
              <>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Job type</span>
                <select
                  className="input-field"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as RentalType)}
                  disabled={!canEdit}
                >
                  <option value="booking">Booking</option>
                  <option value="walk-in">Walk-in</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Daily rate (RM)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={dailyRateRM}
                  onChange={(e) => setDailyRateRM(e.target.value)}
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Pickup date</span>
                <input
                  type="date"
                  className="input-field"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Pickup time</span>
                <input
                  type="time"
                  className="input-field"
                  value={pickUpTime}
                  onChange={(e) => setPickUpTime(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Return date</span>
                <input
                  type="date"
                  className="input-field"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Return time</span>
                <input
                  type="time"
                  className="input-field"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  disabled={!canEdit}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Pickup location</span>
              <input
                type="text"
                className="input-field"
                value={pickUpLocation}
                onChange={(e) => setPickUpLocation(e.target.value)}
                disabled={!canEdit}
                readOnly={!canEdit}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Return location</span>
              <input
                type="text"
                className="input-field"
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                disabled={!canEdit}
                readOnly={!canEdit}
              />
            </label>
            {canEdit ? (
              <p className="text-[11px] text-[var(--sea-ink-soft)]">
                Changing dates recalculates the job total from the daily rate. Edits are audit-logged.
              </p>
            ) : null}
            {editRental ? (
              canEdit ? (
                <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                    Handled by
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Booked by</span>
                    <span className="text-right text-sm text-[var(--sea-ink)]">
                      {editRental.createdByName ?? '—'}
                      {editRental.createdByName ? (
                        <span className="block text-[11px] text-[var(--sea-ink-soft)]">
                          {formatHandledAt(editRental.createdAt)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-[var(--sea-ink-soft)]">
                        Pickup handled by
                      </span>
                      <select
                        className="input-field"
                        value={pickupById}
                        onChange={(e) => setPickupById(e.target.value)}
                      >
                        <option value="">—</option>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-[var(--sea-ink-soft)]">
                        Handover datetime
                      </span>
                      <input
                        type="datetime-local"
                        className="input-field"
                        value={pickupAt}
                        onChange={(e) => setPickupAt(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-[var(--sea-ink-soft)]">
                        Return handled by
                      </span>
                      <select
                        className="input-field"
                        value={returnById}
                        onChange={(e) => setReturnById(e.target.value)}
                      >
                        <option value="">—</option>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-[var(--sea-ink-soft)]">
                        Return datetime
                      </span>
                      <input
                        type="datetime-local"
                        className="input-field"
                        value={returnAt}
                        onChange={(e) => setReturnAt(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--line)] px-3 py-1.5">
                  <HandledByRow
                    label="Booked by"
                    name={editRental.createdByName}
                    at={editRental.createdAt}
                  />
                  <div className="border-t border-[var(--line)]">
                    <HandledByRow
                      label="Pickup handled by"
                      name={editRental.handoverByName}
                      at={editRental.actualPickupAt}
                    />
                  </div>
                  <div className="border-t border-[var(--line)]">
                    <HandledByRow
                      label="Return handled by"
                      name={editRental.returnByName}
                      at={editRental.actualReturnAt}
                    />
                  </div>
                </div>
              )
            ) : null}
            {editError ? (
              <p className="rounded-lg bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
                {editError}
              </p>
            ) : null}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button
              variant="ghost"
              onClick={() => {
                setEditRental(null)
                setEditError(null)
              }}
              disabled={saving}
            >
              {canEdit && sheetTab === 'details' ? 'Cancel' : 'Close'}
            </Button>
            {canEdit && sheetTab === 'details' ? (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
