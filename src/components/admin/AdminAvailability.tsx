import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate } from '@tanstack/react-router'
import { CalendarDays, ChevronLeft, ChevronRight, ImageOff, Search, X } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { showAdminToast } from '#/components/ui/AdminToast'
import { AdminQuickFilterChips } from '#/components/ui/AdminListFilterBar'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import { Button } from '#/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#/components/ui/combobox'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import {
  getCarRentalDates,
  getFleetAvailability,
  type AvailabilityCarRow,
  type CarRentalDateRange,
} from '#/lib/availability-functions'
import { createWalkInCustomer, searchCustomers } from '#/lib/customer-functions'
import {
  listActivePickupLocations,
  type PickupLocationRow,
} from '#/lib/location-functions'
import {
  previewBookingPrice,
  type PricingPreview,
} from '#/lib/portal-booking-functions'
import { createJobsFromAvailability } from '#/lib/rental-functions'
import { cn } from '#/lib/utils'

function locationSelectLabel(location: PickupLocationRow): string {
  if (location.kind === 'hotel') return 'Others'
  return location.label
}

function formatSelectedLocation(location: PickupLocationRow, otherDetail: string): string {
  if (location.kind === 'hotel') {
    const detail = otherDetail.trim()
    return detail ? `Others · ${detail}` : 'Others'
  }
  return location.label
}

type CustomerOption = { value: string; label: string }
type LocationOption = { value: string; label: string }

function formatLocationOption(location: PickupLocationRow): LocationOption {
  return {
    value: location.code,
    label: locationSelectLabel(location),
  }
}

function isLocationOptionEqual(a: LocationOption, b: LocationOption) {
  return a.value === b.value
}

function formatCustomerOption(row: {
  id: string
  fullName: string | null
  icOrPassport: string | null
  phone: string | null
}): CustomerOption {
  const name = row.fullName ?? 'Unnamed'
  const suffix = row.phone ?? row.icOrPassport
  return {
    value: row.id,
    label: suffix ? `${name} · ${suffix}` : name,
  }
}

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

const CAL_WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const
const CAL_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

type CalendarCell = { date: Date; inMonth: boolean }

function buildMonthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - startOffset)
  const cells: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push({ date, inMonth: date.getMonth() === month })
    if (i >= 27 && !cells[cells.length - 1].inMonth && (i + 1) % 7 === 0) break
  }
  return cells
}

