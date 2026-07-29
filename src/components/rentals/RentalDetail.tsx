import { useCallback, useEffect, useState } from 'react'

import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import {
  CalendarPlus,
  CheckCircle2,
  History,
  KeyRound,
  Mail,
  MessageCircle,
  MoveRight,
  Phone,
  RefreshCw,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'

import { formatOperationDate, formatOperationTime } from '#/components/admin/operations-queue-utils'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { showAdminToast } from '#/components/ui/AdminToast'
import { Button } from '#/components/ui/button'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { Card, CardAction, CardContent, CardDescription, CardHeader } from '#/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { RentalType } from '#/db/schema'
import {
  formatFulfillmentLabel,
  formatJobDurationLabel,
  formatJobSource,
  formatJobType,
  jobBookingRef,
  toTimeHms,
  toTimeInputValue,
} from '#/lib/job-display'
import { listActivePickupLocations } from '#/lib/location-functions'
import type { RentalAuditEntry, RentalFullRow } from '#/lib/rental-functions'
import {
  assignRentalFulfillment,
  cancelRental,
  closeReturn,
  confirmHandover,
  confirmRentalBooking,
  deleteRental,
  extendRental,
  getRentalAuditLog,
  getRentalById,
  listOwnedPlatesForAssignment,
  renewExpiredRental,
  updateRentalBooking,
} from '#/lib/rental-functions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function formatDate(d: Date | null | undefined) {
  if (!d) return '—'
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d: Date | null | undefined) {
  if (!d) return '—'
  return d.toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function DetailField({
  label,
  children,
  mono,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="job-detail-field">
      <dt className="job-detail-field__label">{label}</dt>
      <dd className={mono ? 'job-detail-field__value font-mono' : 'job-detail-field__value'}>
        {children}
      </dd>
    </div>
  )
}

// ─── Contact links ────────────────────────────────────────────────────────────

function phoneHref(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return `tel:${cleaned}`
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits.startsWith('60') ? digits : `60${digits.replace(/^0+/, '')}`}`
}

// ─── Audit timeline descriptions ──────────────────────────────────────────────

type AuditSnapshot = Record<string, unknown> | null

function asSnapshot(value: unknown): AuditSnapshot {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function fmtAuditDate(value: unknown): string {
  if (typeof value !== 'string') return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtAuditSen(value: unknown): string {
  return typeof value === 'number' ? formatMYR(value) : '—'
}

function describeAuditEntry(entry: RentalAuditEntry): { title: string; lines: string[] } {
  const before = asSnapshot(entry.before)
  const after = asSnapshot(entry.after)
  const lines: string[] = []

  const changedLines = (labels: Record<string, (v: unknown) => string>) => {
    for (const [key, fmt] of Object.entries(labels)) {
      const b = before?.[key]
      const a = after?.[key]
      const bText = b === null || b === undefined ? '—' : fmt(b)
      const aText = a === null || a === undefined ? '—' : fmt(a)
      if (bText !== aText) lines.push(`${key}: ${bText} → ${aText}`)
    }
  }

  switch (entry.action) {
    case 'booking.create':
      return {
        title: 'Job created',
        lines: [
          [after?.type ? String(after.type) : null, `${fmtAuditDate(after?.startDate)} → ${fmtAuditDate(after?.endDate)}`, fmtAuditSen(after?.totalAmountSen)]
            .filter(Boolean)
            .join(' · '),
        ].filter(Boolean),
      }
    case 'booking.update':
      changedLines({
        startDate: fmtAuditDate,
        endDate: fmtAuditDate,
        pickUpTime: (v) => String(v).slice(0, 5),
        returnTime: (v) => String(v).slice(0, 5),
        pickUpLocation: (v) => String(v),
        returnLocation: (v) => String(v),
        totalAmountSen: fmtAuditSen,
      })
      return { title: 'Job details updated', lines }
    case 'booking.plate_change':
      changedLines({
        fulfillmentSource: (v) => formatFulfillmentLabel(v as never),
        tempPlateLabel: (v) => String(v),
      })
      return { title: 'Plate assignment changed', lines }
    case 'booking.handover':
      return {
        title: 'Handover confirmed — customer picked up',
        lines: after?.startMileage ? [`Start mileage: ${Number(after.startMileage).toLocaleString('en-MY')} km`] : [],
      }
    case 'booking.close':
      return {
        title: 'Return closed',
        lines: [
          after?.paidAmountSen ? `Collected ${fmtAuditSen(after.paidAmountSen)}${after.paymentMethod ? ` via ${String(after.paymentMethod)}` : ''}` : null,
          after?.flagDamage ? 'Damage flagged on return' : null,
          after?.endMileage ? `End mileage: ${Number(after.endMileage).toLocaleString('en-MY')} km` : null,
        ].filter((l): l is string => Boolean(l)),
      }
    case 'booking.extend':
      return {
        title: 'Job extended',
        lines: [`Return date: ${fmtAuditDate(before?.endDate)} → ${fmtAuditDate(after?.endDate)}`, after?.totalAmountSen ? `New total: ${fmtAuditSen(after.totalAmountSen)}` : null].filter(
          (l): l is string => Boolean(l),
        ),
      }
    case 'booking.cancel':
      return { title: 'Job cancelled', lines: [] }
    case 'booking.refund_request':
      return { title: 'Refund requested', lines: after?.amountSen ? [`Amount: ${fmtAuditSen(after.amountSen)}`] : [] }
    case 'booking.note':
      return { title: 'Note added', lines: after?.body ? [String(after.body)] : [] }
    default:
      return { title: entry.action, lines: [] }
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
}

function RentalStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? 'bg-slate-100 text-slate-500 border-slate-200'
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold leading-none ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
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

// ─── Props ────────────────────────────────────────────────────────────────────

type RentalDetailProps = {
  initialRental: RentalFullRow
  session: { user: { name: string; email: string; role: string } }
  listPath: string
  backLabel?: string
  jobMode?: 'manage' | 'operations'
  canDelete: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RentalDetail({
  initialRental,
  session,
  listPath,
  backLabel = 'Back to jobs',
  jobMode = 'manage',
  canDelete,
}: RentalDetailProps) {
  const isOpsMode = jobMode === 'operations'
  const navigate = useNavigate()
  const router = useRouter()
  const [rental, setRental] = useState<RentalFullRow>(initialRental)

  useEffect(() => {
    void router.preloadRoute({ to: listPath })
  }, [router, listPath])

  // Handover form
  const [handoverOpen, setHandoverOpen] = useState(false)
  const [startMileage, setStartMileage] = useState('')
  const [startCondition, setStartCondition] = useState('')
  const [handoverError, setHandoverError] = useState<string | null>(null)
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false)

  // Return form
  const [returnOpen, setReturnOpen] = useState(false)
  const [endMileage, setEndMileage] = useState('')
  const [endCondition, setEndCondition] = useState('')
  const [paidAmountRM, setPaidAmountRM] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [flagDamage, setFlagDamage] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

  // Extend form
  const [extendOpen, setExtendOpen] = useState(false)
  const [newEndDate, setNewEndDate] = useState(() => toDateInput(rental.endDate))
  const [extendError, setExtendError] = useState<string | null>(null)
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false)

  // Change job (admin / manage mode)
  const [bookingEditOpen, setBookingEditOpen] = useState(false)
  const [bookingType, setBookingType] = useState<RentalType>(rental.type)
  const [bookingStartDate, setBookingStartDate] = useState(() => toDateInput(rental.startDate))
  const [bookingEndDate, setBookingEndDate] = useState(() => toDateInput(rental.endDate))
  const [bookingPickUpTime, setBookingPickUpTime] = useState(() =>
    toTimeInputValue(rental.pickUpTime),
  )
  const [bookingReturnTime, setBookingReturnTime] = useState(() =>
    toTimeInputValue(rental.returnTime),
  )
  const [bookingPickUpLocation, setBookingPickUpLocation] = useState(
    rental.pickUpLocation ?? 'Office',
  )
  const [bookingReturnLocation, setBookingReturnLocation] = useState(
    rental.returnLocation ?? 'Office',
  )
  const [locationOptions, setLocationOptions] = useState<string[]>(['Office', 'Airport', 'Jetty'])
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)

  // Update plate
  const [plateOpen, setPlateOpen] = useState(false)
  const [plateMode, setPlateMode] = useState<'owned' | 'unassigned'>(
    rental.fulfillmentSource === 'owned' ? 'owned' : 'unassigned',
  )
  const [plateCarId, setPlateCarId] = useState(rental.assignedCarId ?? '')
  const [plateOptions, setPlateOptions] = useState<
    Array<{ id: string; plateNumber: string; status: string }>
  >([])
  const [plateLoading, setPlateLoading] = useState(false)
  const [plateError, setPlateError] = useState<string | null>(null)
  const [isSubmittingPlate, setIsSubmittingPlate] = useState(false)

  // Cancel
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Job actions sheet
  const [actionsOpen, setActionsOpen] = useState(false)

  // Activity / audit log
  const [auditEntries, setAuditEntries] = useState<RentalAuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(true)

  const loadAuditLog = useCallback(async () => {
    try {
      const rows = await getRentalAuditLog({ data: { rentalId: rental.id } })
      setAuditEntries(rows)
    } catch {
      // Timeline is informational — don't toast on failure.
    } finally {
      setAuditLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rental.id])

  useEffect(() => {
    void loadAuditLog()
  }, [loadAuditLog])

  const canEditBooking =
    !isOpsMode &&
    (rental.status === 'pending' ||
      rental.status === 'confirmed' ||
      rental.status === 'active')
  const canUpdatePlate =
    rental.status === 'pending' ||
    rental.status === 'confirmed' ||
    rental.status === 'active'
  const canConfirmBooking = !isOpsMode && rental.status === 'pending'
  const canRenew = !isOpsMode && rental.status === 'expired'

  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [renewAmountRM, setRenewAmountRM] = useState('')
  const [renewMethod, setRenewMethod] = useState<'cash' | 'bank-transfer'>('cash')
  const [renewError, setRenewError] = useState<string | null>(null)
  const [isSubmittingRenew, setIsSubmittingRenew] = useState(false)

  async function handleConfirmBooking() {
    setIsConfirmingBooking(true)
    try {
      await confirmRentalBooking({ data: { rentalId: rental.id } })
      setRental((prev) => ({ ...prev, status: 'confirmed', confirmedAt: new Date() }))
      showAdminToast('Job confirmed.')
      void loadAuditLog()
    } catch (err) {
      showAdminToast(err instanceof Error ? err.message : 'Failed to confirm job.')
    } finally {
      setIsConfirmingBooking(false)
    }
  }

  async function handleRenewSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRenewError(null)
    setIsSubmittingRenew(true)
    try {
      const result = await renewExpiredRental({
        data: {
          rentalId: rental.id,
          paymentAmountSen: Math.round(Number(renewAmountRM) * 100),
          paymentMethod: renewMethod,
        },
      })
      setRental((prev) => ({
        ...prev,
        status: result.status,
        paymentStatus: result.paymentStatus,
        confirmedAt: new Date(),
      }))
      setRenewOpen(false)
      showAdminToast('Job renewed and confirmed.')
      void loadAuditLog()
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : 'Failed to renew job.')
    } finally {
      setIsSubmittingRenew(false)
    }
  }

  useEffect(() => {
    if (!bookingEditOpen) return
    void listActivePickupLocations()
      .then((rows) => {
        const labels = rows.map((row) => row.label)
        const extras = [rental.pickUpLocation, rental.returnLocation].filter(
          (label): label is string =>
            typeof label === 'string' && label.length > 0 && !labels.includes(label),
        )
        setLocationOptions([...labels, ...extras])
      })
      .catch(() => {
        // Keep defaults; still allow editing with current values.
        const fallback = ['Office', 'Airport', 'Jetty']
        const extras = [rental.pickUpLocation, rental.returnLocation].filter(
          (label): label is string =>
            typeof label === 'string' && label.length > 0 && !fallback.includes(label),
        )
        setLocationOptions([...fallback, ...extras])
      })
  }, [bookingEditOpen, rental.pickUpLocation, rental.returnLocation])

  useEffect(() => {
    if (!plateOpen) return
    setPlateLoading(true)
    setPlateError(null)
    void listOwnedPlatesForAssignment({ data: { listingCarId: rental.carId } })
      .then((rows) => {
        setPlateOptions(rows.map((row) => ({ id: row.id, plateNumber: row.plateNumber, status: row.status })))
      })
      .catch((err) => {
        setPlateError(err instanceof Error ? err.message : 'Failed to load plates.')
        setPlateOptions([])
      })
      .finally(() => setPlateLoading(false))
  }, [plateOpen, rental.carId])

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleHandoverSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHandoverError(null)
    setIsSubmittingHandover(true)
    try {
      const result = await confirmHandover({
        data: {
          rentalId: rental.id,
          startMileage: Number(startMileage),
          startConditionNote: startCondition || undefined,
        },
      })
      setRental((prev) => ({
        ...prev,
        status: result?.status ?? 'active',
        startMileage: result?.startMileage ?? Number(startMileage),
        startConditionNote: result?.startConditionNote ?? (startCondition || null),
      }))
      setHandoverOpen(false)
      showAdminToast('Handover confirmed.')
      void loadAuditLog()
    } catch (err) {
      setHandoverError(err instanceof Error ? err.message : 'Failed to confirm handover.')
    } finally {
      setIsSubmittingHandover(false)
    }
  }

  async function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault()
    setReturnError(null)
    setIsSubmittingReturn(true)
    try {
      const result = await closeReturn({
        data: {
          rentalId: rental.id,
          endMileage: Number(endMileage),
          endConditionNote: endCondition || undefined,
          paidAmountSen: Math.round(Number(paidAmountRM) * 100),
          paymentMethod,
          flagDamage,
        },
      })
      setRental((prev) => ({
        ...prev,
        status: result?.status ?? 'closed',
        paymentStatus: result?.paymentStatus ?? prev.paymentStatus,
        endMileage: result?.endMileage ?? Number(endMileage),
        endConditionNote: result?.endConditionNote ?? (endCondition || null),
        paidAmountSen: result?.paidAmountSen ?? Math.round(Number(paidAmountRM) * 100),
        actualReturnDate: result?.actualReturnDate ?? new Date(),
      }))
      setReturnOpen(false)
      showAdminToast('Return closed.')
      void loadAuditLog()
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : 'Failed to close return.')
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  async function handleExtendSubmit(e: React.FormEvent) {
    e.preventDefault()
    setExtendError(null)
    setIsSubmittingExtend(true)
    try {
      const result = await extendRental({
        data: { rentalId: rental.id, newEndDate },
      })
      setRental((prev) => ({
        ...prev,
        endDate: result?.endDate ?? new Date(newEndDate),
        totalAmountSen: result?.totalAmountSen ?? prev.totalAmountSen,
      }))
      setExtendOpen(false)
      showAdminToast('Job extended.')
      void loadAuditLog()
    } catch (err) {
      setExtendError(err instanceof Error ? err.message : 'Failed to extend job.')
    } finally {
      setIsSubmittingExtend(false)
    }
  }

  function openBookingEdit() {
    setBookingType(rental.type)
    setBookingStartDate(toDateInput(rental.startDate))
    setBookingEndDate(toDateInput(rental.endDate))
    setBookingPickUpTime(toTimeInputValue(rental.pickUpTime))
    setBookingReturnTime(toTimeInputValue(rental.returnTime))
    setBookingPickUpLocation(rental.pickUpLocation ?? 'Office')
    setBookingReturnLocation(rental.returnLocation ?? 'Office')
    setBookingError(null)
    setBookingEditOpen(true)
  }

  function openPlateEdit() {
    setPlateMode(rental.fulfillmentSource === 'owned' ? 'owned' : 'unassigned')
    setPlateCarId(rental.assignedCarId ?? '')
    setPlateError(null)
    setPlateOpen(true)
  }

  async function handlePlateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPlateError(null)
    if (plateMode === 'owned' && !plateCarId) {
      setPlateError('Select an owned plate to assign.')
      return
    }
    setIsSubmittingPlate(true)
    try {
      await assignRentalFulfillment({
        data: {
          rentalId: rental.id,
          fulfillmentSource: plateMode,
          assignedCarId: plateMode === 'owned' ? plateCarId : null,
          tempPlateLabel: null,
        },
      })
      const refreshed = await getRentalById({ data: { rentalId: rental.id } })
      if (refreshed) setRental(refreshed)
      setPlateOpen(false)
      showAdminToast(plateMode === 'owned' ? 'Plate assigned.' : 'Plate set to hold.')
      void loadAuditLog()
    } catch (err) {
      setPlateError(err instanceof Error ? err.message : 'Failed to update plate.')
    } finally {
      setIsSubmittingPlate(false)
    }
  }

  async function handleBookingEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBookingError(null)
    setIsSubmittingBooking(true)
    try {
      const result = await updateRentalBooking({
        data: {
          rentalId: rental.id,
          type: bookingType,
          startDate: bookingStartDate,
          endDate: bookingEndDate,
          pickUpTime: toTimeHms(bookingPickUpTime),
          returnTime: toTimeHms(bookingReturnTime),
          pickUpLocation: bookingPickUpLocation,
          returnLocation: bookingReturnLocation,
        },
      })
      setRental((prev) => ({
        ...prev,
        type: result?.type ?? bookingType,
        startDate: result?.startDate ?? new Date(bookingStartDate),
        endDate: result?.endDate ?? new Date(bookingEndDate),
        pickUpTime: result?.pickUpTime ?? toTimeHms(bookingPickUpTime),
        returnTime: result?.returnTime ?? toTimeHms(bookingReturnTime),
        pickUpLocation: result?.pickUpLocation ?? bookingPickUpLocation,
        returnLocation: result?.returnLocation ?? bookingReturnLocation,
        totalAmountSen: result?.totalAmountSen ?? prev.totalAmountSen,
        paymentStatus: result?.paymentStatus ?? prev.paymentStatus,
      }))
      setBookingEditOpen(false)
      showAdminToast('Job updated.')
      void loadAuditLog()
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to update job.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  async function handleCancelConfirm() {
    setCancelError(null)
    setIsCancelling(true)
    try {
      await cancelRental({ data: { rentalId: rental.id } })
      setRental((prev) => ({ ...prev, status: 'cancelled' }))
      setConfirmCancelOpen(false)
      showAdminToast('Job cancelled.')
      void loadAuditLog()
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel job.')
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleDeleteConfirm() {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteRental({ data: { rentalId: rental.id } })
      navigate({ to: listPath as never })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete job.')
      setIsDeleting(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const balanceSen = Math.max(0, rental.totalAmountSen - rental.paidAmountSen)
  const hasArrangementActions = rental.status === 'pending' || rental.status === 'active'
  const isOwner = session.user.role === 'owner'
  const isPaid = rental.paymentStatus === 'paid'
  const paidProgressPct =
    rental.totalAmountSen > 0
      ? Math.min(100, Math.round((rental.paidAmountSen / rental.totalAmountSen) * 100))
      : 0
  const paymentChipLabel = isPaid
    ? 'Fully paid'
    : rental.paymentStatus === 'partial'
      ? `Balance ${formatMYR(balanceSen)}`
      : `Unpaid · ${formatMYR(balanceSen)}`

  // Receipt-style pricing breakdown. Older staff-created jobs only stored a
  // total — derive the rental base by subtracting the known extras.
  const breakdownDays = Math.max(
    1,
    Math.round((rental.endDate.getTime() - rental.startDate.getTime()) / 86_400_000),
  )
  const breakdownBaseSen =
    rental.baseRentalSen > 0
      ? rental.baseRentalSen
      : Math.max(
          0,
          rental.totalAmountSen -
            rental.deliveryFeeSen -
            rental.extraChargeSen -
            rental.addonsTotalSen +
            rental.discountAmountSen,
        )
  const extraHours = Number(rental.extraHoursDecimal) || 0
  const extraHourRateSen =
    extraHours > 0 ? Math.round(rental.extraChargeSen / extraHours) : 0
  const discountPct = Number(rental.discountPercent) || 0
  const hasBreakdownDetail =
    rental.baseRentalSen > 0 ||
    rental.deliveryFeeSen > 0 ||
    rental.extraChargeSen > 0 ||
    rental.addonsTotalSen > 0 ||
    rental.discountAmountSen > 0

  const waUrl = rental.customerPhone ? whatsappHref(rental.customerPhone) : null
  const showJobActions =
    hasArrangementActions || (canDelete && (rental.status === 'closed' || rental.status === 'cancelled'))

  return (
    <AdminSidebarShell user={session.user} pageTitle="Job detail">
      <div className="job-detail">
        <div className="job-detail-topbar">
          <Link to={listPath as never} className="job-detail-topbar__back">
            ← {backLabel}
          </Link>
          <div className="job-detail-topbar__meta">
            <span className="font-mono tabular-nums job-detail-topbar__ref">
              {jobBookingRef(rental.id)}
            </span>
            <RentalStatusBadge status={rental.status} />
            <PaymentBadge status={rental.paymentStatus} />
            {rental.carPlateNumber ? (
              <span className="ui-chip ui-chip--sm font-mono tabular-nums">
                {rental.carPlateNumber}
              </span>
            ) : null}
            {rental.fulfillmentSource && rental.fulfillmentSource !== 'owned' ? (
              <span className="ui-chip ui-chip--sm">
                {formatFulfillmentLabel(rental.fulfillmentSource)}
              </span>
            ) : null}
            <span className="ui-chip ui-chip--sm">
              {formatJobSource(rental)}
            </span>
          </div>
        </div>

        {rental.status === 'cancelled' ? (
          <p className="job-detail-banner">
            This job was cancelled. No charges apply.
          </p>
        ) : null}

        <div className="job-detail-grid">
          <div className="job-detail-main">
            <Card className="job-detail-card">
              <CardHeader className="pb-2">
                <h2 className="job-detail-card__title">Job</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="job-trip job-trip--card">
                  <div className="job-trip__leg">
                    <span className="job-trip__label">Pickup</span>
                    <span className="job-trip__when tabular-nums">
                      {formatOperationDate(rental.startDate)} · {formatOperationTime(rental.pickUpTime, rental.startDate)}
                    </span>
                    <span className="job-trip__where">{rental.pickUpLocation?.trim() || '—'}</span>
                  </div>
                  <div className="job-trip__sep" aria-hidden="true">
                    <span className="job-trip__duration tabular-nums">
                      {formatJobDurationLabel(
                        rental.startDate,
                        rental.endDate,
                        rental.extraHoursDecimal,
                      )}
                    </span>
                    <MoveRight className="size-4" />
                  </div>
                  <div className="job-trip__leg job-trip__leg--end">
                    <span className="job-trip__label">Return</span>
                    <span className="job-trip__when tabular-nums">
                      {formatOperationDate(rental.endDate)} · {formatOperationTime(rental.returnTime, rental.endDate)}
                    </span>
                    <span className="job-trip__where">{rental.returnLocation?.trim() || '—'}</span>
                  </div>
                </div>
                <dl className="job-detail-fields">
                  <DetailField label="Source">
                    {formatJobSource(rental)}
                  </DetailField>
                  <DetailField label="Created by">
                    {rental.createdByName ?? 'Customer (online booking)'}
                    {rental.createdAt ? ` · ${formatDateTime(rental.createdAt)}` : ''}
                  </DetailField>
                  {(rental.status === 'active' || rental.status === 'closed') && (
                    <DetailField label="Mileage">
                      {rental.startMileage != null
                        ? `${rental.startMileage.toLocaleString()} km`
                        : '—'}
                      {' → '}
                      {rental.status === 'closed' && rental.endMileage != null
                        ? `${rental.endMileage.toLocaleString()} km`
                        : 'out'}
                    </DetailField>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card className="job-detail-card">
              <CardHeader className="pb-2">
                <CardDescription className="island-kicker">Customer</CardDescription>
                {rental.customerPhone || rental.customerEmail ? (
                  <CardAction>
                    <div className="job-detail-contact-actions job-detail-contact-actions--header">
                      {rental.customerPhone ? (
                        <a
                          href={phoneHref(rental.customerPhone)}
                          className="button-secondary text-sm inline-flex items-center gap-1.5"
                        >
                          <Phone className="size-3.5" />
                          Call
                        </a>
                      ) : null}
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button-secondary text-sm inline-flex items-center gap-1.5"
                        >
                          <MessageCircle className="size-3.5" />
                          WhatsApp
                        </a>
                      ) : null}
                      {rental.customerEmail ? (
                        <a
                          href={`mailto:${rental.customerEmail}`}
                          className="button-secondary text-sm inline-flex items-center gap-1.5"
                        >
                          <Mail className="size-3.5" />
                          Email
                        </a>
                      ) : null}
                    </div>
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent>
                <dl className="job-detail-fields">
                  <DetailField label="Name">
                    {rental.customerFullName ?? '—'}
                  </DetailField>
                  <DetailField label="Mobile">
                    {rental.customerPhone ? (
                      <a className="job-detail-contact" href={phoneHref(rental.customerPhone)}>
                        {rental.customerPhone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </DetailField>
                  <DetailField label="Email">
                    {rental.customerEmail ? (
                      <a className="job-detail-contact" href={`mailto:${rental.customerEmail}`}>
                        {rental.customerEmail}
                      </a>
                    ) : (
                      '—'
                    )}
                  </DetailField>
                  <DetailField label="IC / Passport">
                    {rental.customerIcOrPassport ?? '—'}
                  </DetailField>
                </dl>
              </CardContent>
            </Card>

            <Card className="job-detail-card">
              <CardHeader className="pb-2">
                <CardDescription className="island-kicker inline-flex items-center gap-1.5">
                  <History className="size-3.5" />
                  Activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <p className="job-audit-empty">Loading activity…</p>
                ) : auditEntries.length === 0 ? (
                  <p className="job-audit-empty">
                    No recorded activity yet. Actions taken on this job will appear here.
                  </p>
                ) : (
                  <ol className="job-audit">
                    {auditEntries.map((entry) => {
                      const { title, lines } = describeAuditEntry(entry)
                      return (
                        <li key={entry.id} className="job-audit__item">
                          <span className="job-audit__dot" aria-hidden="true" />
                          <div className="job-audit__body">
                            <p className="job-audit__title">{title}</p>
                            <p className="job-audit__meta">
                              {entry.actorName ?? 'System'}
                              {entry.actorRole ? ` · ${entry.actorRole}` : ''}
                              {' · '}
                              <time dateTime={new Date(entry.createdAt).toISOString()}>
                                {new Date(entry.createdAt).toLocaleString('en-MY', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </time>
                            </p>
                            {lines.length > 0 ? (
                              <ul className="job-audit__lines">
                                {lines.map((line, i) => (
                                  <li key={i}>{line}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="job-detail-rail">
            <Card className="job-detail-card job-detail-vehicle-rail">
              <CardHeader className="pb-2">
                <CardDescription className="island-kicker">Vehicle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rental.carCoverPhotoUrl ? (
                  <div className="job-detail-vehicle__photo">
                    <img
                      src={rental.carCoverPhotoUrl}
                      alt={
                        rental.carCoverPhotoAlt
                        ?? ([rental.carMake, rental.carModel].filter(Boolean).join(' ')
                          || rental.carPlateNumber
                          || 'Vehicle')
                      }
                    />
                  </div>
                ) : null}
                <div className="job-detail-plate">
                  <p className="job-detail-plate__label">Plate</p>
                  <p className="job-detail-plate__value font-mono">
                    {rental.fulfillmentSource === 'owned'
                      ? (rental.carPlateNumber ?? '—')
                      : (rental.tempPlateLabel || rental.carPlateNumber || 'Plate TBC')}
                  </p>
                  <p className="job-detail-plate__meta">
                    <span>{formatFulfillmentLabel(rental.fulfillmentSource)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {[rental.carMake, rental.carModel].filter(Boolean).join(' ') || '—'}
                    </span>
                    {rental.carCategory ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{rental.carCategory}</span>
                      </>
                    ) : null}
                  </p>
                </div>

                {(canUpdatePlate || canEditBooking || showJobActions) ? (
                  <div className="job-detail-vehicle__actions">
                    {showJobActions ? (
                      <button
                        type="button"
                        className="button-primary job-detail-head-btn"
                        onClick={() => setActionsOpen(true)}
                      >
                        Job actions
                      </button>
                    ) : null}
                    {canUpdatePlate ? (
                      <button
                        type="button"
                        className="button-secondary job-detail-head-btn"
                        onClick={openPlateEdit}
                      >
                        Update plate
                      </button>
                    ) : null}
                    {canEditBooking ? (
                      <button
                        type="button"
                        className="button-secondary job-detail-head-btn"
                        onClick={openBookingEdit}
                      >
                        Change job
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="job-detail-card">
              <CardHeader className="pb-2">
                <CardDescription className="island-kicker">Payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="job-pay">
                  {hasBreakdownDetail ? (
                    <div className="job-pay__lines">
                      <div className="job-pay__line">
                        <span>
                          Rental
                          {rental.dailyRateSen > 0
                            ? ` · ${breakdownDays} ${breakdownDays === 1 ? 'day' : 'days'} × ${formatMYR(rental.dailyRateSen)}`
                            : ''}
                        </span>
                        <span className="tabular-nums">{formatMYR(breakdownBaseSen)}</span>
                      </div>
                      {rental.extraChargeSen > 0 ? (
                        <div className="job-pay__line">
                          <span>
                            Extra hours
                            {extraHours > 0
                              ? ` · ${extraHours}h × ${formatMYR(extraHourRateSen)}/h`
                              : ''}
                          </span>
                          <span className="tabular-nums">{formatMYR(rental.extraChargeSen)}</span>
                        </div>
                      ) : null}
                      {rental.addonsTotalSen > 0 ? (
                        <div className="job-pay__line">
                          <span>Add-ons</span>
                          <span className="tabular-nums">{formatMYR(rental.addonsTotalSen)}</span>
                        </div>
                      ) : null}
                      {rental.deliveryFeeSen > 0 ? (
                        <div className="job-pay__line">
                          <span>Delivery fee</span>
                          <span className="tabular-nums">{formatMYR(rental.deliveryFeeSen)}</span>
                        </div>
                      ) : null}
                      {rental.discountAmountSen > 0 ? (
                        <div className="job-pay__line">
                          <span>
                            Discount{discountPct > 0 ? ` · ${discountPct}%` : ''}
                          </span>
                          <span className="tabular-nums">−{formatMYR(rental.discountAmountSen)}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="job-pay__total">
                    <span>Total</span>
                    <span className="tabular-nums">{formatMYR(rental.totalAmountSen)}</span>
                  </div>
                  <div className="job-pay__lines">
                    <div className="job-pay__line">
                      <span>Paid</span>
                      <span className="tabular-nums">{formatMYR(rental.paidAmountSen)}</span>
                    </div>
                    <div className="job-pay__line job-pay__line--balance">
                      <span>Balance</span>
                      <span className="tabular-nums">{formatMYR(balanceSen)}</span>
                    </div>
                  </div>
                  <div className="job-pay__progress" role="presentation">
                    <span style={{ width: `${paidProgressPct}%` }} />
                  </div>
                  <div className="job-pay__status">
                    <span className={`ui-chip ui-chip--sm ${isPaid ? 'ui-chip--success' : 'ui-chip--danger'}`}>
                      {paymentChipLabel}
                    </span>
                  </div>
                  {rental.depositAmountSen > 0 ? (
                    <p className="job-pay__deposit">
                      Deposit {formatMYR(rental.depositAmountSen)} — collected at pickup,
                      refunded within 48h of return.
                    </p>
                  ) : null}
                </div>
                {(rental.status === 'active' ||
                  rental.status === 'closed' ||
                  (canDelete && rental.status === 'cancelled')) && (
                  <div className="job-detail-docs">
                    {rental.status === 'active' || rental.status === 'closed' ? (
                      <>
                        <a
                          href={`/api/documents/agreement/${rental.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button-secondary text-sm"
                        >
                          Agreement
                        </a>
                        <a
                          href={`/api/documents/agreement/${rental.id}?download=1`}
                          className="button-secondary text-sm"
                        >
                          Download
                        </a>
                        {rental.status === 'closed' ? (
                          <>
                            <a
                              href={`/api/documents/invoice/${rental.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button-secondary text-sm"
                            >
                              Invoice
                            </a>
                            <a
                              href={`/api/documents/invoice/${rental.id}?download=1`}
                              className="button-secondary text-sm"
                            >
                              Download
                            </a>
                          </>
                        ) : null}
                      </>
                    ) : null}
                    {canDelete && (rental.status === 'closed' || rental.status === 'cancelled') ? (
                      <button
                        type="button"
                        className="button-danger text-sm"
                        onClick={() => {
                          setDeleteError(null)
                          setConfirmDeleteOpen(true)
                        }}
                      >
                        Delete job
                      </button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* ── Job actions Sheet ── */}
      <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
        <SheetContent className="job-sheet">
          <SheetHeader>
            <SheetTitle>Job actions</SheetTitle>
          </SheetHeader>
          <div className="job-sheet-body">
            <ul className="job-actions-list">
              {canConfirmBooking ? (
                <li>
                  <button
                    type="button"
                    className="job-actions-item"
                    disabled={isConfirmingBooking}
                    onClick={() => {
                      setActionsOpen(false)
                      void handleConfirmBooking()
                    }}
                  >
                    <span className="job-actions-item__icon">
                      <CheckCircle2 className="size-4" />
                    </span>
                    <span className="job-actions-item__text">
                      <span className="job-actions-item__label">
                        {isConfirmingBooking ? 'Confirming…' : 'Confirm booking'}
                      </span>
                      <span className="job-actions-item__desc">
                        Mark this booked job as confirmed — ready for operations pickup.
                      </span>
                    </span>
                  </button>
                </li>
              ) : null}
              {canRenew ? (
                <li>
                  <button
                    type="button"
                    className="job-actions-item"
                    onClick={() => {
                      setActionsOpen(false)
                      setRenewAmountRM(((rental.totalAmountSen - rental.paidAmountSen) / 100).toFixed(2))
                      setRenewError(null)
                      setRenewOpen(true)
                    }}
                  >
                    <span className="job-actions-item__icon">
                      <RefreshCw className="size-4" />
                    </span>
                    <span className="job-actions-item__text">
                      <span className="job-actions-item__label">Renew expired job</span>
                      <span className="job-actions-item__desc">
                        Record the customer&apos;s payment to reactivate this job.
                      </span>
                    </span>
                  </button>
                </li>
              ) : null}
              {rental.status === 'confirmed' ? (
                <li>
                  <button
                    type="button"
                    className="job-actions-item"
                    onClick={() => {
                      setActionsOpen(false)
                      setHandoverOpen(true)
                    }}
                  >
                    <span className="job-actions-item__icon">
                      <KeyRound className="size-4" />
                    </span>
                    <span className="job-actions-item__text">
                      <span className="job-actions-item__label">Confirm handover</span>
                      <span className="job-actions-item__desc">
                        Record start mileage and condition — the customer picks up the car.
                      </span>
                    </span>
                  </button>
                </li>
              ) : null}
              {rental.status === 'active' ? (
                <li>
                  <button
                    type="button"
                    className="job-actions-item"
                    onClick={() => {
                      setActionsOpen(false)
                      setPaidAmountRM('')
                      setReturnOpen(true)
                    }}
                  >
                    <span className="job-actions-item__icon">
                      <Undo2 className="size-4" />
                    </span>
                    <span className="job-actions-item__text">
                      <span className="job-actions-item__label">Close return</span>
                      <span className="job-actions-item__desc">
                        Record end mileage, collect payment, and release the car.
                      </span>
                    </span>
                  </button>
                </li>
              ) : null}
              {rental.status === 'active' && !isOpsMode && isOwner ? (
                <li>
                  <button
                    type="button"
                    className="job-actions-item"
                    onClick={() => {
                      setActionsOpen(false)
                      setNewEndDate(toDateInput(rental.endDate))
                      setExtendOpen(true)
                    }}
                  >
                    <span className="job-actions-item__icon">
                      <CalendarPlus className="size-4" />
                    </span>
                    <span className="job-actions-item__text">
                      <span className="job-actions-item__label">Extend job</span>
                      <span className="job-actions-item__desc">
                        Move the return date and recalculate the total.
                      </span>
                    </span>
                  </button>
                </li>
              ) : null}
              {(rental.status === 'pending' || rental.status === 'confirmed') && !isOpsMode ? (
                <li>
                  <button
                    type="button"
                    className="job-actions-item job-actions-item--danger"
                    onClick={() => {
                      setActionsOpen(false)
                      setCancelError(null)
                      setConfirmCancelOpen(true)
                    }}
                  >
                    <span className="job-actions-item__icon">
                      <X className="size-4" />
                    </span>
                    <span className="job-actions-item__text">
                      <span className="job-actions-item__label">Cancel job</span>
                      <span className="job-actions-item__desc">
                        Cancel this reservation — requires confirmation.
                      </span>
                    </span>
                  </button>
                </li>
              ) : null}
              {canDelete && (rental.status === 'closed' || rental.status === 'cancelled') ? (
                <li>
                  <button
                    type="button"
                    className="job-actions-item job-actions-item--danger"
                    onClick={() => {
                      setActionsOpen(false)
                      setDeleteError(null)
                      setConfirmDeleteOpen(true)
                    }}
                  >
                    <span className="job-actions-item__icon">
                      <Trash2 className="size-4" />
                    </span>
                    <span className="job-actions-item__text">
                      <span className="job-actions-item__label">Delete record</span>
                      <span className="job-actions-item__desc">
                        Permanently remove this job from the system — requires confirmation.
                      </span>
                    </span>
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Confirm Handover Sheet ── */}
      <Sheet open={handoverOpen} onOpenChange={(open) => { if (!open) { setHandoverOpen(false); setHandoverError(null) } }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Handover</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Confirm vehicle handover
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="handover-form" className="space-y-4" onSubmit={handleHandoverSubmit}>
              <div>
                <label className="field-label" htmlFor="ho-mileage">Start mileage (km)</label>
                <input
                  id="ho-mileage"
                  type="number"
                  className="field-input"
                  value={startMileage}
                  onChange={(e) => setStartMileage(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ho-condition">Condition notes <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span></label>
                <textarea
                  id="ho-condition"
                  className="field-input min-h-[80px]"
                  value={startCondition}
                  onChange={(e) => setStartCondition(e.target.value)}
                  placeholder="e.g. Minor scratches on rear bumper…"
                />
              </div>
              {handoverError && <p className="form-error">{handoverError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="handover-form" disabled={isSubmittingHandover}>
              {isSubmittingHandover ? 'Confirming…' : 'Confirm handover'}
            </Button>
            <Button variant="outline" type="button" onClick={() => { setHandoverOpen(false); setHandoverError(null) }}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Close Return Sheet ── */}
      <Sheet open={returnOpen} onOpenChange={(open) => { if (!open) { setReturnOpen(false); setReturnError(null) } }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Return</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Close vehicle return
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="return-form" className="space-y-4" onSubmit={handleReturnSubmit}>
              <div>
                <label className="field-label" htmlFor="ret-mileage">End mileage (km)</label>
                <input
                  id="ret-mileage"
                  type="number"
                  className="field-input"
                  value={endMileage}
                  onChange={(e) => setEndMileage(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ret-condition">Condition notes <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span></label>
                <textarea
                  id="ret-condition"
                  className="field-input min-h-[80px]"
                  value={endCondition}
                  onChange={(e) => setEndCondition(e.target.value)}
                  placeholder="e.g. No issues observed…"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ret-paid">Amount paid (RM)</label>
                <input
                  id="ret-paid"
                  type="number"
                  className="field-input"
                  value={paidAmountRM}
                  onChange={(e) => setPaidAmountRM(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder={`0.00 (total: ${formatMYR(rental.totalAmountSen)})`}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ret-method">Payment method</label>
                <select
                  id="ret-method"
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
                  id="ret-damage"
                  type="checkbox"
                  className="mt-0.5 accent-[var(--lagoon-deep)]"
                  checked={flagDamage}
                  onChange={(e) => setFlagDamage(e.target.checked)}
                />
                <label htmlFor="ret-damage" className="text-sm text-[var(--sea-ink)] cursor-pointer">
                  Flag car as damaged after return
                </label>
              </div>
              {returnError && <p className="form-error">{returnError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="return-form" disabled={isSubmittingReturn}>
              {isSubmittingReturn ? 'Closing…' : 'Close return'}
            </Button>
            <Button variant="outline" type="button" onClick={() => { setReturnOpen(false); setReturnError(null) }}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Extend Rental Sheet ── */}
      <Sheet open={extendOpen} onOpenChange={(open) => { if (!open) { setExtendOpen(false); setExtendError(null) } }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Extend</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Extend job
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="extend-form" className="space-y-4" onSubmit={handleExtendSubmit}>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Current end date: <strong className="text-[var(--sea-ink)]">{formatDate(rental.endDate)}</strong>
              </p>
              <div>
                <label className="field-label" htmlFor="ext-date">New end date</label>
                <input
                  id="ext-date"
                  type="date"
                  className="field-input"
                  value={newEndDate}
                  min={toDateInput(rental.startDate)}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  required
                />
              </div>
              {extendError && <p className="form-error">{extendError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="extend-form" disabled={isSubmittingExtend}>
              {isSubmittingExtend ? 'Extending…' : 'Extend rental'}
            </Button>
            <Button variant="outline" type="button" onClick={() => { setExtendOpen(false); setExtendError(null) }}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Renew expired job Sheet ── */}
      <Sheet open={renewOpen} onOpenChange={(open) => { if (!open) { setRenewOpen(false); setRenewError(null) } }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Renew</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Renew expired job
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="renew-form" className="space-y-4" onSubmit={handleRenewSubmit}>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                This job expired after 72 hours without confirmation. Record the
                customer&apos;s payment to reactivate it as <strong className="text-[var(--sea-ink)]">confirmed</strong>.
              </p>
              <div>
                <label className="field-label" htmlFor="renew-amount">Payment received (RM)</label>
                <input
                  id="renew-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="field-input"
                  value={renewAmountRM}
                  onChange={(e) => setRenewAmountRM(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="renew-method">Payment method</label>
                <select
                  id="renew-method"
                  className="field-input"
                  value={renewMethod}
                  onChange={(e) => setRenewMethod(e.target.value as 'cash' | 'bank-transfer')}
                >
                  <option value="cash">Cash</option>
                  <option value="bank-transfer">Bank transfer</option>
                </select>
              </div>
              {renewError && <p className="form-error">{renewError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="renew-form" disabled={isSubmittingRenew}>
              {isSubmittingRenew ? 'Renewing…' : 'Renew & confirm'}
            </Button>
            <Button variant="outline" type="button" onClick={() => { setRenewOpen(false); setRenewError(null) }}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Update Plate Sheet ── */}
      <Sheet
        open={plateOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPlateOpen(false)
            setPlateError(null)
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Vehicle</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Update plate
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="plate-form" className="space-y-4" onSubmit={handlePlateSubmit}>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Listing{' '}
                <strong className="text-[var(--sea-ink)]">
                  {[rental.carMake, rental.carModel].filter(Boolean).join(' ') || 'vehicle'}
                </strong>
                {rental.listingPlateNumber ? (
                  <>
                    {' '}
                    · listing plate{' '}
                    <span className="font-mono text-[var(--sea-ink)]">{rental.listingPlateNumber}</span>
                  </>
                ) : null}
              </p>

              <div>
                <label className="field-label">Assignment</label>
                <div className="mt-1 flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="plate-mode"
                      value="owned"
                      checked={plateMode === 'owned'}
                      onChange={() => setPlateMode('owned')}
                      className="accent-[var(--lagoon-deep)]"
                    />
                    <span className="text-sm text-[var(--sea-ink)]">Owned plate</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="plate-mode"
                      value="unassigned"
                      checked={plateMode === 'unassigned'}
                      onChange={() => setPlateMode('unassigned')}
                      className="accent-[var(--lagoon-deep)]"
                    />
                    <span className="text-sm text-[var(--sea-ink)]">Hold (plate TBC)</span>
                  </label>
                </div>
              </div>

              {plateMode === 'owned' ? (
                <div>
                  <label className="field-label" htmlFor="plate-car">
                    Plate
                  </label>
                  <select
                    id="plate-car"
                    className="field-input"
                    value={plateCarId}
                    onChange={(e) => setPlateCarId(e.target.value)}
                    disabled={plateLoading}
                    required
                  >
                    <option value="">{plateLoading ? 'Loading plates…' : 'Select plate'}</option>
                    {plateOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.plateNumber}
                        {opt.status !== 'available' ? ` (${opt.status})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="rounded-md border border-[var(--line)] bg-[var(--ui-canvas)] px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
                  Job stays on the listing model until an owned plate is assigned at handover.
                </p>
              )}

              {plateError ? <p className="form-error">{plateError}</p> : null}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="plate-form" disabled={isSubmittingPlate || plateLoading}>
              {isSubmittingPlate ? 'Saving…' : 'Save plate'}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setPlateOpen(false)
                setPlateError(null)
              }}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Change Job Sheet ── */}
      <Sheet
        open={bookingEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBookingEditOpen(false)
            setBookingError(null)
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Job</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Change job
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="booking-edit-form" className="space-y-5" onSubmit={handleBookingEditSubmit}>
              <div>
                <label className="field-label">Job type</label>
                <div className="job-segment mt-1" role="radiogroup" aria-label="Job type">
                  {(['booking', 'walk-in'] as RentalType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={bookingType === t}
                      className={
                        bookingType === t ? 'job-segment__btn is-active' : 'job-segment__btn'
                      }
                      onClick={() => setBookingType(t)}
                    >
                      {formatJobType(t)}
                    </button>
                  ))}
                </div>
              </div>

              <fieldset className="job-edit-section">
                <legend className="job-edit-section__legend">Pickup</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="bk-start">Date</label>
                    <input
                      id="bk-start"
                      type="date"
                      className="field-input"
                      value={bookingStartDate}
                      onChange={(e) => setBookingStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="bk-pickup-time">Time</label>
                    <input
                      id="bk-pickup-time"
                      type="time"
                      className="field-input"
                      value={bookingPickUpTime}
                      onChange={(e) => setBookingPickUpTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="field-label" htmlFor="bk-pickup-loc">Location</label>
                  <select
                    id="bk-pickup-loc"
                    className="field-input"
                    value={bookingPickUpLocation}
                    onChange={(e) => setBookingPickUpLocation(e.target.value)}
                    required
                  >
                    {locationOptions.map((label) => (
                      <option key={`pu-${label}`} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              <fieldset className="job-edit-section">
                <legend className="job-edit-section__legend">Return</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="bk-end">Date</label>
                    <input
                      id="bk-end"
                      type="date"
                      className="field-input"
                      value={bookingEndDate}
                      min={bookingStartDate || undefined}
                      onChange={(e) => setBookingEndDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="bk-return-time">Time</label>
                    <input
                      id="bk-return-time"
                      type="time"
                      className="field-input"
                      value={bookingReturnTime}
                      onChange={(e) => setBookingReturnTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="field-label" htmlFor="bk-return-loc">Location</label>
                  <select
                    id="bk-return-loc"
                    className="field-input"
                    value={bookingReturnLocation}
                    onChange={(e) => setBookingReturnLocation(e.target.value)}
                    required
                  >
                    {locationOptions.map((label) => (
                      <option key={`rt-${label}`} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              {(() => {
                const s = new Date(bookingStartDate)
                const e = new Date(bookingEndDate)
                const days =
                  Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())
                    ? null
                    : Math.round((e.getTime() - s.getTime()) / 86_400_000)
                const valid = days !== null && days > 0
                const totalSen = valid && rental.dailyRateSen > 0 ? days * rental.dailyRateSen : null
                return (
                  <div className="job-edit-summary">
                    <div className="job-edit-summary__row">
                      <span>Duration</span>
                      <strong className="tabular-nums">
                        {valid ? `${days} ${days === 1 ? 'day' : 'days'}` : '—'}
                      </strong>
                    </div>
                    <div className="job-edit-summary__row">
                      <span>Estimated new total</span>
                      <strong className="tabular-nums">
                        {totalSen !== null ? formatMYR(totalSen) : '—'}
                      </strong>
                    </div>
                    <p className="job-edit-summary__note">
                      Final total is recalculated from the daily rate when you save.
                    </p>
                  </div>
                )
              })()}

              {bookingError && <p className="form-error">{bookingError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="booking-edit-form" disabled={isSubmittingBooking}>
              {isSubmittingBooking ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setBookingEditOpen(false)
                setBookingError(null)
              }}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Confirm cancel ── */}
      <ConfirmActionDialog
        open={confirmCancelOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmCancelOpen(false)
            setCancelError(null)
          }
        }}
        title="Cancel this job?"
        description={
          <>
            The job for <strong>{rental.carPlateNumber}</strong> will be cancelled and the vehicle released.
            {cancelError ? (
              <span className="mt-2 block text-[var(--error)]">{cancelError}</span>
            ) : null}
          </>
        }
        confirmLabel="Cancel job"
        cancelLabel="Keep"
        variant="destructive"
        confirming={isCancelling}
        onConfirm={handleCancelConfirm}
      />

      {/* ── Confirm delete ── */}
      <ConfirmActionDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteOpen(false)
            setDeleteError(null)
          }
        }}
        title="Delete this job?"
        description={
          <>
            This will permanently remove the job record for{' '}
            <strong>{rental.carPlateNumber}</strong>. This cannot be undone.
            {deleteError ? (
              <span className="mt-2 block text-[var(--error)]">{deleteError}</span>
            ) : null}
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        confirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </AdminSidebarShell>
  )
}
