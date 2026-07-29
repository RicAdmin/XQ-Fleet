import { useEffect, useMemo, useState } from 'react'

import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { DateRangeFilter, DateRangeQuickPresets } from '#/components/ui/DateRangeFilter'
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
  OperationCustomerContactCell,
  OperationDepositCell,
  OperationDurationCell,
  OperationHandledByCell,
  OperationJobCarCell,
  OperationJobContext,
  OperationPickupCell,
  OperationReturnCell,
  OperationTotalCell,
  type OperationQueueFilters,
} from '#/components/admin/operations-queue-utils'
import { showAdminToast } from '#/components/ui/AdminToast'
import { RentalPhotos } from '#/components/admin/RentalPhotos'
import {
  confirmHandover,
  type RentalListRow,
} from '#/lib/rental-functions'

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
  const [startCondition, setStartCondition] = useState('')
  const [handoverError, setHandoverError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [payAmountRM, setPayAmountRM] = useState('')
  const [payMethod, setPayMethod] = useState('cash')

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
    setStartCondition('')
    setHandoverError(null)
    setPayAmountRM((r.depositAmountSen / 100).toFixed(2))
    setPayMethod('cash')
  }

  async function handleHandoverSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRental) return
    setHandoverError(null)
    setIsSubmitting(true)
    try {
      const depositSen = Math.round(Number(payAmountRM || '0') * 100)
      await confirmHandover({
        data: {
          rentalId: activeRental.id,
          startConditionNote: startCondition || undefined,
          depositPaidSen: depositSen > 0 ? depositSen : undefined,
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
        key: 'job',
        header: 'Job / Car',
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
        key: 'customer',
        header: 'Customer',
        cellClassName: 'admin-op-col-customer whitespace-normal',
        render: (r) => <OperationCustomerContactCell rental={r} />,
      },
      {
        key: 'duration',
        header: 'Duration',
        headerClassName: 'op-hide-sm',
        cellClassName: 'whitespace-nowrap op-hide-sm',
        render: (r) => <OperationDurationCell rental={r} />,
      },
      {
        key: 'total',
        header: 'Total',
        cellClassName: 'admin-op-col-money',
        render: (r) => <OperationTotalCell rental={r} />,
      },
      {
        key: 'deposit',
        header: 'Deposit',
        headerClassName: 'op-hide-sm',
        cellClassName: 'admin-op-col-money whitespace-normal op-hide-sm',
        render: (r) => <OperationDepositCell rental={r} />,
      },
      {
        key: 'endDate',
        header: 'Return',
        headerClassName: 'op-hide-sm',
        cellClassName: 'admin-op-col-due whitespace-normal op-hide-sm',
        render: (r) => <OperationReturnCell rental={r} />,
      },
      {
        key: 'bookedBy',
        header: 'Booked by',
        headerClassName: 'op-hide-sm',
        cellClassName: 'whitespace-normal op-hide-sm',
        render: (r) => (
          <OperationHandledByCell name={r.createdByName} at={r.createdAt} />
        ),
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
      actions={
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
                : 'No pickups scheduled. Confirmed jobs will appear here.'}
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
              <div className="grid grid-cols-2 items-end gap-3">
                <div>
                  <label className="field-label" htmlFor="pickups-ho-paid">
                    Deposit amount (RM)
                  </label>
                  <input
                    id="pickups-ho-paid"
                    type="number"
                    className="field-input"
                    value={payAmountRM}
                    readOnly
                    disabled
                    title="Deposit is fixed per car model"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="pickups-ho-method">
                    Method
                  </label>
                  <select
                    id="pickups-ho-method"
                    className="field-input"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online transfer</option>
                    <option value="qr">QR / DuitNow</option>
                  </select>
                </div>
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
            {activeRental ? (
              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <p className="field-label mb-2">Pickup photos (IC/passport, dashboard)</p>
                <RentalPhotos rentalId={activeRental.id} phase="pickup" />
              </div>
            ) : null}
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
