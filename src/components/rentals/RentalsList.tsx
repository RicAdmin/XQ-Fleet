import { useState, useMemo } from 'react'

import { Link } from '@tanstack/react-router'
import { ArrowUpDown, ChevronDown, ChevronUp, Eye, Plus, Trash2, X } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#/components/ui/combobox'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { CustomerRow } from '#/components/customers/CustomersList'
import type { AvailableCarOption, RentalListRow } from '#/lib/rental-functions'
import { cancelRental, createRental, deleteRental } from '#/lib/rental-functions'
import type { RentalStatus, RentalType } from '#/db/schema'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toDateInput(d: Date): string {
  return d.toISOString().split('T')[0]
}

function calcTotalSen(dailyRateSen: number, start: string, end: string): number {
  if (!start || !end) return 0
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return 0
  const days = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)))
  return dailyRateSen * days
}

function today(): string {
  return toDateInput(new Date())
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<RentalStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
}

const STATUS_LABEL: Record<RentalStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

function RentalStatusBadge({ status }: { status: RentalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

// ─── Payment badge ────────────────────────────────────────────────────────────

const PAYMENT_STYLES = {
  unpaid: 'bg-red-50 text-red-600 border-red-200',
  partial: 'bg-orange-50 text-orange-600 border-orange-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function PaymentBadge({ status }: { status: string }) {
  const style = PAYMENT_STYLES[status as keyof typeof PAYMENT_STYLES] ?? 'bg-slate-100 text-slate-500 border-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Status tabs ──────────────────────────────────────────────────────────────

const RENTAL_STATUS_TABS: { value: RentalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = 'startDate' | 'endDate' | 'totalAmountSen' | 'status' | 'carPlateNumber' | 'customerFullName'

function sortRentals(rows: RentalListRow[], key: SortKey, dir: 'asc' | 'desc'): RentalListRow[] {
  return [...rows].sort((a, b) => {
    const av = key === 'startDate' || key === 'endDate' ? a[key].getTime() : (a[key] ?? '')
    const bv = key === 'startDate' || key === 'endDate' ? b[key].getTime() : (b[key] ?? '')
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return dir === 'asc' ? cmp : -cmp
  })
}

// ─── Row button ───────────────────────────────────────────────────────────────

const ROW_BTN =
  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] shadow-[0_1px_3px_rgba(30,90,72,0.08)] hover:-translate-y-px transition-transform cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <ArrowUpDown size={11} className="ml-1 inline opacity-40" />
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="ml-1 inline" />
    : <ChevronDown size={11} className="ml-1 inline" />
}

// ─── Form state ───────────────────────────────────────────────────────────────

type RentalFormData = {
  carId: string
  customerId: string
  type: RentalType
  startDate: string
  endDate: string
  dailyRateRM: string
  totalAmountRM: string
  depositRM: string
}

function emptyForm(): RentalFormData {
  return {
    carId: '',
    customerId: '',
    type: 'booking',
    startDate: today(),
    endDate: '',
    dailyRateRM: '',
    totalAmountRM: '',
    depositRM: '0',
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type RentalsListProps = {
  initialRentals: RentalListRow[]
  availableCars: AvailableCarOption[]
  allCustomers: CustomerRow[]
  session: { user: { name: string; email: string; role: string } }
  basePath: string
  canDelete: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RentalsList({
  initialRentals,
  availableCars,
  allCustomers,
  session,
  basePath,
  canDelete,
}: RentalsListProps) {
  const [rentalsList, setRentalsList] = useState<RentalListRow[]>(initialRentals)
  const [activeTab, setActiveTab] = useState<RentalStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('startDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Form
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState<RentalFormData>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Confirm cancel
  const [confirmingCancel, setConfirmingCancel] = useState<RentalListRow | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Confirm delete
  const [confirmingDelete, setConfirmingDelete] = useState<RentalListRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Derived data ──────────────────────────────────────────────────────────

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rentalsList.length }
    for (const r of rentalsList) counts[r.status] = (counts[r.status] ?? 0) + 1
    return counts
  }, [rentalsList])

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const byTab = activeTab === 'all' ? rentalsList : rentalsList.filter((r) => r.status === activeTab)
    const filtered = q
      ? byTab.filter(
          (r) =>
            (r.customerFullName ?? '').toLowerCase().includes(q) ||
            (r.carPlateNumber ?? '').toLowerCase().includes(q),
        )
      : byTab
    return sortRentals(filtered, sortKey, sortDir)
  }, [rentalsList, activeTab, search, sortKey, sortDir])

  // ── Auto-calc total ───────────────────────────────────────────────────────

  function setField<K extends keyof RentalFormData>(key: K, value: RentalFormData[K]) {
    setFormData((prev) => {
      const next = { ...prev, [key]: value }
      // Recalculate total when dates or daily rate change
      if (key === 'startDate' || key === 'endDate' || key === 'dailyRateRM') {
        const dailyRateSen = Math.round(Number(next.dailyRateRM) * 100) || 0
        const totalSen = calcTotalSen(dailyRateSen, next.startDate, next.endDate)
        next.totalAmountRM = totalSen > 0 ? (totalSen / 100).toFixed(2) : next.totalAmountRM
      }
      // Auto-fill daily rate when car is selected
      if (key === 'carId') {
        const car = availableCars.find((c) => c.id === value)
        if (car) {
          const dailyRateSen = car.dailyRateSen
          next.dailyRateRM = (dailyRateSen / 100).toFixed(2)
          const totalSen = calcTotalSen(dailyRateSen, next.startDate, next.endDate)
          next.totalAmountRM = totalSen > 0 ? (totalSen / 100).toFixed(2) : ''
        }
      }
      return next
    })
  }

  // ── Form handlers ─────────────────────────────────────────────────────────

  function openAdd() {
    setFormData(emptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setFormError(null)
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.carId) { setFormError('Please select a car.'); return }
    if (!formData.customerId) { setFormError('Please select a customer.'); return }
    setFormError(null)
    setIsSubmitting(true)
    try {
      const dailyRateSen = Math.round(Number(formData.dailyRateRM) * 100)
      const totalAmountSen = Math.round(Number(formData.totalAmountRM) * 100)
      const depositAmountSen = Math.round(Number(formData.depositRM) * 100)

      await createRental({
        data: {
          carId: formData.carId,
          customerId: formData.customerId,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dailyRateSen,
          totalAmountSen,
          depositAmountSen,
        },
      })
      // Reload page to refresh list (simplest approach — avoids stale JOIN data)
      window.location.reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Cancel handler ────────────────────────────────────────────────────────

  async function handleCancelConfirm() {
    if (!confirmingCancel) return
    setCancelError(null)
    setIsCancelling(true)
    try {
      await cancelRental({ data: { rentalId: confirmingCancel.id } })
      setRentalsList((prev) =>
        prev.map((r) => (r.id === confirmingCancel.id ? { ...r, status: 'cancelled' } : r)),
      )
      setConfirmingCancel(null)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Cancel failed.')
    } finally {
      setIsCancelling(false)
    }
  }

  // ── Delete handler ────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!confirmingDelete) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteRental({ data: { rentalId: confirmingDelete.id } })
      setRentalsList((prev) => prev.filter((r) => r.id !== confirmingDelete.id))
      setConfirmingDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Sort handler ──────────────────────────────────────────────────────────

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Rentals">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--sea-ink)]">Rentals</h2>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            {rentalsList.length} rental{rentalsList.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button type="button" className="button-primary flex items-center gap-2" onClick={openAdd}>
          <Plus size={15} />
          New rental
        </button>
      </div>

      {/* Status tabs */}
      <div className="status-tabs mb-4">
        {RENTAL_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`status-tab ${activeTab === tab.value ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
            {tabCounts[tab.value] != null && (
              <span className="tab-count">{tabCounts[tab.value]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <input
            type="search"
            className="field-input pl-3"
            placeholder="Search customer or plate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <span className="text-xs text-[var(--sea-ink-soft)]">
            {filteredSorted.length} result{filteredSorted.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <article className="workspace-panel island-shell overflow-x-auto p-0">
        {filteredSorted.length === 0 ? (
          <div className="hub-empty-state m-6">
            <p className="text-sm text-[var(--sea-ink-soft)]">
              {search || activeTab !== 'all' ? 'No rentals match your filter.' : 'No rentals yet.'}
            </p>
          </div>
        ) : (
          <table className="cars-table">
            <thead>
              <tr>
                <th className="sortable px-3 py-2" onClick={() => handleSort('carPlateNumber')}>
                  <span className="sort-indicator">Car <SortIcon col="carPlateNumber" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="sortable px-3 py-2" onClick={() => handleSort('customerFullName')}>
                  <span className="sort-indicator">Customer <SortIcon col="customerFullName" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-3 py-2">Type</th>
                <th className="sortable px-3 py-2" onClick={() => handleSort('startDate')}>
                  <span className="sort-indicator">Dates <SortIcon col="startDate" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="sortable px-3 py-2" onClick={() => handleSort('status')}>
                  <span className="sort-indicator">Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-3 py-2">Payment</th>
                <th className="sortable px-3 py-2" onClick={() => handleSort('totalAmountSen')}>
                  <span className="sort-indicator">Total <SortIcon col="totalAmountSen" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-[0.42rem]">
                    <Link
                      to={`${basePath}/$rentalId` as never}
                      params={{ rentalId: r.id } as never}
                      className="plate-link"
                    >
                      {r.carPlateNumber ?? '—'}
                    </Link>
                    <span className="ml-1.5 text-xs text-[var(--sea-ink-soft)]">
                      {r.carMake} {r.carModel}
                    </span>
                  </td>
                  <td className="px-3 py-[0.42rem] text-sm text-[var(--sea-ink)]">
                    {r.customerFullName ?? '—'}
                  </td>
                  <td className="px-3 py-[0.42rem]">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${r.type === 'walk-in' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-purple-200 bg-purple-50 text-purple-700'}`}>
                      {r.type === 'walk-in' ? 'Walk-in' : 'Booking'}
                    </span>
                  </td>
                  <td className="px-3 py-[0.42rem] text-xs text-[var(--sea-ink-soft)]">
                    {formatDateShort(r.startDate)}
                    <span className="mx-1 opacity-40">→</span>
                    {formatDateShort(r.endDate)}
                  </td>
                  <td className="px-3 py-[0.42rem]">
                    <RentalStatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-[0.42rem]">
                    <PaymentBadge status={r.paymentStatus} />
                  </td>
                  <td className="px-3 py-[0.42rem] font-mono text-sm">
                    {formatMYR(r.totalAmountSen)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-[0.42rem] text-right">
                    <Link
                      to={`${basePath}/$rentalId` as never}
                      params={{ rentalId: r.id } as never}
                      className={`${ROW_BTN} mr-1.5`}
                    >
                      <Eye size={11} />
                      View
                    </Link>
                    {r.status === 'pending' && (
                      <button
                        type="button"
                        className={`${ROW_BTN} mr-1.5 opacity-70 hover:opacity-100`}
                        onClick={() => { setConfirmingCancel(r); setCancelError(null) }}
                      >
                        <X size={11} />
                        Cancel
                      </button>
                    )}
                    {canDelete && (r.status === 'closed' || r.status === 'cancelled') && (
                      <button
                        type="button"
                        className={`${ROW_BTN} opacity-50 hover:opacity-100`}
                        onClick={() => { setConfirmingDelete(r); setDeleteError(null) }}
                      >
                        <Trash2 size={11} />
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>

      {/* ── New Rental Sheet ── */}
      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) closeForm() }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[32rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">New rental</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Create rental
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="rental-form" className="space-y-4" onSubmit={handleFormSubmit}>
              {/* Type */}
              <div>
                <label className="field-label">Rental type</label>
                <div className="mt-1 flex gap-3">
                  {(['booking', 'walk-in'] as RentalType[]).map((t) => (
                    <label key={t} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="rental-type"
                        value={t}
                        checked={formData.type === t}
                        onChange={() => setField('type', t)}
                        className="accent-[var(--lagoon-deep)]"
                      />
                      <span className="text-sm text-[var(--sea-ink)]">
                        {t === 'booking' ? 'Advance booking' : 'Walk-in'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Car */}
              <div>
                <label className="field-label" htmlFor="rf-car">Car</label>
                <Combobox
                  value={formData.carId}
                  onValueChange={(v) => setField('carId', v ?? '')}
                >
                  <ComboboxInput
                    id="rf-car"
                    placeholder="Search by plate or model…"
                    className="w-full"
                    showClear={!!formData.carId}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {availableCars.map((car) => (
                        <ComboboxItem key={car.id} value={car.id}>
                          <span className="font-mono font-semibold">{car.plateNumber}</span>
                          <span className="ml-2 text-xs opacity-60">
                            {car.make} {car.model}
                          </span>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                    <ComboboxEmpty>No available cars found.</ComboboxEmpty>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Customer */}
              <div>
                <label className="field-label" htmlFor="rf-customer">Customer</label>
                <Combobox
                  value={formData.customerId}
                  onValueChange={(v) => setField('customerId', v ?? '')}
                >
                  <ComboboxInput
                    id="rf-customer"
                    placeholder="Search by name or IC…"
                    className="w-full"
                    showClear={!!formData.customerId}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {allCustomers.map((c) => (
                        <ComboboxItem key={c.id} value={c.id}>
                          {c.fullName ?? '—'}
                          {c.icOrPassport && (
                            <span className="ml-2 font-mono text-xs opacity-60">
                              {c.icOrPassport}
                            </span>
                          )}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                    <ComboboxEmpty>No customers found.</ComboboxEmpty>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="rf-start">Start date</label>
                  <input
                    id="rf-start"
                    type="date"
                    className="field-input"
                    value={formData.startDate}
                    min={today()}
                    onChange={(e) => setField('startDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="rf-end">End date</label>
                  <input
                    id="rf-end"
                    type="date"
                    className="field-input"
                    value={formData.endDate}
                    min={formData.startDate || today()}
                    onChange={(e) => setField('endDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="field-label" htmlFor="rf-rate">Daily rate (RM)</label>
                  <input
                    id="rf-rate"
                    type="number"
                    className="field-input"
                    value={formData.dailyRateRM}
                    onChange={(e) => setField('dailyRateRM', e.target.value)}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="rf-total">Total (RM)</label>
                  <input
                    id="rf-total"
                    type="number"
                    className="field-input"
                    value={formData.totalAmountRM}
                    onChange={(e) => setField('totalAmountRM', e.target.value)}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="rf-deposit">Deposit (RM)</label>
                  <input
                    id="rf-deposit"
                    type="number"
                    className="field-input"
                    value={formData.depositRM}
                    onChange={(e) => setField('depositRM', e.target.value)}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && formData.dailyRateRM && (
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  {Math.max(1, Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000))} day(s) × RM {Number(formData.dailyRateRM).toFixed(2)} = RM {Number(formData.totalAmountRM).toFixed(2)}
                </p>
              )}

              {formError && <p className="form-error">{formError}</p>}
            </form>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="rental-form" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create rental'}
            </Button>
            <Button variant="outline" type="button" onClick={closeForm}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Confirm cancel overlay ── */}
      {confirmingCancel && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog island-shell">
            <p className="island-kicker mb-2">Cancel booking</p>
            <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
              Cancel this booking?
            </h3>
            <p className="mb-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
              This will cancel the booking for{' '}
              <strong>{confirmingCancel.carPlateNumber}</strong> and release the car back to available.
            </p>
            {cancelError && <p className="form-error mb-4">{cancelError}</p>}
            <div className="flex gap-3">
              <button type="button" className="button-danger" onClick={handleCancelConfirm} disabled={isCancelling}>
                {isCancelling ? 'Cancelling…' : 'Cancel booking'}
              </button>
              <button type="button" className="button-secondary" onClick={() => { setConfirmingCancel(null); setCancelError(null) }}>
                Keep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete overlay ── */}
      {canDelete && confirmingDelete && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog island-shell">
            <p className="island-kicker mb-2">Delete rental</p>
            <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
              Delete this rental?
            </h3>
            <p className="mb-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
              Permanently remove the rental record for{' '}
              <strong>{confirmingDelete.carPlateNumber}</strong>. This cannot be undone.
            </p>
            {deleteError && <p className="form-error mb-4">{deleteError}</p>}
            <div className="flex gap-3">
              <button type="button" className="button-danger" onClick={handleDeleteConfirm} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
              <button type="button" className="button-secondary" onClick={() => { setConfirmingDelete(null); setDeleteError(null) }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminSidebarShell>
  )
}
