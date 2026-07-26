import { useEffect, useMemo, useState } from 'react'

import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { DateRangeFilter, DateRangeQuickPresets } from '#/components/ui/DateRangeFilter'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import {
  filterPickupRows,
  isPickupOverdue,
  OperationCustomerCell,
  OperationDueCell,
  OperationJobContext,
  OperationMoneyCell,
  OperationPaymentCell,
  OperationScheduleCell,
  type OperationQueueFilters,
} from '#/components/admin/operations-queue-utils'
import { showAdminToast } from '#/components/ui/AdminToast'
import { confirmHandover, type RentalListRow } from '#/lib/rental-functions'

const SEARCH_DEBOUNCE_MS = 300

type PickupsTabProps = {
  rows: RentalListRow[]
  onMutated: () => Promise<void>
}

export function PickupsTab({ rows, onMutated }: PickupsTabProps) {
  const [filters, setFilters] = useState<OperationQueueFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeRental, setActiveRental] = useState<RentalListRow | null>(null)
  const [startMileage, setStartMileage] = useState('')
  const [startCondition, setStartCondition] = useState('')
  const [handoverError, setHandoverError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim() || undefined
      setFilters((prev) => (prev.search === next ? prev : { ...prev, search: next }))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const filteredRows = useMemo(() => filterPickupRows(rows, filters), [rows, filters])

  const hasActiveFilters = Boolean(
    filters.search || filters.from || filters.to || searchInput.trim(),
  )

  function clearFilters() {
    setSearchInput('')
    setFilters({})
  }

  function openHandover(r: RentalListRow) {
    setActiveRental(r)
    setStartMileage('')
    setStartCondition('')
    setHandoverError(null)
  }

  async function handleHandoverSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRental) return
    setHandoverError(null)
    setIsSubmitting(true)
    try {
      await confirmHandover({
        data: {
          rentalId: activeRental.id,
          startMileage: Number(startMileage),
          startConditionNote: startCondition || undefined,
        },
      })
      setActiveRental(null)
      showAdminToast('Handover confirmed.')
      await onMutated()
    } catch (err) {
      setHandoverError(err instanceof Error ? err.message : 'Failed to confirm handover.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Column<RentalListRow>[]>(
    () => [
      {
        key: 'startDate',
        header: 'Pickup',
        cellClassName: 'admin-op-col-due whitespace-normal',
        render: (r) => (
          <OperationDueCell
            date={r.startDate}
            time={r.pickUpTime}
            overdue={isPickupOverdue(r)}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => <StatusBadge status={r.status} />,
      },
      {
        key: 'customer',
        header: 'Customer',
        cellClassName: 'admin-op-col-customer whitespace-normal',
        render: (r) => <OperationCustomerCell rental={r} />,
      },
      {
        key: 'car',
        header: 'Car',
        cellClassName: 'admin-op-col-car whitespace-normal',
        render: (r) => (
          <div>
            <div className="admin-op-plate font-semibold">{r.carPlateNumber ?? '—'}</div>
            <div className="text-[var(--admin-text-sm)] text-[var(--sea-ink-soft)]">
              {r.carMake} {r.carModel}
            </div>
          </div>
        ),
      },
      {
        key: 'schedule',
        header: 'Schedule',
        cellClassName: 'admin-op-col-schedule whitespace-normal',
        render: (r) => <OperationScheduleCell rental={r} />,
      },
      {
        key: 'paymentStatus',
        header: 'Payment',
        render: (r) => <OperationPaymentCell rental={r} />,
      },
      {
        key: 'paid',
        header: 'Paid',
        headerClassName: 'text-right',
        cellClassName: 'admin-op-col-money text-right',
        render: (r) => <OperationMoneyCell amountSen={r.paidAmountSen} emphasis />,
      },
    ],
    [],
  )

  const toolbar = (
    <AdminListFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Customer, phone, IC, or plate…"
      searchAriaLabel="Search pickups"
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
      activeFilterCount={(filters.from ? 1 : 0) + (filters.to ? 1 : 0)}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      inlineControls={
        <div className="admin-filter-bar__quick-group">
          <span className="admin-filter-bar__quick-label">Quick range:</span>
          <DateRangeQuickPresets
            from={filters.from}
            to={filters.to}
            onRangeChange={(from, to) => setFilters((prev) => ({ ...prev, from, to }))}
          />
        </div>
      }
    >
      <DateRangeFilter
        from={filters.from}
        to={filters.to}
        onFromChange={(from) => setFilters((prev) => ({ ...prev, from }))}
        onToChange={(to) => setFilters((prev) => ({ ...prev, to }))}
        onRangeChange={(from, to) => setFilters((prev) => ({ ...prev, from, to }))}
      />
    </AdminListFilterBar>
  )

  return (
    <div className="flex flex-col gap-3">
      <article className="workspace-panel island-shell admin-ops-panel p-0">
        {toolbar}
        <DataTable
          className="admin-ops-table w-max min-w-full"
          columns={columns}
          data={filteredRows}
          getKey={(r) => r.id}
          onRowClick={openHandover}
          emptyState={
            <div className="text-center text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'No pickups match these filters.'
                : 'No pickups scheduled. Pending jobs will appear here.'}
            </div>
          }
        />
        <div className="admin-infinite-status">
          {`${filteredRows.length.toLocaleString()} pickup${filteredRows.length === 1 ? '' : 's'} · end of list`}
        </div>
      </article>

      <Sheet
        open={activeRental != null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRental(null)
            setHandoverError(null)
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Pickup</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {activeRental?.carPlateNumber ?? 'Job'} — Confirm handover
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeRental ? <OperationJobContext rental={activeRental} /> : null}
            <form id="pickups-handover-form" className="mt-4 space-y-4" onSubmit={handleHandoverSubmit}>
              <div>
                <label className="field-label" htmlFor="pickups-ho-mileage">
                  Start mileage (km)
                </label>
                <input
                  id="pickups-ho-mileage"
                  type="number"
                  className="field-input"
                  value={startMileage}
                  onChange={(e) => setStartMileage(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="pickups-ho-condition">
                  Condition notes{' '}
                  <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                </label>
                <textarea
                  id="pickups-ho-condition"
                  className="field-input min-h-[80px]"
                  value={startCondition}
                  onChange={(e) => setStartCondition(e.target.value)}
                  placeholder="e.g. Minor scratches on rear bumper…"
                />
              </div>
              {handoverError ? <p className="form-error">{handoverError}</p> : null}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="pickups-handover-form" disabled={isSubmitting}>
              {isSubmitting ? 'Confirming…' : 'Confirm handover'}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setActiveRental(null)
                setHandoverError(null)
              }}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
