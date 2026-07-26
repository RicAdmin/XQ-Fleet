import { useEffect, useState } from 'react'

import { useNavigate, useRouter } from '@tanstack/react-router'
import { Car } from 'lucide-react'

import { formatOperationDate, formatOperationTime } from '#/components/admin/operations-queue-utils'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { showAdminToast } from '#/components/ui/AdminToast'
import { Button } from '#/components/ui/button'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { Card, CardContent, CardDescription, CardHeader } from '#/components/ui/card'
import { PageHeader } from '#/components/ui/PageHeader'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { RentalType } from '#/db/schema'
import {
  formatJobDurationLabel,
  formatJobSource,
  formatJobType,
  jobBookingRef,
  toTimeHms,
  toTimeInputValue,
} from '#/lib/job-display'
import { listActivePickupLocations } from '#/lib/location-functions'
import type { RentalFullRow } from '#/lib/rental-functions'
import {
  cancelRental,
  closeReturn,
  confirmHandover,
  deleteRental,
  extendRental,
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

function ArrangementBlock({
  title,
  date,
  time,
  location,
}: {
  title: string
  date: Date
  time: string | null
  location: string | null
}) {
  return (
    <div className="job-detail-leg">
      <p className="job-detail-leg__kicker">{title}</p>
      <p className="job-detail-leg__when tabular-nums">
        {formatOperationDate(date)} · {formatOperationTime(time, date)}
      </p>
      <p className="job-detail-leg__where">{location?.trim() || '—'}</p>
    </div>
  )
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

  // Edit booking (admin / manage mode)
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

  // Cancel
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const canEditBooking =
    !isOpsMode && (rental.status === 'pending' || rental.status === 'active')

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
      showAdminToast('Booking updated.')
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to update booking.')
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
  const hasArrangementActions =
    canEditBooking || rental.status === 'pending' || rental.status === 'active'

  return (
    <AdminSidebarShell user={session.user} pageTitle="Job detail">
      <PageHeader
        variant="detail"
        backLink={{ to: listPath, label: backLabel }}
        media={
          <div className="job-detail-head-thumb" aria-hidden={!rental.carCoverPhotoUrl}>
            {rental.carCoverPhotoUrl ? (
              <img
                src={rental.carCoverPhotoUrl}
                alt={
                  rental.carCoverPhotoAlt
                  ?? ([rental.carMake, rental.carModel].filter(Boolean).join(' ')
                    || rental.carPlateNumber
                    || 'Vehicle')
                }
              />
            ) : (
              <span className="job-detail-head-thumb__placeholder">
                <Car size={28} strokeWidth={1.75} />
              </span>
            )}
          </div>
        }
        title={rental.customerFullName ?? 'Customer'}
        description={
          <div className="job-detail-head-meta">
            <div className="job-detail-head-meta__attrs">
              <span className="job-detail-head-meta__ref font-mono tabular-nums">
                {jobBookingRef(rental.id)}
              </span>
              {rental.carPlateNumber ? (
                <span className="ui-chip ui-chip--sm font-mono tabular-nums">
                  {rental.carPlateNumber}
                </span>
              ) : null}
              <span className="ui-chip ui-chip--sm">
                {formatJobSource(rental.type, rental.createdByName)}
              </span>
              <span className="ui-chip ui-chip--sm tabular-nums">
                {formatJobDurationLabel(
                  rental.startDate,
                  rental.endDate,
                  rental.extraHoursDecimal,
                )}
              </span>
            </div>
          </div>
        }
        aside={
          <div className="job-detail-head-arrangement">
            <div className="job-detail-legs job-detail-legs--head">
              <ArrangementBlock
                title="Pickup"
                date={rental.startDate}
                time={rental.pickUpTime}
                location={rental.pickUpLocation}
              />
              <ArrangementBlock
                title="Return"
                date={rental.endDate}
                time={rental.returnTime}
                location={rental.returnLocation}
              />
            </div>
          </div>
        }
      />

      <div className="job-detail">
        {rental.status === 'cancelled' ? (
          <p className="job-detail-banner">
            This job was cancelled. No charges apply.
          </p>
        ) : null}

        <div className="job-detail-grid">
          <div className="job-detail-main">
            <Card className="job-detail-card">
              {hasArrangementActions ? (
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-end gap-3">
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      {canEditBooking ? (
                        <button
                          type="button"
                          className="button-secondary job-detail-head-btn"
                          onClick={openBookingEdit}
                        >
                          Edit booking
                        </button>
                      ) : null}
                      {rental.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="button-primary job-detail-head-btn"
                            onClick={() => setHandoverOpen(true)}
                          >
                            Confirm handover
                          </button>
                          {!isOpsMode ? (
                            <button
                              type="button"
                              className="button-danger job-detail-head-btn"
                              onClick={() => {
                                setConfirmCancelOpen(true)
                                setCancelError(null)
                              }}
                            >
                              Cancel job
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      {rental.status === 'active' ? (
                        <>
                          <button
                            type="button"
                            className="button-primary job-detail-head-btn"
                            onClick={() => {
                              setPaidAmountRM('')
                              setReturnOpen(true)
                            }}
                          >
                            Close return
                          </button>
                          {!isOpsMode && session.user.role === 'owner' ? (
                            <button
                              type="button"
                              className="button-secondary job-detail-head-btn"
                              onClick={() => {
                                setNewEndDate(toDateInput(rental.endDate))
                                setExtendOpen(true)
                              }}
                            >
                              Extend job
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
              ) : null}
              <CardContent className="space-y-4">
                <dl className="job-detail-fields">
                  <DetailField label="Source">
                    {formatJobSource(rental.type, rental.createdByName)}
                  </DetailField>
                  <DetailField label="Duration">
                    {formatJobDurationLabel(
                      rental.startDate,
                      rental.endDate,
                      rental.extraHoursDecimal,
                    )}
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
              </CardHeader>
              <CardContent>
                <dl className="job-detail-fields">
                  <DetailField label="Name">
                    {rental.customerFullName ?? '—'}
                  </DetailField>
                  <DetailField label="Mobile">
                    {rental.customerPhone ?? '—'}
                  </DetailField>
                  <DetailField label="Email">
                    {rental.customerEmail ?? '—'}
                  </DetailField>
                  <DetailField label="IC / Passport">
                    {rental.customerIcOrPassport ?? '—'}
                  </DetailField>
                </dl>
              </CardContent>
            </Card>
          </div>

          <aside className="job-detail-rail">
            <Card className="job-detail-card">
              <CardHeader className="pb-2">
                <CardDescription className="island-kicker">Vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="job-detail-fields">
                  <DetailField label="Plate" mono>
                    <span className="font-semibold text-[var(--lagoon-deep)]">
                      {rental.carPlateNumber ?? '—'}
                    </span>
                  </DetailField>
                  <DetailField label="Model">
                    {[rental.carMake, rental.carModel].filter(Boolean).join(' ') || '—'}
                  </DetailField>
                  {rental.carCategory ? (
                    <DetailField label="Category">
                      {rental.carCategory}
                    </DetailField>
                  ) : null}
                </dl>
              </CardContent>
            </Card>

            <Card className="job-detail-card">
              <CardHeader className="pb-2">
                <CardDescription className="island-kicker">Payment</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="job-detail-fields">
                  <DetailField label="Total">
                    <span className="font-semibold tabular-nums">
                      {formatMYR(rental.totalAmountSen)}
                    </span>
                  </DetailField>
                  {rental.depositAmountSen > 0 ? (
                    <DetailField label="Deposit">
                      <span className="tabular-nums">{formatMYR(rental.depositAmountSen)}</span>
                    </DetailField>
                  ) : null}
                  <DetailField label="Paid">
                    <span className="tabular-nums">{formatMYR(rental.paidAmountSen)}</span>
                  </DetailField>
                  <DetailField label="Balance">
                    <span
                      className={`tabular-nums font-medium ${balanceSen > 0 ? 'text-amber-700' : ''}`}
                    >
                      {formatMYR(balanceSen)}
                    </span>
                  </DetailField>
                  <DetailField label="Status">
                    <PaymentBadge status={rental.paymentStatus} />
                  </DetailField>
                </dl>
                {(rental.status === 'active' || rental.status === 'closed') && (
                  <div className="job-detail-docs">
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
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

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

      {/* ── Edit Booking Sheet ── */}
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
            <p className="island-kicker mb-1">Booking</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Edit booking
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="booking-edit-form" className="space-y-4" onSubmit={handleBookingEditSubmit}>
              <div>
                <label className="field-label">Job type</label>
                <div className="mt-1 flex gap-3">
                  {(['booking', 'walk-in'] as RentalType[]).map((t) => (
                    <label key={t} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="booking-type"
                        value={t}
                        checked={bookingType === t}
                        onChange={() => setBookingType(t)}
                        className="accent-[var(--lagoon-deep)]"
                      />
                      <span className="text-sm text-[var(--sea-ink)]">{formatJobType(t)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="bk-start">Pickup date</label>
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
                  <label className="field-label" htmlFor="bk-pickup-time">Pickup time</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="bk-end">Return date</label>
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
                  <label className="field-label" htmlFor="bk-return-time">Return time</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="bk-pickup-loc">Pickup location</label>
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
                <div>
                  <label className="field-label" htmlFor="bk-return-loc">Return location</label>
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
              </div>

              <p className="text-sm text-[var(--sea-ink-soft)]">
                Duration and total are recalculated from the daily rate when you save.
              </p>

              {bookingError && <p className="form-error">{bookingError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="booking-edit-form" disabled={isSubmittingBooking}>
              {isSubmittingBooking ? 'Saving…' : 'Save booking'}
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
