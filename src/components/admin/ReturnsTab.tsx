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
  filterReturnRows,
  formatMYR,
  isReturnOverdue,
  OperationCustomerCell,
  OperationDueCell,
  OperationJobContext,
  OperationMoneyCell,
  OperationPaymentCell,
  OperationScheduleCell,
  type OperationQueueFilters,
} from '#/components/admin/operations-queue-utils'
import { showAdminToast } from '#/components/ui/AdminToast'
import { closeReturn, type RentalListRow } from '#/lib/rental-functions'

const SEARCH_DEBOUNCE_MS = 300

type ReturnsTabProps = {
  rows: RentalListRow[]
  onMutated: () => Promise<void>
}

export function ReturnsTab({ rows, onMutated }: ReturnsTabProps) {
  const [filters, setFilters] = useState<OperationQueueFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeRental, setActiveRental] = useState<RentalListRow | null>(null)
  const [endMileage, setEndMileage] = useState('')
  const [endCondition, setEndCondition] = useState('')
  const [paidAmountRM, setPaidAmountRM] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [flagDamage, setFlagDamage] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim() || undefined
      setFilters((prev) => (prev.search === next ? prev : { ...prev, search: next }))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const filteredRows = useMemo(() => filterReturnRows(rows, filters), [rows, filters])

  const hasActiveFilters = Boolean(
    filters.search || filters.from || filters.to || searchInput.trim(),
  )

  function clearFilters() {
    setSearchInput('')
    setFilters({})
  }

  function openReturn(r: RentalListRow) {
    setActiveRental(r)
    setEndMileage('')
    setEndCondition('')
    setPaidAmountRM(((r.totalAmountSen - r.paidAmountSen) / 100).toFixed(2))
    setPaymentMethod('cash')
    setFlagDamage(false)
    setReturnError(null)
  }

  async function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRental) return
    setReturnError(null)
    setIsSubmitting(true)
    try {
      await closeReturn({
        data: {
          rentalId: activeRental.id,
          endMileage: Number(endMileage),
          endConditionNote: endCondition || undefined,
          paidAmountSen: Math.round(Number(paidAmountRM) * 100),
          paymentMethod,
          flagDamage,
        },
      })
      setActiveRental(null)
      showAdminToast('Return closed.')
      await onMutated()
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : 'Failed to close return.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Column<RentalListRow>[]>(
    () => [
      {
        key: 'endDate',
        header: 'Return',
        cellClassName: 'admin-op-col-due whitespace-normal',
        render: (r) => (
          <OperationDueCell
            date={r.endDate}
            time={r.returnTime}
            overdue={isReturnOverdue(r)}
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
        key: 'balance',
        header: 'Balance',
        headerClassName: 'text-right',
        cellClassName: 'admin-op-col-money text-right',
        render: (r) => (
          <OperationMoneyCell
            amountSen={Math.max(0, r.totalAmountSen - r.paidAmountSen)}
            emphasis
          />
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
      searchAriaLabel="Search returns"
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
          onRowClick={openReturn}
          emptyState={
            <div className="text-center text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'No returns match these filters.'
                : 'No returns due. Active jobs will appear here.'}
            </div>
          }
        />
        <div className="admin-infinite-status">
          {`${filteredRows.length.toLocaleString()} return${filteredRows.length === 1 ? '' : 's'} · end of list`}
        </div>
      </article>

      <Sheet
        open={activeRental != null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRental(null)
            setReturnError(null)
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Return</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {activeRental?.carPlateNumber ?? 'Job'} — Close return
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeRental ? <OperationJobContext rental={activeRental} /> : null}
            <form id="returns-form" className="mt-4 space-y-4" onSubmit={handleReturnSubmit}>
              <div>
                <label className="field-label" htmlFor="returns-mileage">
                  End mileage (km)
                </label>
                <input
                  id="returns-mileage"
                  type="number"
                  className="field-input"
                  value={endMileage}
                  onChange={(e) => setEndMileage(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="returns-condition">
                  Condition notes{' '}
                  <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                </label>
                <textarea
                  id="returns-condition"
                  className="field-input min-h-[80px]"
                  value={endCondition}
                  onChange={(e) => setEndCondition(e.target.value)}
                  placeholder="e.g. No issues observed…"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="returns-paid">
                  Amount paid (RM)
                </label>
                <input
                  id="returns-paid"
                  type="number"
                  className="field-input"
                  value={paidAmountRM}
                  onChange={(e) => setPaidAmountRM(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder={
                    activeRental
                      ? `0.00 (total: ${formatMYR(activeRental.totalAmountSen)})`
                      : '0.00'
                  }
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="returns-method">
                  Payment method
                </label>
                <select
                  id="returns-method"
                  className="field-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="returns-damage"
                  type="checkbox"
                  className="mt-0.5 accent-[var(--lagoon-deep)]"
                  checked={flagDamage}
                  onChange={(e) => setFlagDamage(e.target.checked)}
                />
                <label htmlFor="returns-damage" className="cursor-pointer text-sm text-[var(--sea-ink)]">
                  Flag car as damaged after return
                </label>
              </div>
              {returnError ? <p className="form-error">{returnError}</p> : null}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="returns-form" disabled={isSubmitting}>
              {isSubmitting ? 'Closing…' : 'Close return'}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setActiveRental(null)
                setReturnError(null)
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
