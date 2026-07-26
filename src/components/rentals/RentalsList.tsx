import { useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate } from '@tanstack/react-router'
import { Check, Copy, KeyRound, Plus, Trash2, X } from 'lucide-react'

import { DataTable, useSortState, type Column } from '#/components/ui/DataTable'
import { AdminListFilterBar, AdminQuickFilterChips } from '#/components/ui/AdminListFilterBar'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { CsJobArrangementCell } from '#/components/rentals/CsJobScheduleCell'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#/components/ui/combobox'
import { showAdminToast } from '#/components/ui/AdminToast'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { DueBadge } from '#/components/admin/operations-queue-utils'
import { createWalkInCustomer, searchCustomers } from '#/lib/customer-functions'
import { formatJobDurationLabel, formatJobSource, formatJobType, isJobOverdue, jobBookingRef, toTimeHms } from '#/lib/job-display'
import { listActivePickupLocations, type PickupLocationRow } from '#/lib/location-functions'
import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'
import { cn } from '#/lib/utils'
import type { AvailableCarOption, RentalListResult, RentalListRow } from '#/lib/rental-functions'
import {
  cancelRental,
  confirmHandover,
  createRental,
  deleteRental,
  getAvailableCars,
  getRentalStatusCounts,
  listRentals,
} from '#/lib/rental-functions'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import type { RentalStatus, RentalType } from '#/db/schema'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