function dayKey(date: Date): string {
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

function buildBookedDayMap(rentalRanges: CarRentalDateRange[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const range of rentalRanges) {
    const start = new Date(range.startDate)
    const end = new Date(range.endDate)
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    while (cursor <= last) {
      const key = dayKey(cursor)
      if (map.get(key) !== 'active') map.set(key, range.status)
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return map
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function RentalMonthGrid({
  year,
  month,
  today,
  bookedDays,
  selStart,
  selEnd,
  onDayClick,
}: {
  year: number
  month: number
  today: Date
  bookedDays: Map<string, string>
  selStart: string | null
  selEnd: string | null
  onDayClick: (day: string) => void
}) {
  const cells = buildMonthCells(year, month)
  return (
    <div className="avail-cal-month">
      <p className="avail-cal-month__name">
        {CAL_MONTH_NAMES[month]} {year}
      </p>
      <div className="avail-cal-month__grid" role="grid">
        {CAL_WEEKDAY_LABELS.map((label) => (
          <span key={label} className="avail-cal-month__weekday">
            {label}
          </span>
        ))}
        {cells.map((cell) => {
          const key = dayKey(cell.date)
          const bookedStatus = bookedDays.get(key)
          const isToday = sameDay(cell.date, today)
          const isStart = selStart === key
          const isEnd = selEnd === key
          const inRange =
            selStart !== null &&
            selEnd !== null &&
            key > selStart &&
            key < selEnd
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              disabled={Boolean(bookedStatus)}
              title={
                bookedStatus
                  ? `${key} · ${bookedStatus === 'active' ? 'Rented' : 'Reserved'}`
                  : key
              }
              aria-pressed={isStart || isEnd}
              aria-label={key}
              onClick={() => onDayClick(key)}
              className={cn(
                'avail-cal-month__day',
                !cell.inMonth && 'avail-cal-month__day--outside',
                isToday && 'avail-cal-month__day--today',
                bookedStatus === 'active' && 'avail-cal-month__day--rented',
                bookedStatus === 'pending' && 'avail-cal-month__day--reserved',
                inRange && 'avail-cal-month__day--in-range',
                (isStart || isEnd) && 'avail-cal-month__day--selected',
              )}
            >
              {cell.date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function openNativeInputPicker(event: React.MouseEvent<HTMLInputElement>) {
  const input = event.currentTarget
  if (typeof input.showPicker !== 'function') return
  try {
    input.showPicker()
  } catch {
    // Some browsers reject showPicker outside a direct user gesture.
  }
}

type CreateFieldKey =
  | 'customerId'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'email'
  | 'jobStartDate'
  | 'jobEndDate'
  | 'pickUpTime'
  | 'returnTime'
  | 'pickUpOtherDetail'
  | 'returnOtherDetail'

function capitalizeNameInput(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function validateCustomerFirstName(value: string): string | null {
  if (!value.trim()) return 'First name is required.'
  return null
}

function validateCustomerLastName(value: string): string | null {
  if (!value.trim()) return 'Last name is required.'
  return null
}

function formatCustomerFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}

function validateCustomerPhone(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Mobile number is required.'
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return 'Enter a valid mobile number.'
  return null
}

function validateCustomerEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.'
  return null
}

type AvailabilityStatusFilter =
  | 'all'
  | 'available'
  | 'reserved'
  | 'rented'
  | 'maintenance'

type AdminAvailabilityProps = {
  session: { user: { name: string; email: string; role: string } }
  initialStartDate?: string
  initialEndDate?: string
  initialCars?: AvailabilityCarRow[]
}

const DATE_DEBOUNCE_MS = 400
const SEARCH_DEBOUNCE_MS = 300

function matchesSearch(row: AvailabilityCarRow, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    row.make,
    row.model,
    row.plateNumber,
    String(row.year),
    row.category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

export default function AdminAvailability({
  session,
  initialStartDate,
  initialEndDate,
  initialCars,
}: AdminAvailabilityProps) {
  const navigate = useNavigate()
  const skipInitialLoad = useRef(Boolean(initialCars))
  const [startDate, setStartDate] = useState(initialStartDate ?? '')
  const [endDate, setEndDate] = useState(initialEndDate ?? '')
  const [debouncedStartDate, setDebouncedStartDate] = useState(initialStartDate ?? '')
  const [debouncedEndDate, setDebouncedEndDate] = useState(initialEndDate ?? '')
  const [category, setCategory] = useState<CarCategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatusFilter>('available')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [selectedCarIds, setSelectedCarIds] = useState<Set<string>>(() => new Set())
  const [cars, setCars] = useState<AvailabilityCarRow[]>(initialCars ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [calendarCarId, setCalendarCarId] = useState<string | null>(null)
  const [calendarRentals, setCalendarRentals] = useState<CarRentalDateRange[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarAnchor, setCalendarAnchor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [calSelStart, setCalSelStart] = useState<string | null>(null)
  const [calSelEnd, setCalSelEnd] = useState<string | null>(null)
  const [calPickUpTime, setCalPickUpTime] = useState('09:00')
  const [calReturnTime, setCalReturnTime] = useState('09:00')
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [customerSearchInput, setCustomerSearchInput] = useState('')
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  })
  const [jobStartDate, setJobStartDate] = useState(initialStartDate ?? '')
  const [jobEndDate, setJobEndDate] = useState(initialEndDate ?? '')
  const [pickUpTime, setPickUpTime] = useState('09:00')
  const [returnTime, setReturnTime] = useState('09:00')
  const [locationOptions, setLocationOptions] = useState<PickupLocationRow[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [pickUpKind, setPickUpKind] = useState('')
  const [returnKind, setReturnKind] = useState('')
  const [pickUpOtherDetail, setPickUpOtherDetail] = useState('')
  const [returnOtherDetail, setReturnOtherDetail] = useState('')
  const [depositRM, setDepositRM] = useState('0')
  const [childSeat, setChildSeat] = useState(false)
  const [secondDriver, setSecondDriver] = useState(false)
  const [xqBookingId, setXqBookingId] = useState('')
  const [remark, setRemark] = useState('')
  const [pricingPreview, setPricingPreview] = useState<PricingPreview | null>(null)
  const [pricingError, setPricingError] = useState<string | null>(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createTouched, setCreateTouched] = useState<Partial<Record<CreateFieldKey, boolean>>>({})
  const [showCreateValidation, setShowCreateValidation] = useState(false)

  const hasDateRange = Boolean(debouncedStartDate && debouncedEndDate)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await getFleetAvailability({
        data: {
          ...(hasDateRange
            ? { startDate: debouncedStartDate, endDate: debouncedEndDate }
            : {}),
          category: category === 'all' ? undefined : category,
        },
      })
      setCars(result.cars)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability.')
    } finally {
      setLoading(false)
    }
  }

  function clearDates() {
    setStartDate('')
    setEndDate('')
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStartDate(startDate)
      setDebouncedEndDate(endDate)
    }, DATE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [startDate, endDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
    const hasStart = Boolean(debouncedStartDate)
    const hasEnd = Boolean(debouncedEndDate)
    if (hasStart !== hasEnd) return

    setSelectedCarId(null)
    setSelectedCarIds(new Set())
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedStartDate, debouncedEndDate, category])

  const statusCounts = useMemo(() => {
    return {
      all: cars.length,
      available: cars.filter((car) => car.status === 'available').length,
      reserved: cars.filter((car) => car.status === 'reserved').length,
      rented: cars.filter((car) => car.status === 'rented').length,
      maintenance: cars.filter((car) => car.status === 'maintenance').length,
    }
  }, [cars])

  const statusOptions = useMemo(
    () =>
      [
        { value: 'all' as const, label: `Total ${statusCounts.all}` },
        { value: 'available' as const, label: `Available ${statusCounts.available}` },
        { value: 'reserved' as const, label: `Reserved ${statusCounts.reserved}` },
        { value: 'rented' as const, label: `Rented ${statusCounts.rented}` },
        { value: 'maintenance' as const, label: `Maintenance ${statusCounts.maintenance}` },
      ],
    [statusCounts],
  )

  const browseCars = useMemo(() => {
    return cars.filter((car) => {
      if (statusFilter !== 'all' && car.status !== statusFilter) return false
      return matchesSearch(car, search)
    })
  }, [cars, statusFilter, search])

  const tableCars = useMemo(() => {
    if (!selectedCarId) return browseCars
    return browseCars.filter((car) => car.id === selectedCarId)
  }, [browseCars, selectedCarId])

  useEffect(() => {
    if (selectedCarId && !browseCars.some((car) => car.id === selectedCarId)) {
      setSelectedCarId(null)
    }
  }, [browseCars, selectedCarId])

  useEffect(() => {
    setSelectedCarIds((current) => {
      const visible = new Set(browseCars.map((car) => car.id))
      const next = new Set([...current].filter((id) => visible.has(id)))
      return next.size === current.size ? current : next
    })
  }, [browseCars])

  function toggleCarSelection(carId: string) {
    setSelectedCarIds((current) => {
      const next = new Set(current)
      if (next.has(carId)) next.delete(carId)
      else next.add(carId)
      return next
    })
  }

  function removeCarFromSelection(carId: string) {
    if (selectedCarIds.size <= 1) {
      showAdminToast('At least one vehicle is required to create a job.')
      return
    }
    setSelectedCarIds((current) => {
      const next = new Set(current)
      next.delete(carId)
      return next
    })
    if (selectedCarId === carId) setSelectedCarId(null)
  }

  function selectAllVisible() {
    setSelectedCarIds(new Set(tableCars.map((car) => car.id)))
  }

  function unselectAll() {
    setSelectedCarIds(new Set())
  }

  const allVisibleSelected =
    tableCars.length > 0 && tableCars.every((car) => selectedCarIds.has(car.id))
  const someVisibleSelected = tableCars.some((car) => selectedCarIds.has(car.id))

  const calendarCar = useMemo(
    () => (calendarCarId ? cars.find((car) => car.id === calendarCarId) ?? null : null),
    [calendarCarId, cars],
  )
  const calendarToday = new Date()
  const bookedDayMap = useMemo(() => buildBookedDayMap(calendarRentals), [calendarRentals])
  const calendarMonths = useMemo(() => {
    const months: { year: number; month: number }[] = []
    for (let i = 0; i < 6; i++) {
      const date = new Date(calendarAnchor.year, calendarAnchor.month + i, 1)
      months.push({ year: date.getFullYear(), month: date.getMonth() })
    }
    return months
  }, [calendarAnchor])

  function shiftCalendarAnchor(delta: number) {
    setCalendarAnchor((current) => {
      const date = new Date(current.year, current.month + delta, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  function handleCalendarDayClick(key: string) {
    if (bookedDayMap.has(key)) {
      showAdminToast('That date is already booked.')
      return
    }
    if (!calSelStart || (calSelStart && calSelEnd)) {
      setCalSelStart(key)
      setCalSelEnd(null)
      return
    }
    if (key <= calSelStart) {
      setCalSelStart(key)
      return
    }
    const cursor = new Date(`${calSelStart}T00:00:00`)
    const last = new Date(`${key}T00:00:00`)
    while (cursor <= last) {
      if (bookedDayMap.has(dayKey(cursor))) {
        showAdminToast('Selected range overlaps a booked date.')
        return
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    setCalSelEnd(key)
  }

  function createJobFromCalendar() {
    if (!calendarCar || !calSelStart || !calSelEnd) return
    setSelectedCarId(calendarCar.id)
    setSelectedCarIds(new Set([calendarCar.id]))
    setJobStartDate(calSelStart)
    setJobEndDate(calSelEnd)
    setPickUpTime(calPickUpTime)
    setReturnTime(calReturnTime)
    setCreateError(null)
    resetCustomerFields()
    setCalendarCarId(null)
    setCreateOpen(true)
  }

  async function openRentalCalendar(carId: string) {
    setCalendarCarId(carId)
    setCalendarRentals([])
    setCalendarLoading(true)
    setCalSelStart(null)
    setCalSelEnd(null)
    setCalPickUpTime('09:00')
    setCalReturnTime('09:00')
    const now = new Date()
    setCalendarAnchor({ year: now.getFullYear(), month: now.getMonth() })
    try {
      const result = await getCarRentalDates({ data: { carId } })
      setCalendarRentals(result.rentals)
    } catch (err) {
      setCalendarCarId(null)
      showAdminToast(
        err instanceof Error ? err.message : 'Failed to load rental calendar.',
      )
    } finally {
      setCalendarLoading(false)
    }
  }

  const columns = useMemo<Column<AvailabilityCarRow>[]>(
    () => [
      {
        key: 'select',
        header: 'Select',
        headerContent: (
          <input
            type="checkbox"
            className="avail-table__checkbox"
            checked={allVisibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected
            }}
            disabled={!someVisibleSelected}
            onClick={(e) => {
              e.preventDefault()
              if (someVisibleSelected) unselectAll()
            }}
            aria-label="Clear vehicle selection"
          />
        ),
        headerClassName: 'avail-table__col-select',
        cellClassName: 'avail-table__col-select',
        render: (row) => (
          <input
            type="checkbox"
            className="avail-table__checkbox"
            checked={selectedCarIds.has(row.id)}
            onChange={() => toggleCarSelection(row.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${row.make} ${row.model}`}
          />
        ),
      },
      {
        key: 'vehicle',
        header: 'Vehicle',
        render: (row) => (
          <div className="fleet-vehicle-cell">
            <div className="fleet-vehicle-cell__media" aria-hidden>
              {row.coverPhotoUrl ? (
                <img src={row.coverPhotoUrl} alt="" className="fleet-vehicle-cell__img" />
              ) : (
                <span className="fleet-vehicle-cell__placeholder">
                  <ImageOff size={18} strokeWidth={1.75} />
                </span>
              )}
            </div>
            <div className="fleet-vehicle-cell__body">
              <div className="fleet-vehicle-cell__name">
                {row.make} {row.model} ({row.year})
              </div>
              <p className="fleet-vehicle-cell__meta">
                {row.plateNumber ?? 'No plate'} · {row.category}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Fleet status',
        render: (row) => <StatusBadge status={row.status} size="sm" />,
      },
      {
        key: 'capacity',
        header: 'Capacity',
        render: (row) => (
          <span className="text-sm">
            {row.numberOfUnits}+{row.overbookUnits}
            {hasDateRange ? ` · ${row.blockingRentals} booked` : null}
          </span>
        ),
      },
      {
        key: 'trip',
        header: 'Trip window',
        render: (row) =>
          hasDateRange ? (
            <span
              className={
                row.availableForTrip
                  ? 'text-sm font-semibold text-[var(--success)]'
                  : 'text-sm font-semibold text-[var(--error)]'
              }
            >
              {row.availableForTrip ? 'Available' : 'Unavailable'}
            </span>
          ) : (
            <span className="text-sm text-[var(--sea-ink-soft)]">—</span>
          ),
      },
      {
        key: 'rate',
        header: 'Daily rate',
        headerClassName: 'text-right',
        cellClassName: 'text-right font-mono text-sm',
        render: (row) => formatMYR(row.dailyRateSen),
      },
    ],
    [selectedCarIds, allVisibleSelected, someVisibleSelected, tableCars.length, hasDateRange],
  )

  const selectedCars = useMemo(
    () => cars.filter((car) => selectedCarIds.has(car.id)),
    [cars, selectedCarIds],
  )

  const selectedCapacity = useMemo(() => {
    const selfOwned = selectedCars.reduce((sum, car) => sum + Math.max(0, car.numberOfUnits), 0)
    const sourceCar = selectedCars.reduce((sum, car) => sum + Math.max(0, car.overbookUnits), 0)
    return { selfOwned, sourceCar }
  }, [selectedCars])

  const selectedCustomerItem =
    customerOptions.find((item) => item.value === customerId) ?? null

  const customerItems = useMemo<CustomerOption[]>(() => {
    if (!selectedCustomerItem) return customerOptions
    if (customerOptions.some((item) => item.value === selectedCustomerItem.value)) {
      return customerOptions
    }
    return [selectedCustomerItem, ...customerOptions]
  }, [customerOptions, selectedCustomerItem])

  const locationItems = useMemo(
    () => locationOptions.map(formatLocationOption),
    [locationOptions],
  )

  const selectedPickUpItem =
    locationItems.find((item) => item.value === pickUpKind) ?? null
  const selectedReturnItem =
    locationItems.find((item) => item.value === returnKind) ?? null

  async function loadCustomers(query?: string) {
    setCustomerSearchLoading(true)
    try {
      const rows = await searchCustomers({
        data: { q: query?.trim() || undefined, limit: 30 },
      })
      setCustomerOptions(rows.map(formatCustomerOption))
    } catch {
      setCustomerOptions([])
    } finally {
      setCustomerSearchLoading(false)
    }
  }

  function resetCustomerFields() {
    setCustomerMode('existing')
    setCustomerId('')
    setCustomerSearchInput('')
    setNewCustomer({ firstName: '', lastName: '', phone: '', email: '' })
    setCreateTouched({})
    setShowCreateValidation(false)
  }

  function setCustomerEntryMode(mode: 'existing' | 'new') {
    setCustomerMode(mode)
    setCreateTouched({})
    setShowCreateValidation(false)
    if (mode === 'existing') {
      setNewCustomer({ firstName: '', lastName: '', phone: '', email: '' })
      return
    }
    setCustomerId('')
    setCustomerSearchInput('')
  }

  const pickUpPreset = locationOptions.find((row) => row.code === pickUpKind)
  const returnPreset = locationOptions.find((row) => row.code === returnKind)
  const pickUpNeedsOther = pickUpPreset?.kind === 'hotel'
  const returnNeedsOther = returnPreset?.kind === 'hotel'

  const resolvedPickUpLocation = pickUpPreset
    ? formatSelectedLocation(pickUpPreset, pickUpOtherDetail)
    : ''
  const resolvedReturnLocation = returnPreset
    ? formatSelectedLocation(returnPreset, returnOtherDetail)
    : ''

  const createFieldErrors = useMemo(() => {
    const errors: Partial<Record<CreateFieldKey, string>> = {}

    if (customerMode === 'existing') {
      if (!customerId) errors.customerId = 'Select a customer.'
    } else {
      const firstNameError = validateCustomerFirstName(newCustomer.firstName)
      if (firstNameError) errors.firstName = firstNameError

      const lastNameError = validateCustomerLastName(newCustomer.lastName)
      if (lastNameError) errors.lastName = lastNameError

      const phoneError = validateCustomerPhone(newCustomer.phone)
      if (phoneError) errors.phone = phoneError

      const emailError = validateCustomerEmail(newCustomer.email)
      if (emailError) errors.email = emailError
    }

    if (!jobStartDate) errors.jobStartDate = 'Pickup date is required.'
    if (!jobEndDate) {
      errors.jobEndDate = 'Return date is required.'
    } else if (jobStartDate && jobEndDate <= jobStartDate) {
      errors.jobEndDate = 'Return date must be after pickup date.'
    }

    if (!pickUpTime) errors.pickUpTime = 'Pickup time is required.'
    if (!returnTime) errors.returnTime = 'Return time is required.'

    if (pickUpNeedsOther && !pickUpOtherDetail.trim()) {
      errors.pickUpOtherDetail = 'Enter the pickup location name.'
    }
    if (returnNeedsOther && !returnOtherDetail.trim()) {
      errors.returnOtherDetail = 'Enter the return location name.'
    }

    return errors
  }, [
    customerMode,
    customerId,
    newCustomer,
    jobStartDate,
    jobEndDate,
    pickUpTime,
    returnTime,
    pickUpNeedsOther,
    returnNeedsOther,
    pickUpOtherDetail,
    returnOtherDetail,
  ])

  function shouldShowCreateFieldError(field: CreateFieldKey) {
    return showCreateValidation || Boolean(createTouched[field])
  }

  function touchCreateField(field: CreateFieldKey) {
    setCreateTouched((prev) => ({ ...prev, [field]: true }))
  }

  function createInputInvalid(field: CreateFieldKey) {
    return shouldShowCreateFieldError(field) && Boolean(createFieldErrors[field])
  }

  function resetCreateValidation() {
    setCreateTouched({})
    setShowCreateValidation(false)
  }

  function closeCreateJobsSheet() {
    setCreateOpen(false)
    setCreateError(null)
    resetCreateValidation()
  }

  function markAllCreateFieldsTouched() {
    setCreateTouched({
      customerId: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      jobStartDate: true,
      jobEndDate: true,
      pickUpTime: true,
      returnTime: true,
      pickUpOtherDetail: true,
      returnOtherDetail: true,
    })
  }

  async function loadPickupLocations() {
    setLocationsLoading(true)
    try {
      const rows = await listActivePickupLocations()
      setLocationOptions(rows)
      const fallback = rows[0]?.code ?? ''
      setPickUpKind((current) =>
        rows.some((row) => row.code === current) ? current : fallback,
      )
      setReturnKind((current) =>
        rows.some((row) => row.code === current) ? current : fallback,
      )
    } catch {
      setLocationOptions([])
    } finally {
      setLocationsLoading(false)
    }
  }

  useEffect(() => {
    void loadPickupLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!createOpen) return
    setJobStartDate(debouncedStartDate)
    setJobEndDate(debouncedEndDate)
    void loadPickupLocations()
    void loadCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, debouncedStartDate, debouncedEndDate])

  useEffect(() => {
    if (!createOpen || customerMode !== 'existing') return
    const timer = setTimeout(() => {
      void loadCustomers(customerSearchInput)
    }, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, customerMode, customerSearchInput])

  useEffect(() => {
    if (!createOpen || selectedCars.length === 0) {
      setPricingPreview(null)
      setPricingError(null)
      return
    }
    if (!jobStartDate || !jobEndDate || jobEndDate <= jobStartDate) {
      setPricingPreview(null)
      setPricingError(null)
      return
    }
    if (!resolvedPickUpLocation || !resolvedReturnLocation) return
    if (pickUpNeedsOther && !pickUpOtherDetail.trim()) return
    if (returnNeedsOther && !returnOtherDetail.trim()) return

    const timer = setTimeout(() => {
      setPricingLoading(true)
      setPricingError(null)
      void previewBookingPrice({
        data: {
          carId: selectedCars[0]!.id,
          startDate: jobStartDate,
          endDate: jobEndDate,
          pickUpTime: pickUpTime.length === 5 ? `${pickUpTime}:00` : pickUpTime,
          returnTime: returnTime.length === 5 ? `${returnTime}:00` : returnTime,
          pickUpLocation: resolvedPickUpLocation,
          returnLocation: resolvedReturnLocation,
          childSeat,
          secondDriver,
        },
      })
        .then((result) => {
          if ('error' in result) {
            setPricingPreview(null)
            setPricingError(result.error)
            return
          }
          setPricingPreview(result)
        })
        .catch((err) => {
          setPricingPreview(null)
          setPricingError(err instanceof Error ? err.message : 'Unable to preview pricing.')
        })
        .finally(() => setPricingLoading(false))
    }, 350)

    return () => clearTimeout(timer)
  }, [
    createOpen,
    selectedCars,
    jobStartDate,
    jobEndDate,
    pickUpTime,
    returnTime,
    resolvedPickUpLocation,
    resolvedReturnLocation,
    pickUpNeedsOther,
    returnNeedsOther,
    pickUpOtherDetail,
    returnOtherDetail,
    childSeat,
    secondDriver,
  ])

  async function handleCreateJobs(e: React.FormEvent) {
    e.preventDefault()
    setShowCreateValidation(true)
    markAllCreateFieldsTouched()

    const firstFieldError = Object.values(createFieldErrors)[0]
    if (firstFieldError) {
      setCreateError(firstFieldError)
      return
    }

    if (selectedCarIds.size === 0) {
      setCreateError('Select at least one vehicle.')
      return
    }
    if (!pickUpPreset || !returnPreset) {
      setCreateError('Select pickup and return locations.')
      return
    }

    let resolvedCustomerId = customerId
    setCreating(true)
    setCreateError(null)
    try {
      if (customerMode === 'new') {
        const created = await createWalkInCustomer({
          data: {
            fullName: formatCustomerFullName(newCustomer.firstName, newCustomer.lastName),
            phone: newCustomer.phone,
            email: newCustomer.email || undefined,
          },
        })
        resolvedCustomerId = created.id
      }

      const result = await createJobsFromAvailability({
        data: {
          carIds: [...selectedCarIds],
          customerId: resolvedCustomerId,
          startDate: jobStartDate,
          endDate: jobEndDate,
          pickUpTime: pickUpTime.length === 5 ? `${pickUpTime}:00` : pickUpTime,
          returnTime: returnTime.length === 5 ? `${returnTime}:00` : returnTime,
          pickUpLocation: formatSelectedLocation(pickUpPreset, pickUpOtherDetail),
          returnLocation: formatSelectedLocation(returnPreset, returnOtherDetail),
          depositAmountSen: Math.round(Number(depositRM || '0') * 100),
          childSeat,
          secondDriver,
          remark: remark.trim() || undefined,
          xqBookingId: xqBookingId.trim() || undefined,
        },
      })
      setSelectedCarIds(new Set())
      resetCustomerFields()
      setRemark('')
      setXqBookingId('')
      setChildSeat(false)
      setSecondDriver(false)
      showAdminToast(
        `Created ${result.count} in-house job${result.count === 1 ? '' : 's'}.`,
      )
      await load()
      void navigate({ to: '/internal/jobs' })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create jobs.')
    } finally {
      setCreating(false)
    }
  }

  function clearClientFilters() {
    setSearchInput('')
    setSearch('')
    setStatusFilter('available')
    setSelectedCarId(null)
    setSelectedCarIds(new Set())
  }

  const hasClientFilters =
    statusFilter !== 'available' ||
    search.length > 0 ||
    selectedCarId !== null ||
    selectedCarIds.size > 0

  return (
    <AdminSidebarShell user={session.user} pageTitle="Availability">
      <PageHeader
        title="Availability"
        description="Fleet inventory and booking capacity for a custom date range."
      />

      <article className="workspace-panel island-shell space-y-4 p-4">
        <div className="avail-toolbar">
          <div className="avail-toolbar__top">
            <div className="avail-toolbar__dates">
              <p className="avail-toolbar__dates-title">Search date</p>
              <div>
                <label className="field-label" htmlFor="avail-from">
                  From
                </label>
                <input
                  id="avail-from"
                  type="date"
                  className="field-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="avail-to">
                  To
                </label>
                <input
                  id="avail-to"
                  type="date"
                  className="field-input"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {startDate || endDate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  className="avail-toolbar__dates-clear"
                  aria-label="Clear dates"
                  onClick={clearDates}
                >
                  <X />
                </Button>
              ) : null}
            </div>

            <AdminQuickFilterChips
              label="Category"
              value={category}
              options={CAR_CATEGORY_FILTER_OPTIONS}
              onValueChange={(value) => setCategory(value as CarCategoryFilter)}
              className="avail-toolbar__category"
            />
          </div>

          <div className="avail-toolbar__middle">
            <div className="avail-toolbar__search">
              <InputGroup className="admin-filter-search">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  placeholder="Search car model or plate…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search car model or plate"
                />
                {searchInput ? (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Clear search"
                      onClick={() => setSearchInput('')}
                    >
                      <X />
                    </InputGroupButton>
                  </InputGroupAddon>
                ) : null}
                <InputGroupAddon align="inline-end" className="admin-filter-search__summary">
                  {browseCars.length} vehicle{browseCars.length === 1 ? '' : 's'}
                </InputGroupAddon>
              </InputGroup>
              {hasClientFilters ? (
                <Button type="button" variant="outline" size="sm" onClick={clearClientFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>

            <AdminQuickFilterChips
              label="Status"
              value={statusFilter}
              options={statusOptions}
              onValueChange={(value) => {
                setStatusFilter(value as AvailabilityStatusFilter)
                setSelectedCarId(null)
              }}
              className="avail-toolbar__status"
            />
          </div>
        </div>

        {error ? (
          <ErrorPanel title="Could not load availability" message={error} onRetry={load} />
        ) : null}

        {loading && !cars.length ? <TableSkeleton rows={8} columns={5} /> : null}

        {!loading || cars.length ? (
          <>
            <div className="avail-car-picker" role="listbox" aria-label="Select vehicle">
              {browseCars.length === 0 ? (
                <p className="avail-car-picker__empty text-sm text-[var(--sea-ink-soft)]">
                  No vehicles match these filters.
                </p>
              ) : (
                browseCars.map((car) => {
                  const selected = selectedCarId === car.id
                  return (
                    <div
                      key={car.id}
                      role="option"
                      tabIndex={0}
                      aria-selected={selected}
                      className={cn('avail-car-card', selected && 'avail-car-card--selected')}
                      onClick={() =>
                        setSelectedCarId((current) => (current === car.id ? null : car.id))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedCarId((current) => (current === car.id ? null : car.id))
                        }
                      }}
                    >
                      <div className="avail-car-card__media">
                        {car.coverPhotoUrl ? (
                          <img
                            src={car.coverPhotoUrl}
                            alt=""
                            className="avail-car-card__img"
                          />
                        ) : (
                          <span className="avail-car-card__placeholder" aria-hidden>
                            <ImageOff size={22} strokeWidth={1.75} />
                          </span>
                        )}
                        <StatusBadge
                          status={car.status}
                          size="sm"
                          className="avail-car-card__ribbon"
                        />
                      </div>
                      <div className="avail-car-card__body">
                        <span className="avail-car-card__name">
                          {car.make} {car.model}
                        </span>
                        <span className="avail-car-card__plate">
                          {car.plateNumber ?? 'No plate'}
                        </span>
                        <div className="avail-car-card__actions">
                          <Button
                            type="button"
                            size="sm"
                            className="avail-car-card__create"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCarId(car.id)
                              setSelectedCarIds(new Set([car.id]))
                              setCreateError(null)
                              resetCustomerFields()
                              setCreateOpen(true)
                            }}
                          >
                            Create job
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="avail-car-card__calendar-btn"
                            tabIndex={-1}
                            aria-label={`View rental calendar for ${car.make} ${car.model}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              void openRentalCalendar(car.id)
                            }}
                          >
                            <CalendarDays size={14} strokeWidth={2} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="avail-selection-bar">
              <span className="avail-selection-bar__count">
                {selectedCarIds.size} selected
              </span>
              <div className="avail-selection-bar__actions">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={tableCars.length === 0 || allVisibleSelected}
                  onClick={selectAllVisible}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={selectedCarIds.size === 0}
                  onClick={unselectAll}
                >
                  Unselect all
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={selectedCarIds.size === 0}
                  onClick={() => {
                    setCreateError(null)
                    resetCustomerFields()
                    setCreateOpen(true)
                  }}
                >
                  Create jobs
                </Button>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={tableCars}
              getKey={(row) => row.id}
              onRowClick={(row) => toggleCarSelection(row.id)}
              className={cn(someVisibleSelected && 'avail-table--has-selection')}
              emptyState={
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No vehicles match this filter.
                </div>
              }
            />
          </>
        ) : null}
      </article>

      <Sheet
        open={calendarCarId !== null}
        onOpenChange={(open) => {
          if (!open) setCalendarCarId(null)
        }}
      >
        <SheetContent
          side="right"
          className="cxq-dashboard-root flex w-[80vw] max-w-[80vw] flex-col gap-0 p-0 data-[side=right]:w-[80vw] data-[side=right]:max-w-[80vw] data-[side=right]:sm:max-w-[80vw]"
        >
          <SheetHeader className="avail-create-sheet__header gap-0 p-0">
            <div className="avail-create-sheet__header-main">
              <div className="avail-cal__car-head">
                <div className="avail-cal__car-media" aria-hidden>
                  {calendarCar?.coverPhotoUrl ? (
                    <img
                      src={calendarCar.coverPhotoUrl}
                      alt=""
                      className="avail-cal__car-img"
                    />
                  ) : (
                    <span className="avail-cal__car-placeholder">
                      <ImageOff size={22} strokeWidth={1.75} />
                    </span>
                  )}
                </div>
                <div className="avail-create-sheet__header-copy">
                  <p className="avail-create-sheet__eyebrow">Rental calendar</p>
                  <SheetTitle className="avail-create-sheet__title">
                    {calendarCar
                      ? `${calendarCar.make} ${calendarCar.model}`
                      : 'Vehicle'}
                  </SheetTitle>
                  <p className="avail-create-sheet__subtitle">
                    {calendarCar?.plateNumber ?? 'No plate'} · Booked dates
                  </p>
                </div>
              </div>
              <div className="avail-cal__nav">
                <p className="avail-cal__nav-title">Browse months</p>
                <div className="avail-cal__nav-buttons">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Previous months"
                    onClick={() => shiftCalendarAnchor(-1)}
                  >
                  <ChevronLeft size={16} strokeWidth={2} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date()
                      setCalendarAnchor({ year: now.getFullYear(), month: now.getMonth() })
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Next months"
                    onClick={() => shiftCalendarAnchor(1)}
                  >
                    <ChevronRight size={16} strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {calendarLoading ? (
              <TableSkeleton rows={6} columns={7} />
            ) : (
              <div className="avail-cal">
                <div className="avail-cal__legend">
                  <span className="avail-cal__legend-item">
                    <span className="avail-cal__legend-swatch avail-cal__legend-swatch--rented" />
                    Rented
                  </span>
                  <span className="avail-cal__legend-item">
                    <span className="avail-cal__legend-swatch avail-cal__legend-swatch--reserved" />
                    Reserved
                  </span>
                  <span className="avail-cal__legend-item">
                    <span className="avail-cal__legend-swatch avail-cal__legend-swatch--today" />
                    Today
                  </span>
                </div>

                <section className="avail-cal__months" aria-label="Booked dates by month">
                  {calendarMonths.map(({ year, month }) => {
                    const anchorKey = calSelEnd ?? calSelStart
                    const monthPrefix = `${year}-${`${month + 1}`.padStart(2, '0')}`
                    const showSelectionHere =
                      calSelStart !== null && anchorKey?.startsWith(monthPrefix)
                    return (
                      <Fragment key={`${year}-${month}`}>
                        <RentalMonthGrid
                          year={year}
                          month={month}
                          today={calendarToday}
                          bookedDays={bookedDayMap}
                          selStart={calSelStart}
                          selEnd={calSelEnd}
                          onDayClick={handleCalendarDayClick}
                        />
                        {showSelectionHere ? (
                          <div className="avail-cal__selection">
                            <div className="avail-cal__selection-field">
                              <label
                                className="avail-cal__selection-label"
                                htmlFor="avail-cal-start"
                              >
                                Pickup
                              </label>
                              <div className="avail-cal__selection-controls">
                                <span className="avail-cal__selection-date">
                                  {calSelStart}
                                </span>
                                <input
                                  id="avail-cal-start"
                                  type="time"
                                  className="avail-cal__time-input"
                                  value={calPickUpTime}
                                  onChange={(e) => setCalPickUpTime(e.target.value)}
                                  onClick={openNativeInputPicker}
                                  aria-label="Pickup time"
                                />
                              </div>
                            </div>
                            <div className="avail-cal__selection-field">
                              <label
                                className="avail-cal__selection-label"
                                htmlFor="avail-cal-end"
                              >
                                Return
                              </label>
                              <div className="avail-cal__selection-controls">
                                <span className="avail-cal__selection-date">
                                  {calSelEnd ?? 'Select end date'}
                                </span>
                                <input
                                  id="avail-cal-end"
                                  type="time"
                                  className="avail-cal__time-input"
                                  value={calReturnTime}
                                  onChange={(e) => setCalReturnTime(e.target.value)}
                                  onClick={openNativeInputPicker}
                                  aria-label="Return time"
                                />
                              </div>
                            </div>
                            <div className="avail-cal__selection-actions">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCalSelStart(null)
                                  setCalSelEnd(null)
                                }}
                              >
                                Clear
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={!calSelEnd}
                                onClick={createJobFromCalendar}
                              >
                                Create job
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </section>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={createOpen}
        disablePointerDismissal
        onOpenChange={(open) => {
          if (open) setCreateOpen(true)
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="cxq-dashboard-root flex w-[80vw] max-w-[80vw] flex-col gap-0 p-0 data-[side=right]:w-[80vw] data-[side=right]:max-w-[80vw] data-[side=right]:sm:max-w-[80vw]"
        >
          <SheetHeader className="avail-create-sheet__header gap-0 p-0">
            <div className="avail-create-sheet__header-main">
              <div className="avail-create-sheet__header-copy">
                <p className="avail-create-sheet__eyebrow">Availability</p>
                <SheetTitle className="avail-create-sheet__title">
                  Create in-house jobs
                </SheetTitle>
                <p className="avail-create-sheet__subtitle">
                  {selectedCars.length} vehicle{selectedCars.length === 1 ? '' : 's'} selected ·
                  each becomes its own rental job
                </p>
              </div>
              <div
                className="avail-create-sheet__capacity-card"
                aria-label={`Reserving: ${selectedCapacity.selfOwned} self owned, ${selectedCapacity.sourceCar} source car`}
              >
                <p className="avail-create-sheet__capacity-label">Reserving</p>
                <p className="avail-create-sheet__capacity-value tabular-nums">
                  {selectedCapacity.selfOwned}
                  <span className="avail-create-sheet__capacity-sep" aria-hidden="true">
                    –
                  </span>
                  {selectedCapacity.sourceCar}
                </p>
                <div className="avail-create-sheet__capacity-chips">
                  <span className="avail-create-sheet__capacity-chip">
                    Self owned <strong>{selectedCapacity.selfOwned}</strong>
                  </span>
                  <span className="avail-create-sheet__capacity-chip">
                    Source car <strong>{selectedCapacity.sourceCar}</strong>
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <form id="avail-create-jobs" className="avail-create-form" onSubmit={handleCreateJobs}>
              <section className="avail-create-panel avail-create-panel--fleet">
                <header className="avail-create-panel__head">
                  <p className="avail-create-panel__title">Fleet</p>
                  <p className="avail-create-panel__meta">
                    {selectedCars.length} vehicle{selectedCars.length === 1 ? '' : 's'} selected
                  </p>
                </header>
                <div className="avail-create-panel__body">
                  <ul className="avail-create-vehicles" aria-label="Selected vehicles">
                    {selectedCars.map((car) => (
                      <li key={car.id} className="avail-car-card avail-create-vehicle-card">
                        <button
                          type="button"
                          className="avail-create-vehicle-card__remove"
                          disabled={selectedCars.length <= 1}
                          aria-label={
                            selectedCars.length <= 1
                              ? 'At least one vehicle is required'
                              : `Remove ${car.make} ${car.model}`
                          }
                          onClick={() => removeCarFromSelection(car.id)}
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                        <div className="avail-car-card__media" aria-hidden>
                          {car.coverPhotoUrl ? (
                            <img
                              src={car.coverPhotoUrl}
                              alt=""
                              className="avail-car-card__img"
                            />
                          ) : (
                            <span className="avail-car-card__placeholder">
                              <ImageOff size={18} strokeWidth={1.75} />
                            </span>
                          )}
                        </div>
                        <div className="avail-car-card__body">
                          <span className="avail-car-card__name">
                            {car.make} {car.model}
                          </span>
                          <span className="avail-car-card__plate font-mono">
                            {car.plateNumber ?? 'No plate'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <div className="avail-create-form__body">
                <div className="avail-create-form__main">
                  <section className="avail-create-panel">
                    <header className="avail-create-panel__head">
                      <p className="avail-create-panel__title">Customer</p>
                      <p className="avail-create-panel__meta">Who is this booking for?</p>
                    </header>
                    <div className="avail-create-panel__body">
                      <div
                        className="avail-create-customer__modes"
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

                      {customerMode === 'existing' ? (
                        <div>
                          <Combobox
                            items={customerItems}
                            value={selectedCustomerItem}
                            onValueChange={(item) => {
                              setCustomerId(item?.value ?? '')
                              touchCreateField('customerId')
                            }}
                            itemToStringLabel={(item) => item.label}
                            filter={null}
                          >
                            <ComboboxInput
                              id="avail-customer"
                              placeholder="Search name, phone, or IC…"
                              className="field-input w-full"
                              showClear={!!selectedCustomerItem}
                              aria-invalid={createInputInvalid('customerId')}
                              onChange={(e) => setCustomerSearchInput(e.target.value)}
                              onBlur={() => touchCreateField('customerId')}
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
                          {shouldShowCreateFieldError('customerId') && createFieldErrors.customerId ? (
                            <p className="field-error" role="alert">
                              {createFieldErrors.customerId}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="avail-create-field-grid avail-create-field-grid--2">
                          <div>
                            <label className="field-label" htmlFor="avail-new-customer-first-name">
                              First name
                            </label>
                            <input
                              id="avail-new-customer-first-name"
                              type="text"
                              className="field-input w-full"
                              value={newCustomer.firstName}
                              aria-invalid={createInputInvalid('firstName')}
                              autoComplete="given-name"
                              onChange={(e) =>
                                setNewCustomer((prev) => ({
                                  ...prev,
                                  firstName: capitalizeNameInput(e.target.value),
                                }))
                              }
                              onBlur={() => touchCreateField('firstName')}
                              placeholder="First name"
                            />
                            {shouldShowCreateFieldError('firstName') && createFieldErrors.firstName ? (
                              <p className="field-error" role="alert">
                                {createFieldErrors.firstName}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="avail-new-customer-last-name">
                              Last name
                            </label>
                            <input
                              id="avail-new-customer-last-name"
                              type="text"
                              className="field-input w-full"
                              value={newCustomer.lastName}
                              aria-invalid={createInputInvalid('lastName')}
                              autoComplete="family-name"
                              onChange={(e) =>
                                setNewCustomer((prev) => ({
                                  ...prev,
                                  lastName: capitalizeNameInput(e.target.value),
                                }))
                              }
                              onBlur={() => touchCreateField('lastName')}
                              placeholder="Last name"
                            />
                            {shouldShowCreateFieldError('lastName') && createFieldErrors.lastName ? (
                              <p className="field-error" role="alert">
                                {createFieldErrors.lastName}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="avail-new-customer-phone">
                              Mobile
                            </label>
                            <input
                              id="avail-new-customer-phone"
                              type="tel"
                              className="field-input w-full"
                              value={newCustomer.phone}
                              aria-invalid={createInputInvalid('phone')}
                              onChange={(e) =>
                                setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))
                              }
                              onBlur={() => touchCreateField('phone')}
                              placeholder="e.g. 012-345 6789"
                            />
                            {shouldShowCreateFieldError('phone') && createFieldErrors.phone ? (
                              <p className="field-error" role="alert">
                                {createFieldErrors.phone}
                              </p>
                            ) : null}
                          </div>
                          <div className="avail-create-field-grid__full">
                            <label className="field-label" htmlFor="avail-new-customer-email">
                              Email{' '}
                              <span className="text-[var(--sea-ink-soft)]">(optional)</span>
                            </label>
                            <input
                              id="avail-new-customer-email"
                              type="email"
                              className="field-input w-full"
                              value={newCustomer.email}
                              aria-invalid={createInputInvalid('email')}
                              onChange={(e) =>
                                setNewCustomer((prev) => ({ ...prev, email: e.target.value }))
                              }
                              onBlur={() => touchCreateField('email')}
                              placeholder="name@email.com"
                            />
                            {shouldShowCreateFieldError('email') && createFieldErrors.email ? (
                              <p className="field-error" role="alert">
                                {createFieldErrors.email}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="avail-create-panel">
                    <header className="avail-create-panel__head">
                      <p className="avail-create-panel__title">Trip</p>
                      <p className="avail-create-panel__meta">Dates, times, and handover points</p>
                    </header>
                    <div className="avail-create-panel__body">
                      <div className="avail-create-panel__group">
                        <p className="avail-create-panel__group-label">Schedule</p>
                        <div className="avail-create-field-grid avail-create-field-grid--2">
                          <div>
                            <label className="field-label" htmlFor="avail-job-from">
                              From
                            </label>
                            <input
                              id="avail-job-from"
                              type="date"
                              className="field-input field-input--native-picker w-full"
                              value={jobStartDate}
                              aria-invalid={createInputInvalid('jobStartDate')}
                              onChange={(e) => setJobStartDate(e.target.value)}
                              onClick={openNativeInputPicker}
                              onBlur={() => touchCreateField('jobStartDate')}
                            />
                            {shouldShowCreateFieldError('jobStartDate') &&
                            createFieldErrors.jobStartDate ? (
                              <p className="field-error" role="alert">
                                {createFieldErrors.jobStartDate}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="avail-job-to">
                              To
                            </label>
                            <input
                              id="avail-job-to"
                              type="date"
                              className="field-input field-input--native-picker w-full"
                              value={jobEndDate}
                              aria-invalid={createInputInvalid('jobEndDate')}
                              onChange={(e) => setJobEndDate(e.target.value)}
                              onClick={openNativeInputPicker}
                              onBlur={() => touchCreateField('jobEndDate')}
                            />
                            {shouldShowCreateFieldError('jobEndDate') && createFieldErrors.jobEndDate ? (
                              <p className="field-error" role="alert">
                                {createFieldErrors.jobEndDate}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="avail-pickup-time">
                              Pickup time
                            </label>
                            <input
                              id="avail-pickup-time"
                              type="time"
                              className="field-input field-input--native-picker w-full"
                              value={pickUpTime}
                              aria-invalid={createInputInvalid('pickUpTime')}
                              onChange={(e) => setPickUpTime(e.target.value)}
                              onClick={openNativeInputPicker}
                              onBlur={() => touchCreateField('pickUpTime')}
                            />
                            {shouldShowCreateFieldError('pickUpTime') && createFieldErrors.pickUpTime ? (
                              <p className="field-error" role="alert">
                                {createFieldErrors.pickUpTime}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="avail-return-time">
                              Return time
                            </label>
                            <input
                              id="avail-return-time"
                              type="time"
                              className="field-input field-input--native-picker w-full"
                              value={returnTime}
                              aria-invalid={createInputInvalid('returnTime')}
                              onChange={(e) => setReturnTime(e.target.value)}
                              onClick={openNativeInputPicker}
                              onBlur={() => touchCreateField('returnTime')}
                            />
                            {shouldShowCreateFieldError('returnTime') &&
                            createFieldErrors.returnTime ? (
                              <p className="field-error" role="alert">
                                {createFieldErrors.returnTime}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="avail-create-panel__group">
                        <p className="avail-create-panel__group-label">Locations</p>
                        <div className="avail-create-field-grid avail-create-field-grid--2">
                          <div>
                            <label className="field-label" htmlFor="avail-pickup">
                              Pickup
                            </label>
                            <Combobox
                              items={locationItems}
                              value={selectedPickUpItem}
                              onValueChange={(item) => {
                                setPickUpKind(item?.value ?? '')
                                setPickUpOtherDetail('')
                              }}
                              itemToStringLabel={(item) => item.label}
                              isItemEqualToValue={isLocationOptionEqual}
                              filter={null}
                            >
                              <ComboboxInput
                                id="avail-pickup"
                                placeholder={
                                  locationsLoading ? 'Loading locations…' : 'Select location'
                                }
                                className="field-input w-full"
                                readOnly
                                disabled={locationsLoading || locationItems.length === 0}
                                showClear={false}
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>
                                  {locationsLoading ? 'Loading locations…' : 'No locations available.'}
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
                            {pickUpNeedsOther ? (
                              <>
                                <input
                                  id="avail-pickup-other"
                                  className="field-input mt-2 w-full"
                                  value={pickUpOtherDetail}
                                  aria-invalid={createInputInvalid('pickUpOtherDetail')}
                                  onChange={(e) => setPickUpOtherDetail(e.target.value)}
                                  onBlur={() => touchCreateField('pickUpOtherDetail')}
                                  placeholder="e.g. Hotel, homestay, or address"
                                  aria-label="Pickup location name"
                                />
                                {shouldShowCreateFieldError('pickUpOtherDetail') &&
                                createFieldErrors.pickUpOtherDetail ? (
                                  <p className="field-error" role="alert">
                                    {createFieldErrors.pickUpOtherDetail}
                                  </p>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="avail-return">
                              Return
                            </label>
                            <Combobox
                              items={locationItems}
                              value={selectedReturnItem}
                              onValueChange={(item) => {
                                setReturnKind(item?.value ?? '')
                                setReturnOtherDetail('')
                              }}
                              itemToStringLabel={(item) => item.label}
                              isItemEqualToValue={isLocationOptionEqual}
                              filter={null}
                            >
                              <ComboboxInput
                                id="avail-return"
                                placeholder={
                                  locationsLoading ? 'Loading locations…' : 'Select location'
                                }
                                className="field-input w-full"
                                readOnly
                                disabled={locationsLoading || locationItems.length === 0}
                                showClear={false}
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>
                                  {locationsLoading ? 'Loading locations…' : 'No locations available.'}
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
                            {returnNeedsOther ? (
                              <>
                                <input
                                  id="avail-return-other"
                                  className="field-input mt-2 w-full"
                                  value={returnOtherDetail}
                                  aria-invalid={createInputInvalid('returnOtherDetail')}
                                  onChange={(e) => setReturnOtherDetail(e.target.value)}
                                  onBlur={() => touchCreateField('returnOtherDetail')}
                                  placeholder="e.g. Hotel, homestay, or address"
                                  aria-label="Return location name"
                                />
                                {shouldShowCreateFieldError('returnOtherDetail') &&
                                createFieldErrors.returnOtherDetail ? (
                                  <p className="field-error" role="alert">
                                    {createFieldErrors.returnOtherDetail}
                                  </p>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="avail-create-panel">
                    <header className="avail-create-panel__head">
                      <p className="avail-create-panel__title">Desk notes</p>
                      <p className="avail-create-panel__meta">Optional references for ops</p>
                    </header>
                    <div className="avail-create-panel__body">
                      <div className="avail-create-field-grid avail-create-field-grid--2">
                        <div>
                          <label className="field-label" htmlFor="avail-xq-booking-id">
                            XQ Booking ID
                          </label>
                          <input
                            id="avail-xq-booking-id"
                            className="field-input w-full"
                            value={xqBookingId}
                            onChange={(e) => setXqBookingId(e.target.value)}
                            placeholder="External / desk booking ref"
                          />
                        </div>
                        <div>
                          <label className="field-label" htmlFor="avail-deposit">
                            Deposit (RM)
                          </label>
                          <input
                            id="avail-deposit"
                            type="number"
                            min={0}
                            step={0.01}
                            className="field-input w-full"
                            value={depositRM}
                            onChange={(e) => setDepositRM(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="field-label" htmlFor="avail-remark">
                          Remark
                        </label>
                        <textarea
                          id="avail-remark"
                          className="field-input w-full"
                          rows={3}
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          placeholder="Optional note for ops"
                        />
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="avail-create-form__aside">
                  <section className="avail-create-panel">
                    <header className="avail-create-panel__head">
                      <p className="avail-create-panel__title">Add-ons</p>
                      <p className="avail-create-panel__meta">Same options as online booking</p>
                    </header>
                    <div className="avail-create-panel__body">
                      <div className="avail-create-addons">
                        <label className="avail-create-addon">
                          <input
                            type="checkbox"
                            className="avail-create-addon__checkbox"
                            checked={childSeat}
                            onChange={(e) => setChildSeat(e.target.checked)}
                          />
                          <span className="avail-create-addon__label">
                            Child safety seat
                            <span className="avail-create-addon__price">+RM 30</span>
                          </span>
                        </label>
                        <label className="avail-create-addon">
                          <input
                            type="checkbox"
                            className="avail-create-addon__checkbox"
                            checked={secondDriver}
                            onChange={(e) => setSecondDriver(e.target.checked)}
                          />
                          <span className="avail-create-addon__label">
                            Additional driver
                            <span className="avail-create-addon__price">+RM 20</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </section>

                  <div className="avail-pricing-summary">
                    <div className="avail-pricing-summary__header">
                      <div>
                        <p className="ui-label avail-pricing-summary__title">Pricing summary</p>
                        {pricingPreview ? (
                          <p className="avail-pricing-summary__subtitle">
                            {pricingPreview.days} rental day
                            {pricingPreview.days === 1 ? '' : 's'}
                            {pricingPreview.extraHours > 0
                              ? ` · +${
                                  Number.isInteger(pricingPreview.extraHours)
                                    ? pricingPreview.extraHours
                                    : pricingPreview.extraHours.toFixed(1)
                                }h${
                                  pricingPreview.extraRule === 'full-day-cap' ? ' (day cap)' : ''
                                }`
                              : ''}
                          </p>
                        ) : null}
                      </div>
                      {pricingPreview && pricingPreview.breakdown.length > 0 ? (
                        <div className="avail-pricing-summary__seasons">
                          {(['Low', 'Peak', 'Super Peak'] as const).map((season) => {
                            const count = pricingPreview.breakdown.filter(
                              (day) => day.seasonType === season,
                            ).length
                            if (count === 0) return null
                            return (
                              <span
                                key={season}
                                className={`avail-pricing-summary__season avail-pricing-summary__season--${season === 'Super Peak' ? 'super' : season.toLowerCase()}`}
                              >
                                {count} {season}
                              </span>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>

                    {pricingLoading ? (
                      <p className="avail-pricing-summary__empty">Calculating…</p>
                    ) : null}
                    {pricingError ? <p className="form-error">{pricingError}</p> : null}

                    {pricingPreview ? (
                      <>
                        <table className="avail-pricing-summary__table">
                          <tbody>
                            <tr>
                              <th scope="row">
                                Base rental
                                <span className="avail-pricing-summary__detail">
                                  {pricingPreview.days} day{pricingPreview.days === 1 ? '' : 's'}
                                </span>
                              </th>
                              <td>RM {pricingPreview.baseRental.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <th scope="row">
                                Extra charge
                                {pricingPreview.extraHours > 0 ? (
                                  <span className="avail-pricing-summary__detail">
                                    {pricingPreview.extraRule === 'full-day-cap'
                                      ? 'full-day cap'
                                      : `${Number.isInteger(pricingPreview.extraHours) ? pricingPreview.extraHours : pricingPreview.extraHours.toFixed(1)}h hourly`}
                                  </span>
                                ) : null}
                              </th>
                              <td>
                                {pricingPreview.extraCharge > 0
                                  ? `RM ${pricingPreview.extraCharge.toFixed(2)}`
                                  : '—'}
                              </td>
                            </tr>
                            <tr>
                              <th scope="row">Delivery</th>
                              <td>
                                {pricingPreview.deliveryFee > 0
                                  ? `RM ${pricingPreview.deliveryFee.toFixed(2)}`
                                  : '—'}
                              </td>
                            </tr>
                            <tr>
                              <th scope="row">Add-ons</th>
                              <td>
                                {pricingPreview.addonsTotal > 0
                                  ? `RM ${pricingPreview.addonsTotal.toFixed(2)}`
                                  : '—'}
                              </td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr>
                              <th scope="row">Total</th>
                              <td>RM {pricingPreview.finalTotal.toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                        {selectedCars.length > 1 ? (
                          <p className="avail-pricing-summary__note">
                            Based on the first selected vehicle. Each job is priced individually when
                            created.
                          </p>
                        ) : null}
                      </>
                    ) : !pricingLoading && !pricingError ? (
                      <p className="avail-pricing-summary__empty">
                        Set trip dates and locations to see the summary.
                      </p>
                    ) : null}
                  </div>

                  {createError ? <p className="form-error">{createError}</p> : null}
                </aside>
              </div>
            </form>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="avail-create-jobs" disabled={creating}>
              {creating
                ? 'Creating…'
                : `Create ${selectedCars.length} job${selectedCars.length === 1 ? '' : 's'}`}
            </Button>
            <Button variant="outline" type="button" onClick={closeCreateJobsSheet}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AdminSidebarShell>
  )
}