function addDaysYmd(baseYmd: string, days: number): string {
  const d = new Date(`${baseYmd}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toDateInput(d)
}

type DayFilterPreset = 'today' | 'in3d' | 'week' | 'custom' | null

function dayFilterRange(preset: Exclude<DayFilterPreset, 'custom' | null>): [string, string] {
  const start = today()
  if (preset === 'today') return [start, start]
  if (preset === 'in3d') return [start, addDaysYmd(start, 3)]
  return [start, addDaysYmd(start, 7)]
}

function detectDayFilterPreset(from?: string, to?: string): DayFilterPreset {
  if (!from || !to) return null
  const todayRange = dayFilterRange('today')
  if (from === todayRange[0] && to === todayRange[1]) return 'today'
  const in3d = dayFilterRange('in3d')
  if (from === in3d[0] && to === in3d[1]) return 'in3d'
  const week = dayFilterRange('week')
  if (from === week[0] && to === week[1]) return 'week'
  return 'custom'
}

// ─── Status tabs ──────────────────────────────────────────────────────────────

const RENTAL_STATUS_OPTIONS: { value: RentalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey =
  | 'startDate'
  | 'endDate'
  | 'totalAmountSen'
  | 'status'
  | 'carPlateNumber'
  | 'customerFullName'
  | 'createdAt'

// ─── Sort ─────────────────────────────────────────────────────────────────────

type RentalFormData = {
  carId: string
  customerId: string
  type: RentalType
  startDate: string
  endDate: string
  pickUpTime: string
  returnTime: string
  pickUpLocationKind: string
  pickUpLocationDetail: string
  pickUpLocationFeeRM: string
  returnLocationKind: string
  returnLocationDetail: string
  returnLocationFeeRM: string
  dailyRateRM: string
  totalAmountRM: string
  depositRM: string
}

function nonOfficeLocations(rows: PickupLocationRow[]): PickupLocationRow[] {
  return rows.filter((row) => row.kind !== 'office')
}

function locationChipLabel(location: PickupLocationRow): string {
  if (location.kind === 'hotel') return 'Others'
  return location.label
}

function formatJobLocationLabel(location: PickupLocationRow, detail: string): string {
  const name = detail.trim()
  const label = locationChipLabel(location)
  if (!name) return label
  return `${label} · ${name}`
}

function locationDetailLabel(kind: PickupLocationRow['kind']): string {
  if (kind === 'hotel') return 'Location name'
  if (kind === 'airport') return 'Airport / terminal'
  if (kind === 'jetty') return 'Jetty / pier'
  return 'Location name'
}

function locationDetailPlaceholder(kind: PickupLocationRow['kind']): string {
  if (kind === 'hotel') return 'e.g. Hotel, homestay, or address'
  if (kind === 'airport') return 'e.g. LGK · Door 3'
  if (kind === 'jetty') return 'e.g. Kuah Jetty'
  return 'Enter location name'
}

type JobLocationLegProps = {
  idPrefix: string
  label: string
  locations: PickupLocationRow[]
  kind: string
  detail: string
  feeRM: string
  onKindChange: (code: string) => void
  onDetailChange: (detail: string) => void
  onFeeChange: (fee: string) => void
}

function locationChargesFee(kind: PickupLocationRow['kind']): boolean {
  return kind === 'hotel'
}

function JobLocationLeg({
  idPrefix,
  label,
  locations,
  kind,
  detail,
  feeRM,
  onKindChange,
  onDetailChange,
  onFeeChange,
}: JobLocationLegProps) {
  const selected = locations.find((row) => row.code === kind)
  const showFee = selected ? locationChargesFee(selected.kind as PickupLocationRow['kind']) : false

  return (
    <div className="job-location-leg">
      <p className="ui-label">{label}</p>
      <div
        className="admin-filter-bar__chips job-create-form__chips"
        role="radiogroup"
        aria-label={label}
      >
        {locations.map((loc) => {
          const active = kind === loc.code
          return (
            <Button
              key={loc.code}
              type="button"
              variant="outline"
              size="sm"
              role="radio"
              aria-checked={active}
              data-active={active ? 'true' : 'false'}
              className="admin-filter-preset h-[1.875rem] min-h-[1.875rem] max-h-[1.875rem] active:translate-y-0"
              onClick={() => onKindChange(loc.code)}
            >
              {locationChipLabel(loc)}
            </Button>
          )
        })}
      </div>
      {selected ? (
        <div
          className={cn(
            'job-location-leg__fields',
            showFee && 'job-location-leg__fields--with-fee',
          )}
        >
          <div className="job-location-leg__detail">
            <label className="ui-label" htmlFor={`${idPrefix}-detail`}>
              {locationDetailLabel(selected.kind as PickupLocationRow['kind'])}
            </label>
            <input
              id={`${idPrefix}-detail`}
              type="text"
              className="field-input w-full"
              value={detail}
              onChange={(e) => onDetailChange(e.target.value)}
              placeholder={locationDetailPlaceholder(selected.kind as PickupLocationRow['kind'])}
              required
            />
          </div>
          {showFee ? (
            <div className="job-location-leg__fee">
              <label className="ui-label" htmlFor={`${idPrefix}-fee`}>
                Additional fee <span className="job-create-optional">(optional)</span>
              </label>
              <div className="job-create-amount">
                <span className="job-create-amount__prefix">RM</span>
                <input
                  id={`${idPrefix}-fee`}
                  type="number"
                  className="field-input job-create-amount__input"
                  value={feeRM}
                  onChange={(e) => onFeeChange(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function emptyForm(): RentalFormData {
  return {
    carId: '',
    customerId: '',
    type: 'walk-in',
    startDate: today(),
    endDate: '',
    pickUpTime: '09:00',
    returnTime: '09:00',
    pickUpLocationKind: '',
    pickUpLocationDetail: '',
    pickUpLocationFeeRM: '',
    returnLocationKind: '',
    returnLocationDetail: '',
    returnLocationFeeRM: '',
    dailyRateRM: '',
    totalAmountRM: '',
    depositRM: '0',
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type RentalsListProps = {
  availableCars?: AvailableCarOption[]
  session: { user: { name: string; email: string; role: string } }
  basePath: string
  canDelete?: boolean
  /** CS desk can create/cancel jobs; ops floor is read + handover only. */
  jobMode?: 'manage' | 'operations'
  initialResult?: RentalListResult
  initialStatusCounts?: Record<string, number>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RentalsList({
  availableCars: availableCarsProp,
  session,
  basePath,
  canDelete = false,
  jobMode = 'manage',
  initialResult,
  initialStatusCounts,
}: RentalsListProps) {
  const isManageMode = jobMode === 'manage'
  const navigate = useNavigate()
  const skipInitialLoad = useRef(Boolean(initialResult))
  const [availableCars, setAvailableCars] = useState<AvailableCarOption[]>(availableCarsProp ?? [])
  const [result, setResult] = useState<RentalListResult | null>(initialResult ?? null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(
    initialStatusCounts ?? initialResult?.statusCounts ?? { all: 0 },
  )
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<RentalStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<CarCategoryFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string | undefined>()
  const [dateTo, setDateTo] = useState<string | undefined>()
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const { sortKey, sortDir, handleSort } = useSortState<SortKey>('startDate', 'desc')

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

  // Confirm handover
  const [handoverRental, setHandoverRental] = useState<RentalListRow | null>(null)
  const [startMileage, setStartMileage] = useState('')
  const [startCondition, setStartCondition] = useState('')
  const [handoverError, setHandoverError] = useState<string | null>(null)
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false)

  const [customerSearchInput, setCustomerSearchInput] = useState('')
  const [xqIdNo, setXqIdNo] = useState('')
  const [customerOptions, setCustomerOptions] = useState<SelectOption[]>([])
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false)
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', email: '' })
  const [locationRows, setLocationRows] = useState<PickupLocationRow[]>([])
  const [totalAmountManual, setTotalAmountManual] = useState(false)
  const locationOptions = useMemo(() => nonOfficeLocations(locationRows), [locationRows])
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null)

  async function refreshStatusCounts() {
    try {
      const counts = await getRentalStatusCounts()
      setStatusCounts(counts)
    } catch {
      // Tab counts are non-blocking; list data is still usable.
    }
  }

  async function loadCustomers(query?: string) {
    setCustomerSearchLoading(true)
    try {
      const rows = await searchCustomers({
        data: { q: query?.trim() || undefined, limit: 30 },
      })
      setCustomerOptions(
        rows.map((c) => ({
          value: c.id,
          label: c.icOrPassport
            ? `${c.fullName ?? '—'} · ${c.icOrPassport}`
            : (c.fullName ?? '—'),
        })),
      )
    } catch {
      setCustomerOptions([])
    } finally {
      setCustomerSearchLoading(false)
    }
  }

  async function load(p = page) {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listRentals({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: activeTab === 'all' ? undefined : activeTab,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          search: search || undefined,
          from: dateFrom,
          to: dateTo,
          sortKey,
          sortDir,
        },
      })
      setResult(res)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load jobs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
    setPage(1)
    void load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, categoryFilter, search, dateFrom, dateTo, sortKey, sortDir])

  useEffect(() => {
    if (initialStatusCounts || initialResult?.statusCounts) return
    void refreshStatusCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!formOpen) return
    void loadCustomers()
    if (availableCars.length === 0) {
      void getAvailableCars()
        .then(setAvailableCars)
        .catch(() => {
          // Form still usable; car combobox will show empty.
        })
    }
    void listActivePickupLocations()
      .then((rows) => {
        setLocationRows(rows)
      })
      .catch(() => {
        // Form still usable; location chips will be empty until reload.
      })
  }, [formOpen, availableCars.length])

  useEffect(() => {
    if (!formOpen) return
    const timer = setTimeout(() => {
      const q = xqIdNo.trim() || customerSearchInput.trim() || undefined
      void loadCustomers(q)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [xqIdNo, customerSearchInput, formOpen])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      setSearch((prev) => (prev === next ? prev : next))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1
  const tabCounts = statusCounts
  const dayPreset = detectDayFilterPreset(dateFrom, dateTo)
  const hasActiveFilters =
    activeTab !== 'all' ||
    categoryFilter !== 'all' ||
    searchInput.trim().length > 0 ||
    search.length > 0 ||
    Boolean(dateFrom || dateTo)

  function applyDayPreset(preset: 'today' | 'in3d' | 'week') {
    const [from, to] = dayFilterRange(preset)
    setDateFrom(from)
    setDateTo(to)
    setCustomFrom(from)
    setCustomTo(to)
  }

  function clearDayFilter() {
    setDateFrom(undefined)
    setDateTo(undefined)
    setCustomFrom('')
    setCustomTo('')
  }

  function applyCustomDayRange() {
    if (!customFrom || !customTo) return
    if (customTo < customFrom) {
      showAdminToast('End date must be on or after start date.')
      return
    }
    setDateFrom(customFrom)
    setDateTo(customTo)
  }

  type SelectOption = { value: string; label: string }

  const carItems = useMemo<SelectOption[]>(
    () =>
      availableCars.map((c) => ({
        value: c.id,
        label: `${c.plateNumber} · ${c.make} ${c.model}`,
      })),
    [availableCars],
  )

  const selectedCarItem = carItems.find((i) => i.value === formData.carId) ?? null
  const selectedCustomerItem =
    customerOptions.find((i) => i.value === formData.customerId) ?? null

  const customerItems = useMemo<SelectOption[]>(() => {
    if (!selectedCustomerItem) return customerOptions
    if (customerOptions.some((item) => item.value === selectedCustomerItem.value)) {
      return customerOptions
    }
    return [selectedCustomerItem, ...customerOptions]
  }, [customerOptions, selectedCustomerItem])

  const suggestedTotalRM = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !formData.dailyRateRM) return null
    const dailyRateSen = Math.round(Number(formData.dailyRateRM) * 100) || 0
    const totalSen = calcTotalSen(dailyRateSen, formData.startDate, formData.endDate)
    return totalSen > 0 ? (totalSen / 100).toFixed(2) : null
  }, [formData.startDate, formData.endDate, formData.dailyRateRM])

  // ── Auto-calc total ───────────────────────────────────────────────────────

  function setField<K extends keyof RentalFormData>(key: K, value: RentalFormData[K]) {
    if (key === 'totalAmountRM') {
      setTotalAmountManual(true)
      setFormData((prev) => ({ ...prev, totalAmountRM: value as string }))
      return
    }

    setFormData((prev) => {
      const next = { ...prev, [key]: value }
      const shouldAutoTotal = !totalAmountManual
      // Recalculate total when dates or daily rate change (unless CS set it manually)
      if (shouldAutoTotal && (key === 'startDate' || key === 'endDate' || key === 'dailyRateRM')) {
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
          if (shouldAutoTotal) {
            const totalSen = calcTotalSen(dailyRateSen, next.startDate, next.endDate)
            next.totalAmountRM = totalSen > 0 ? (totalSen / 100).toFixed(2) : ''
          }
        }
      }
      return next
    })
  }

  function applySuggestedTotal() {
    if (!suggestedTotalRM) return
    setTotalAmountManual(false)
    setFormData((prev) => ({ ...prev, totalAmountRM: suggestedTotalRM }))
  }

  // ── Form handlers ─────────────────────────────────────────────────────────

  function openAdd() {
    setFormData(emptyForm())
    setFormError(null)
    setCustomerSearchInput('')
    setXqIdNo('')
    setCustomerMode('existing')
    setNewCustomer({ fullName: '', phone: '', email: '' })
    setTotalAmountManual(false)
    setFormOpen(true)
    requestAnimationFrame(() => {
      document.getElementById('job-create-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function closeForm() {
    setFormOpen(false)
    setFormError(null)
    setCustomerMode('existing')
    setNewCustomer({ fullName: '', phone: '', email: '' })
    setXqIdNo('')
  }

  function setCustomerEntryMode(mode: 'existing' | 'new') {
    setCustomerMode(mode)
    if (mode === 'new') {
      setField('customerId', '')
      setCustomerSearchInput('')
      setXqIdNo('')
      return
    }
    setNewCustomer({ fullName: '', phone: '', email: '' })
  }

  function setNewCustomerField(key: 'fullName' | 'phone' | 'email', value: string) {
    setNewCustomer((prev) => ({ ...prev, [key]: value }))
  }

  function setLocationKind(leg: 'pickUp' | 'return', code: string) {
    if (leg === 'pickUp') {
      setFormData((prev) => ({
        ...prev,
        pickUpLocationKind: code,
        pickUpLocationDetail: '',
        pickUpLocationFeeRM: '0',
      }))
      return
    }
    setFormData((prev) => ({
      ...prev,
      returnLocationKind: code,
      returnLocationDetail: '',
      returnLocationFeeRM: '0',
    }))
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.carId) { setFormError('Please select a car.'); return }

    let customerId = formData.customerId
    if (customerMode === 'new') {
      if (!newCustomer.fullName.trim()) {
        setFormError('Enter the customer name.')
        return
      }
      if (!newCustomer.phone.trim()) {
        setFormError('Enter the customer mobile number.')
        return
      }
    } else if (!customerId) {
      setFormError('Please select a customer.')
      return
    }

    const pickUpPreset = locationOptions.find((row) => row.code === formData.pickUpLocationKind)
    const returnPreset = locationOptions.find((row) => row.code === formData.returnLocationKind)
    if (!pickUpPreset) { setFormError('Select a pickup location type.'); return }
    if (!returnPreset) { setFormError('Select a return location type.'); return }
    if (!formData.pickUpLocationDetail.trim()) { setFormError('Enter the pickup location name.'); return }
    if (!formData.returnLocationDetail.trim()) { setFormError('Enter the return location name.'); return }
    if (!formData.totalAmountRM.trim() || Number(formData.totalAmountRM) <= 0) {
      setFormError('Enter the total amount.')
      return
    }

    setFormError(null)
    setIsSubmitting(true)
    try {
      if (customerMode === 'new') {
        const created = await createWalkInCustomer({
          data: {
            fullName: newCustomer.fullName,
            phone: newCustomer.phone,
            email: newCustomer.email || undefined,
            xqIdNo: xqIdNo.trim() || undefined,
          },
        })
        customerId = created.id
      }

      const selectedCar = availableCars.find((c) => c.id === formData.carId)
      const dailyRateSen =
        Math.round(Number(formData.dailyRateRM) * 100) ||
        selectedCar?.dailyRateSen ||
        0
      const totalAmountSen = Math.round(Number(formData.totalAmountRM) * 100)
      const depositAmountSen = Math.round(Number(formData.depositRM || '0') * 100)
      const deliveryFeeSen =
        Math.round(Number(formData.pickUpLocationFeeRM || '0') * 100) +
        Math.round(Number(formData.returnLocationFeeRM || '0') * 100)

      await createRental({
        data: {
          carId: formData.carId,
          customerId,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          pickUpTime: toTimeHms(formData.pickUpTime),
          returnTime: toTimeHms(formData.returnTime),
          pickUpLocation: formatJobLocationLabel(pickUpPreset, formData.pickUpLocationDetail),
          returnLocation: formatJobLocationLabel(returnPreset, formData.returnLocationDetail),
          dailyRateSen,
          totalAmountSen,
          depositAmountSen,
          deliveryFeeSen,
        },
      })
      closeForm()
      setPage(1)
      showAdminToast('Job created.')
      await Promise.all([load(1), refreshStatusCounts()])
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
      setConfirmingCancel(null)
      showAdminToast('Job cancelled.')
      await Promise.all([load(page), refreshStatusCounts()])
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
      setConfirmingDelete(null)
      showAdminToast('Job deleted.')
      await Promise.all([load(page), refreshStatusCounts()])
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Handover handler ──────────────────────────────────────────────────────

  function openHandover(r: RentalListRow) {
    setHandoverRental(r)
    setStartMileage('')
    setStartCondition('')
    setHandoverError(null)
  }

  async function handleHandoverSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!handoverRental) return
    setHandoverError(null)
    setIsSubmittingHandover(true)
    try {
      await confirmHandover({
        data: {
          rentalId: handoverRental.id,
          startMileage: Number(startMileage),
          startConditionNote: startCondition || undefined,
        },
      })
      setHandoverRental(null)
      showAdminToast('Handover confirmed.')
      await Promise.all([load(page), refreshStatusCounts()])
    } catch (err) {
      setHandoverError(err instanceof Error ? err.message : 'Failed to confirm handover.')
    } finally {
      setIsSubmittingHandover(false)
    }
  }

  async function copyJobId(rentalId: string) {
    const ref = jobBookingRef(rentalId)
    try {
      await navigator.clipboard.writeText(ref)
      setCopiedJobId(rentalId)
      showAdminToast(`Copied ${ref}`)
      window.setTimeout(() => {
        setCopiedJobId((prev) => (prev === rentalId ? null : prev))
      }, 1500)
    } catch {
      showAdminToast('Could not copy Job ID')
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<RentalListRow>[] = [
    {
      key: 'id',
      header: 'Job ID',
      cellClassName: 'whitespace-nowrap',
      render: (r) => {
        const ref = jobBookingRef(r.id)
        const copied = copiedJobId === r.id
        return (
          <div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm font-semibold text-[var(--lagoon-deep)]">
                {ref}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-6 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
                aria-label={`Copy Job ID ${ref}`}
                title="Copy Job ID"
                onClick={(e) => {
                  e.stopPropagation()
                  void copyJobId(r.id)
                }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
            <div className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
              {formatJobSource(r.type, r.createdByName)}
            </div>
          </div>
        )
      },
    },
    {
      key: 'carPlateNumber',
      header: 'Car',
      sortable: true,
      render: (r) => (
        <div>
          <div className="text-sm font-medium text-[var(--sea-ink)]">
            {[r.carMake, r.carModel].filter(Boolean).join(' ') || '—'}
          </div>
          <div className="mt-0.5 font-mono text-xs text-[var(--sea-ink-soft)]">
            {r.carPlateNumber ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Arrangement',
      sortable: true,
      cellClassName: 'whitespace-normal',
      render: (r) => <CsJobArrangementCell rental={r} />,
    },
    {
      key: 'customerFullName',
      header: 'Customer',
      sortable: true,
      cellClassName: 'min-w-[10rem] whitespace-normal',
      render: (r) => (
        <div className="text-sm leading-relaxed text-[var(--sea-ink)]">
          <div className="font-medium">{r.customerFullName ?? '—'}</div>
          <div className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
            {r.customerPhone ?? '—'}
          </div>
          <div className="mt-0.5 truncate text-xs text-[var(--sea-ink-soft)]">
            {r.customerEmail ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmountSen',
      header: 'Payment',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      render: (r) => (
        <div>
          <div className="font-mono text-sm font-semibold tabular-nums text-[var(--sea-ink)]">
            {formatMYR(r.totalAmountSen)}
          </div>
          <div className="mt-0.5 text-xs font-medium tabular-nums text-[var(--sea-ink-soft)]">
            {formatJobDurationLabel(r.startDate, r.endDate, r.extraHoursDecimal)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={r.status} size="sm" />
          <StatusBadge status={r.paymentStatus} size="sm" />
          <DueBadge overdue={isJobOverdue(r)} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      render: (r) => {
        const canHandover = r.status === 'pending'
        const canCancel = isManageMode && r.status === 'pending'
        const showDelete =
          isManageMode && canDelete && (r.status === 'closed' || r.status === 'cancelled')

        if (!canHandover && !canCancel && !showDelete) {
          return <span className="text-xs text-[var(--sea-ink-soft)]">—</span>
        }

        return (
          <div
            className="inline-flex items-center justify-end gap-0.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {canHandover ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
                aria-label={`Confirm handover for ${r.carPlateNumber ?? 'job'}`}
                title="Confirm handover"
                onClick={() => openHandover(r)}
              >
                <KeyRound className="size-4" />
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
                aria-label={`Cancel ${r.carPlateNumber ?? 'job'}`}
                title="Cancel"
                onClick={() => {
                  setConfirmingCancel(r)
                  setCancelError(null)
                }}
              >
                <X className="size-4" />
              </Button>
            ) : null}
            {showDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-[var(--sea-ink-soft)] hover:text-red-600"
                aria-label={`Delete ${r.carPlateNumber ?? 'job'}`}
                title="Delete"
                onClick={() => {
                  setConfirmingDelete(r)
                  setDeleteError(null)
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Jobs">
      <PageHeader
        kicker={isManageMode ? 'Customer service' : 'Operations'}
        title="Jobs"
        description={
          isManageMode
            ? result
              ? `${result.total.toLocaleString()} job${result.total !== 1 ? 's' : ''} total — in-house and online bookings`
              : 'Loading…'
            : result
              ? `${result.total.toLocaleString()} open job${result.total !== 1 ? 's' : ''} — status updates only`
              : 'Loading…'
        }
        actions={
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { key: 'today' as const, label: 'Today' },
                { key: 'in3d' as const, label: 'In 3D' },
                { key: 'week' as const, label: '1 Week' },
              ] as const
            ).map((preset) => {
              const isActive = dayPreset === preset.key
              return (
                <button
                  key={preset.key}
                  type="button"
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--ui-ink)] text-white'
                      : 'text-[var(--sea-ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--sea-ink)]',
                  )}
                  aria-pressed={isActive}
                  onClick={() => {
                    if (isActive) clearDayFilter()
                    else applyDayPreset(preset.key)
                  }}
                >
                  {preset.label}
                </button>
              )
            })}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                      dayPreset === 'custom'
                        ? 'bg-[var(--ui-ink)] text-white'
                        : 'text-[var(--sea-ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--sea-ink)]',
                    )}
                    aria-pressed={dayPreset === 'custom'}
                  />
                }
              >
                Custom date
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-3">
                <div className="space-y-3">
                  <div>
                    <label className="field-label" htmlFor="jobs-day-from">
                      From
                    </label>
                    <input
                      id="jobs-day-from"
                      type="date"
                      className="field-input"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="jobs-day-to">
                      To
                    </label>
                    <input
                      id="jobs-day-to"
                      type="date"
                      className="field-input"
                      value={customTo}
                      min={customFrom || undefined}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={clearDayFilter}>
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!customFrom || !customTo}
                      onClick={applyCustomDayRange}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {isManageMode ? (
              <button
                type="button"
                className="button-primary ml-1 flex items-center gap-2"
                onClick={openAdd}
              >
                <Plus size={15} />
                New job
              </button>
            ) : null}
          </div>
        }
      />

      {loadError && (
        <ErrorPanel title="Failed to load jobs" message={loadError} onRetry={() => load()} />
      )}

      {loading && !result && <TableSkeleton rows={8} columns={8} />}

      <div className="admin-stack">
      {formOpen && isManageMode ? (
        <article id="job-create-panel" className="workspace-panel island-shell job-create-panel overflow-hidden p-0">
          <div className="job-create-panel__header flex items-start justify-between gap-3 border-b border-[var(--ui-border)] px-5 py-4">
            <div>
              <p className="island-kicker mb-1">New job</p>
              <h2 className="ui-page-title text-[length:var(--admin-title-sm)]">Create job</h2>
              <p className="ui-page-desc">
                In house or booking — fill in the trip, then confirm payment.
              </p>
            </div>
            <button type="button" className="button-secondary shrink-0" onClick={closeForm}>
              Close
            </button>
          </div>

          <div className="job-create-panel__body">
            <form id="rental-form" className="admin-form-sheet job-create-form job-create-form--inline" onSubmit={handleFormSubmit}>
              <div className="job-create-form__section job-create-form__source">
                <span className="ui-label">Source</span>
                <div className="job-create-form__chips" role="radiogroup" aria-label="Source">
                  {(['booking', 'walk-in'] as RentalType[]).map((t) => {
                    const active = formData.type === t
                    return (
                      <Button
                        key={t}
                        type="button"
                        variant="outline"
                        size="sm"
                        role="radio"
                        aria-checked={active}
                        data-active={active ? 'true' : 'false'}
                        className="admin-filter-preset h-[1.875rem] min-h-[1.875rem] max-h-[1.875rem] active:translate-y-0"
                        onClick={() => setField('type', t)}
                      >
                        {formatJobType(t)}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="job-create-form__section job-create-form__customer">
                <span className="ui-label">Customer</span>
                <div
                  className="job-create-form__chips"
                  role="radiogroup"
                  aria-label="Customer entry mode"
                >
                  {(
                    [
                      { value: 'existing' as const, label: 'Existing' },
                      { value: 'new' as const, label: 'New customer' },
                    ] as const
                  ).map((option) => {
                    const active = customerMode === option.value
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        role="radio"
                        aria-checked={active}
                        data-active={active ? 'true' : 'false'}
                        className="admin-filter-preset h-[1.875rem] min-h-[1.875rem] max-h-[1.875rem] active:translate-y-0"
                        onClick={() => setCustomerEntryMode(option.value)}
                      >
                        {option.label}
                      </Button>
                    )
                  })}
                </div>

                <div className="job-create-form__field job-create-form__xq-id">
                  <label className="ui-label" htmlFor="rf-xq-id">XQ_ID No.</label>
                  <input
                    id="rf-xq-id"
                    type="text"
                    className="field-input w-full"
                    value={xqIdNo}
                    onChange={(e) => {
                      setXqIdNo(e.target.value)
                      if (customerMode === 'existing') {
                        setField('customerId', '')
                      }
                    }}
                    placeholder="IC or passport number"
                    autoComplete="off"
                  />
                </div>

                {customerMode === 'existing' ? (
                  <div className="job-create-form__control">
                    <Combobox
                      items={customerItems}
                      value={selectedCustomerItem}
                      onValueChange={(item) => {
                        setField('customerId', item?.value ?? '')
                        if (!item) {
                          return
                        }
                        const icSuffix = item.label.includes(' · ')
                          ? item.label.split(' · ').pop()
                          : ''
                        if (icSuffix) setXqIdNo(icSuffix)
                      }}
                      itemToStringLabel={(item) => item.label}
                      filter={null}
                    >
                      <ComboboxInput
                        id="rf-customer"
                        placeholder="Search name or IC…"
                        className="field-input w-full"
                        showClear={!!selectedCustomerItem}
                        onChange={(e) => setCustomerSearchInput(e.target.value)}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>
                          {customerSearchLoading ? 'Searching…' : 'No customers found.'}
                        </ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item.value} value={item}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                ) : (
                  <div className="job-create-form__section-body job-create-form__grid job-create-form__grid--3">
                    <div className="job-create-form__field">
                      <label className="ui-label" htmlFor="nc-name">Name</label>
                      <input
                        id="nc-name"
                        type="text"
                        className="field-input w-full"
                        value={newCustomer.fullName}
                        onChange={(e) => setNewCustomerField('fullName', e.target.value)}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="job-create-form__field">
                      <label className="ui-label" htmlFor="nc-phone">Mobile</label>
                      <input
                        id="nc-phone"
                        type="tel"
                        className="field-input w-full"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomerField('phone', e.target.value)}
                        placeholder="e.g. 012-345 6789"
                        required
                      />
                    </div>
                    <div className="job-create-form__field">
                      <label className="ui-label" htmlFor="nc-email">
                        Email <span className="job-create-optional">(optional)</span>
                      </label>
                      <input
                        id="nc-email"
                        type="email"
                        className="field-input w-full"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomerField('email', e.target.value)}
                        placeholder="name@email.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="job-create-form__section job-create-form__schedule">
                <span className="ui-label">Schedule</span>
                <div className="job-create-form__section-body job-create-form__grid job-create-form__grid--4">
                  <div className="job-create-form__field">
                    <label className="ui-label" htmlFor="rf-start">Pickup date</label>
                    <input
                      id="rf-start"
                      type="date"
                      className="field-input w-full"
                      value={formData.startDate}
                      min={today()}
                      onChange={(e) => setField('startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="job-create-form__field">
                    <label className="ui-label" htmlFor="rf-pickup-time">Pickup time</label>
                    <input
                      id="rf-pickup-time"
                      type="time"
                      className="field-input w-full"
                      value={formData.pickUpTime}
                      onChange={(e) => setField('pickUpTime', e.target.value)}
                      required
                    />
                  </div>
                  <div className="job-create-form__field">
                    <label className="ui-label" htmlFor="rf-end">Return date</label>
                    <input
                      id="rf-end"
                      type="date"
                      className="field-input w-full"
                      value={formData.endDate}
                      min={formData.startDate || today()}
                      onChange={(e) => setField('endDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="job-create-form__field">
                    <label className="ui-label" htmlFor="rf-return-time">Return time</label>
                    <input
                      id="rf-return-time"
                      type="time"
                      className="field-input w-full"
                      value={formData.returnTime}
                      onChange={(e) => setField('returnTime', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="job-create-form__section job-create-form__car">
                <label className="ui-label" htmlFor="rf-car">Car</label>
                <div className="job-create-form__control">
                <Combobox
                  items={carItems}
                  value={selectedCarItem}
                  onValueChange={(item) => setField('carId', item?.value ?? '')}
                  itemToStringLabel={(item) => item.label}
                >
                  <ComboboxInput
                    id="rf-car"
                    placeholder="Search plate or model…"
                    className="field-input w-full"
                    showClear={!!selectedCarItem}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No available cars found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                </div>
              </div>

              <div className="job-create-form__section job-create-form__locations">
                <span className="ui-label">Locations</span>
                <div className="job-create-form__section-body job-create-form__grid job-create-form__grid--2">
                  <JobLocationLeg
                    idPrefix="pickup"
                    label="Pickup"
                    locations={locationOptions}
                    kind={formData.pickUpLocationKind}
                    detail={formData.pickUpLocationDetail}
                    feeRM={formData.pickUpLocationFeeRM}
                    onKindChange={(code) => setLocationKind('pickUp', code)}
                    onDetailChange={(detail) => setField('pickUpLocationDetail', detail)}
                    onFeeChange={(fee) => setField('pickUpLocationFeeRM', fee)}
                  />
                  <JobLocationLeg
                    idPrefix="return"
                    label="Return"
                    locations={locationOptions}
                    kind={formData.returnLocationKind}
                    detail={formData.returnLocationDetail}
                    feeRM={formData.returnLocationFeeRM}
                    onKindChange={(code) => setLocationKind('return', code)}
                    onDetailChange={(detail) => setField('returnLocationDetail', detail)}
                    onFeeChange={(fee) => setField('returnLocationFeeRM', fee)}
                  />
                </div>
              </div>

              <div className="job-create-form__section job-create-form__payment">
                <span className="ui-label">Payment</span>
                <div className="job-create-form__section-body">
                  <div className="job-create-form__field job-create-form__payment-total">
                    <label className="ui-label" htmlFor="rf-total">Total amount</label>
                    <div className="job-create-amount">
                      <span className="job-create-amount__prefix">RM</span>
                      <input
                        id="rf-total"
                        type="number"
                        className="field-input job-create-amount__input"
                        value={formData.totalAmountRM}
                        onChange={(e) => setField('totalAmountRM', e.target.value)}
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>
                {suggestedTotalRM ? (
                  <p className="job-create-payment__hint">
                    {formData.startDate && formData.endDate && formData.dailyRateRM ? (
                      <>
                        Suggested:{' '}
                        {Math.max(
                          1,
                          Math.ceil(
                            (new Date(formData.endDate).getTime() -
                              new Date(formData.startDate).getTime()) /
                              86400000,
                          ),
                        )}{' '}
                        day(s) × RM {Number(formData.dailyRateRM).toFixed(2)} ={' '}
                        <strong>RM {suggestedTotalRM}</strong>
                      </>
                    ) : null}
                    {totalAmountManual && formData.totalAmountRM !== suggestedTotalRM ? (
                      <>
                        {' '}
                        <button
                          type="button"
                          className="job-create-payment__apply"
                          onClick={applySuggestedTotal}
                        >
                          Use suggested
                        </button>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>

              {formError ? <p className="form-error">{formError}</p> : null}
            </form>
          </div>

          <div className="job-create-panel__footer flex flex-wrap items-center justify-end gap-2 border-t border-[var(--ui-border)] px-5 py-4">
            <button type="button" className="button-secondary" onClick={closeForm}>
              Cancel
            </button>
            <button
              type="submit"
              form="rental-form"
              disabled={isSubmitting}
              className="button-primary"
            >
              {isSubmitting ? 'Creating…' : 'Create job'}
            </button>
          </div>
        </article>
      ) : null}
      {result && (
      <>
      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <AdminListFilterBar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchClear={() => setSearch('')}
          searchPlaceholder="Customer, phone, or plate…"
          searchAriaLabel="Search jobs"
          resultSummary={
            result
              ? `${result.total.toLocaleString()} job${result.total !== 1 ? 's' : ''}`
              : undefined
          }
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          activeFilterCount={categoryFilter !== 'all' ? 1 : 0}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setActiveTab('all')
            setCategoryFilter('all')
            setSearchInput('')
            setSearch('')
            clearDayFilter()
          }}
          quickFilters={
            <AdminQuickFilterChips
              label="Quick status:"
              value={activeTab}
              options={RENTAL_STATUS_OPTIONS.map((tab) => ({
                value: tab.value,
                label:
                  tab.value === 'all'
                    ? tab.label
                    : typeof tabCounts[tab.value] === 'number'
                      ? `${tab.label} (${tabCounts[tab.value]})`
                      : tab.label,
              }))}
              onValueChange={(value) => setActiveTab(value as RentalStatus | 'all')}
            />
          }
        >
          <StatusFilterSelect
            aria-label="Filter jobs by vehicle type"
            value={categoryFilter}
            options={CAR_CATEGORY_FILTER_OPTIONS}
            onValueChange={setCategoryFilter}
          />
        </AdminListFilterBar>

        <DataTable
          columns={columns}
          data={result.rows}
          getKey={(r) => r.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort as (key: string) => void}
          onRowClick={(r) =>
            void navigate(
              basePath === INTERNAL_JOBS_PATH
                ? { to: '/internal/jobs/$jobId', params: { jobId: r.id } }
                : {
                    to: `${basePath}/$rentalId` as '/admin/rentals/$rentalId',
                    params: { rentalId: r.id },
                  },
            )
          }
          emptyState={
            <div className="hub-empty-state m-6">
              <p className="text-sm text-[var(--sea-ink-soft)]">
                {hasActiveFilters ? 'No jobs match your filter.' : 'No jobs yet.'}
              </p>
            </div>
          }
        />
      </article>
      <div className="admin-pagination">
        <span>
          Page {result.page} of {totalPages} · {result.total.toLocaleString()} total
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="button-secondary"
            disabled={result.page <= 1 || loading}
            onClick={() => {
              setPage(result.page - 1)
              void load(result.page - 1)
            }}
          >
            Previous
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={result.page >= totalPages || loading}
            onClick={() => {
              setPage(result.page + 1)
              void load(result.page + 1)
            }}
          >
            Next
          </button>
        </div>
      </div>
      </>
      )}
      </div>

      {/* ── Confirm cancel ── */}
      <ConfirmActionDialog
        open={confirmingCancel != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingCancel(null)
            setCancelError(null)
          }
        }}
        title="Cancel this job?"
        description={
          confirmingCancel ? (
            <>
              This will cancel the job for{' '}
              <strong>{confirmingCancel.carPlateNumber}</strong> and release the vehicle.
              {cancelError ? (
                <span className="mt-2 block text-[var(--error)]">{cancelError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Cancel job"
        cancelLabel="Keep"
        variant="destructive"
        confirming={isCancelling}
        onConfirm={handleCancelConfirm}
      />

      {/* ── Confirm delete ── */}
      <ConfirmActionDialog
        open={canDelete && confirmingDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingDelete(null)
            setDeleteError(null)
          }
        }}
        title="Delete this job?"
        description={
          confirmingDelete ? (
            <>
              Permanently remove the job record for{' '}
              <strong>{confirmingDelete.carPlateNumber}</strong>. This cannot be undone.
              {deleteError ? (
                <span className="mt-2 block text-[var(--error)]">{deleteError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Delete"
        variant="destructive"
        confirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {/* ── Confirm handover Sheet ── */}
      <Sheet
        open={handoverRental != null}
        onOpenChange={(open) => {
          if (!open) {
            setHandoverRental(null)
            setHandoverError(null)
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Handover</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {handoverRental?.carPlateNumber ?? 'Rental'} — Confirm handover
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="list-handover-form" className="space-y-4" onSubmit={handleHandoverSubmit}>
              <div>
                <label className="field-label" htmlFor="list-ho-mileage">
                  Start mileage (km)
                </label>
                <input
                  id="list-ho-mileage"
                  type="number"
                  className="field-input"
                  value={startMileage}
                  onChange={(e) => setStartMileage(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="list-ho-condition">
                  Condition notes{' '}
                  <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                </label>
                <textarea
                  id="list-ho-condition"
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
            <Button type="submit" form="list-handover-form" disabled={isSubmittingHandover}>
              {isSubmittingHandover ? 'Confirming…' : 'Confirm handover'}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setHandoverRental(null)
                setHandoverError(null)
              }}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AdminSidebarShell>
  )
}
