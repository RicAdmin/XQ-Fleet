import { useCallback, useEffect, useMemo, useId, useRef, useState, type AnimationEvent, type ReactNode } from 'react'

import { authClient } from '#/lib/auth-client'
import { toCheckoutCustomer } from '#/lib/checkout-session'

import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Cog,
  MapPin,
  Phone,
} from 'lucide-react'

import { LoadingSpinner } from '#/components/ui/LoadingSpinner'
import { CheckoutInlineAuth } from '#/components/landing/CheckoutInlineAuth'
import { PaymentMethodIcons } from '#/components/landing/payment-method-icons'
import type { TranslateFn } from '#/i18n/translate'
import { usePublicI18n } from '#/i18n/usePublicI18n'
import { checkoutSearchFromBooking, bookingHasCompleteTrip } from '#/lib/checkout-trip'
import {
  clearCheckoutDraft,
  loadCheckoutDraft,
  saveCheckoutDraft,
} from '#/lib/checkout-draft-storage'
import { createPortalBooking, previewBookingPrice } from '#/lib/portal-booking-functions'
import type { PricingPreview } from '#/lib/portal-booking-functions'
import { validatePromo } from '#/lib/promo-functions'
import {
  formatExtraHours,
  formatTripDuration,
} from '#/lib/booking-datetime'
import { catalogFitInput } from '#/lib/car-catalog'
import { carLuggageFit } from '#/lib/fleet-luggage-fit'
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY_CODE,
  getCountryName,
  isValidCountryCode,
  normalizeCountryCode,
} from '#/lib/countries'
import type { PublicCarRow } from '#/lib/portal-functions'
import { buildSeasonRentalLines } from '#/lib/season-rental-breakdown'
import type { SeasonType } from '#/lib/pricing-logic'

function toTimeHms(hhmm: string): string {
  if (!hhmm) return '08:00:00'
  // Already HH:MM:SS
  if (/^\d{2}:\d{2}:\d{2}$/.test(hhmm)) return hhmm
  // 24-hour HH:MM
  if (/^\d{2}:\d{2}$/.test(hhmm)) return `${hhmm}:00`
  // 12-hour with AM/PM e.g. "10:30 AM", "4:30 PM"
  const m = hhmm.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m) {
    let h = parseInt(m[1], 10)
    const min = m[2]
    const period = m[3].toUpperCase()
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${min}:00`
  }
  return '08:00:00'
}

export type BookingState = {
  from: string
  retLoc: string
  tripType: 'round' | 'oneway'
  pickDate: Date | null
  retDate: Date | null
  pickTime: string
  retTime: string
  adults: number
  children: number
}

type SessionUserLite = { name?: string | null; email: string }

type AddonKey = 'child' | 'second'

type BuyerAddress = {
  addressLine1: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  country: string
}

type CheckoutBuyer = BuyerAddress & {
  name: string
  email: string
  phone: string
}

type CheckoutDriver = {
  name: string
  email: string
  phone: string
  license: string
  country: string
}

function formatInternationalAddress(address: BuyerAddress): string {
  const locality = [address.postalCode.trim(), address.city.trim()].filter(Boolean).join(' ')
  const region = [locality, address.stateProvince.trim()].filter(Boolean).join(', ')
  return [
    address.addressLine1.trim(),
    address.addressLine2.trim(),
    region,
    getCountryName(address.country),
  ]
    .filter(Boolean)
    .join('\n')
}

function validateBuyerAddress(address: BuyerAddress, t: TranslateFn): Record<string, string> {
  const e: Record<string, string> = {}
  if (!address.addressLine1.trim()) {
    e.buyerAddressLine1 = t('checkout.errAddressLine1')
  }
  if (!address.city.trim()) {
    e.buyerCity = t('checkout.errCity')
  }
  if (!address.postalCode.trim()) {
    e.buyerPostalCode = t('checkout.errPostalCode')
  }
  if (!address.country.trim()) {
    e.buyerCountry = t('checkout.errCountry')
  } else if (!isValidCountryCode(address.country)) {
    e.buyerCountry = t('checkout.errCountryInvalid')
  }
  return e
}

function FieldLabel({
  children,
  optional = false,
  optionalLabel,
}: {
  children: ReactNode
  optional?: boolean
  optionalLabel?: string
}) {
  return (
    <span>
      {children}
      {optional ? (
        <span className="checkout-optional"> · {optionalLabel}</span>
      ) : (
        <span className="field-required-mark" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </span>
  )
}

const CHECKOUT_AUTOFILL_ANIMATION = 'cxq-autofill-start'

function syncAutofillValue(
  event: AnimationEvent<HTMLInputElement | HTMLSelectElement>,
  apply: (value: string) => void,
) {
  if (event.animationName === CHECKOUT_AUTOFILL_ANIMATION) {
    apply(event.currentTarget.value)
  }
}

type CheckoutFieldInputProps = {
  id: string
  name: string
  autoComplete?: string
  onAutofill?: (event: AnimationEvent<HTMLInputElement | HTMLSelectElement>) => void
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

function CheckoutField({
  label,
  optional = false,
  optionalLabel,
  error,
  showError = false,
  className,
  inputId: inputIdProp,
  inputName,
  autoComplete,
  children,
}: {
  label: ReactNode
  optional?: boolean
  optionalLabel?: string
  error?: string
  showError?: boolean
  className?: string
  inputId?: string
  inputName?: string
  autoComplete?: string
  children: (field: CheckoutFieldInputProps) => ReactNode
}) {
  const generatedId = useId()
  const inputId = inputIdProp ?? generatedId.replace(/:/g, '')
  const invalid = Boolean(showError && error)

  const fieldProps: CheckoutFieldInputProps = {
    id: inputId,
    name: inputName ?? inputId,
    autoComplete,
    'aria-invalid': invalid ? true : undefined,
    'aria-describedby': invalid ? `${inputId}-error` : undefined,
    'aria-required': optional ? undefined : true,
  }

  return (
    <div
      className={['auth-field', invalid ? 'auth-field--invalid' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <label htmlFor={inputId}>
        <FieldLabel optional={optional} optionalLabel={optionalLabel}>
          {label}
        </FieldLabel>
      </label>
      {children(fieldProps)}
      {invalid ? (
        <em id={`${inputId}-error`} className="auth-field-error" role="alert">
          {error}
        </em>
      ) : null}
    </div>
  )
}

function CheckoutPaymentIcons() {
  return <PaymentMethodIcons className="cs-pay-icons" chipClassName="cs-pay-chip" />
}

const PREVIEW_DEBOUNCE_MS = 600

const DATE_LOCALE: Record<string, string> = { en: 'en-GB', ms: 'ms-MY', zh: 'zh-CN' }

function checkoutSeasonLabel(season: SeasonType, t: TranslateFn): string {
  switch (season) {
    case 'Low':
      return t('checkout.seasonLow')
    case 'Peak':
      return t('checkout.seasonPeak')
    case 'Super Peak':
      return t('checkout.seasonSuperPeak')
  }
}

function nightsBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return 1
  const ms = b.getTime() - a.getTime()
  return ms > 0 ? Math.max(1, Math.round(ms / 86_400_000)) : 1
}

function vehicleTitle(car: PublicCarRow) {
  return `${car.year} ${car.make} ${car.model}`
}

function validateDriverEmail(value: string, t: TranslateFn): string | null {
  const v = value.trim()
  if (!v) {
    return t('checkout.errEmailRequired')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return t('checkout.errEmailInvalid')
  }
  return null
}

function validateDriverPhone(value: string, t: TranslateFn): string | null {
  const v = value.trim()
  if (!v) {
    return t('checkout.errPhoneRequired')
  }
  const digits = v.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) {
    return t('checkout.errPhoneInvalid')
  }
  return null
}

function normalizePhoneInput(value: string): string {
  if (!value || value.startsWith('+')) return value
  return `+${value}`
}

type LandingCheckoutFlowProps = {
  car: PublicCarRow
  booking: BookingState
  startYmd?: string
  endYmd?: string
  user?: SessionUserLite
  sessionPending?: boolean
  backHref: string
}

export function LandingCheckoutFlow({
  car,
  booking,
  startYmd,
  endYmd,
  user,
  sessionPending = false,
  backHref,
}: LandingCheckoutFlowProps) {
  const { t, href, locale } = usePublicI18n()
  const navigate = useNavigate()
  const autoPayAttempted = useRef(false)
  const draftStepRestored = useRef(false)

  const { data: clientSession, isPending: clientSessionPending } = authClient.useSession()
  const resolvedUser = useMemo(
    () => toCheckoutCustomer(clientSession?.user) ?? toCheckoutCustomer(user),
    [clientSession?.user, user],
  )
  const resolvedSessionPending =
    sessionPending || (clientSessionPending && !resolvedUser)

  const initialDraft = useMemo(() => loadCheckoutDraft(car.id), [car.id])

  const ADDONS = useMemo(
    () =>
      [
        {
          key: 'child' as AddonKey,
          title: t('checkout.addonChildTitle'),
          desc: t('checkout.addonChildDesc'),
          price: 30,
          per: t('checkout.oneTime'),
        },
        {
          key: 'second' as AddonKey,
          title: t('checkout.addonSecondTitle'),
          desc: t('checkout.addonSecondDesc'),
          price: 20,
          per: t('checkout.oneTime'),
        },
      ] as const,
    [t],
  )

  const checkoutSteps = useMemo(
    () => [t('checkout.stepReview'), t('checkout.stepPayment')] as const,
    [t],
  )

  const [step, setStep] = useState(0)
  const [guestCheckout, setGuestCheckout] = useState(() => initialDraft?.guestCheckout ?? false)
  const [accountAuthMode, setAccountAuthMode] = useState<'sign-in' | 'register' | null>(null)
  const [addons, setAddons] = useState<Record<AddonKey, boolean>>(() => initialDraft?.addons ?? {
    child: false,
    second: false,
  })
  const [buyer, setBuyer] = useState<CheckoutBuyer>(() => ({
    name: initialDraft?.buyer.name ?? user?.name ?? '',
    email: initialDraft?.buyer.email ?? user?.email ?? '',
    phone: initialDraft?.buyer.phone ?? '',
    addressLine1: initialDraft?.buyer.addressLine1 ?? '',
    addressLine2: initialDraft?.buyer.addressLine2 ?? '',
    city: initialDraft?.buyer.city ?? '',
    stateProvince: initialDraft?.buyer.stateProvince ?? '',
    postalCode: initialDraft?.buyer.postalCode ?? '',
    country: initialDraft?.buyer.country ?? DEFAULT_COUNTRY_CODE,
  }))
  const [driver, setDriver] = useState<CheckoutDriver>(() => ({
    name: initialDraft?.driver.name ?? user?.name ?? '',
    email: initialDraft?.driver.email ?? user?.email ?? '',
    phone: initialDraft?.driver.phone ?? '',
    license: initialDraft?.driver.license ?? '',
    country: initialDraft?.driver.country ?? DEFAULT_COUNTRY_CODE,
  }))
  const [alsoAsDriver, setAlsoAsDriver] = useState(() => initialDraft?.alsoAsDriver ?? true)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [touched, setTouched] = useState<{
    buyerEmail?: boolean
    buyerPhone?: boolean
    driverEmail?: boolean
    driverPhone?: boolean
  }>({})
  const [submitting, setSubmitting] = useState(false)
  const [flowError, setFlowError] = useState<string | null>(null)

  // Promo code state — wired to `validatePromo` server fn.
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string
    discountSen: number
  } | null>(() => initialDraft?.appliedPromo ?? null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoBusy, setPromoBusy] = useState(false)

  const [preview, setPreview] = useState<PricingPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPreview = useCallback(async () => {
    if (!bookingHasCompleteTrip(booking) || !startYmd || !endYmd) {
      setPreview(null)
      setPreviewError(null)
      return
    }
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const result = await previewBookingPrice({
        data: {
          carId: car.id,
          startDate: startYmd,
          endDate: endYmd,
          pickUpTime: toTimeHms(booking.pickTime),
          returnTime: toTimeHms(booking.retTime),
          pickUpLocation: booking.from.trim(),
          returnLocation:
            booking.tripType === 'round' ? booking.from.trim() : (booking.retLoc || booking.from).trim(),
          childSeat: addons.child,
          secondDriver: addons.second,
          couponCode: appliedPromo?.code ?? null,
        },
      })
      if ('error' in result) {
        setPreviewError(result.error)
        setPreview(null)
      } else {
        setPreview(result)
        setPreviewError(null)
      }
    } catch {
      setPreviewError(t('checkout.errPricePreview'))
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [
    car.id,
    startYmd,
    endYmd,
    booking,
    addons.child,
    addons.second,
    appliedPromo?.code,
    t,
  ])

  useEffect(() => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current)
    previewDebounceRef.current = setTimeout(() => void fetchPreview(), PREVIEW_DEBOUNCE_MS)
    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current)
    }
  }, [fetchPreview])

  const nights = preview?.days ?? nightsBetween(booking.pickDate, booking.retDate)
  const previewSubtotalSen = preview ? Math.round(preview.subTotal * 100) : 0
  const baseRentalRm = preview ? Math.round(preview.baseRental) : 0
  const extraHoursCharge = preview ? Math.round(preview.extraCharge) : 0
  const deliveryFeeRm = preview ? Math.round(preview.deliveryFee) : 0
  const discount = preview ? Math.round(preview.discountAmount) : 0
  const total = preview ? Math.round(preview.finalTotal) : 0
  const extraHours = preview?.extraHours ?? 0

  const dateLocale = DATE_LOCALE[locale] ?? 'en-GB'
  const seasonLines = useMemo(() => {
    if (!preview?.breakdown?.length) return []
    return buildSeasonRentalLines(preview.breakdown, car, dateLocale)
  }, [preview?.breakdown, car, dateLocale])

  useEffect(() => {
    if (resolvedSessionPending || draftStepRestored.current) return
    draftStepRestored.current = true
    if (resolvedUser) return
    if (initialDraft?.awaitingPayment) setStep(1)
  }, [resolvedSessionPending, resolvedUser, initialDraft?.awaitingPayment])

  useEffect(() => {
    if (initialDraft?.awaitingPayment && !resolvedUser) return
    if (resolvedUser) setGuestCheckout(false)
  }, [resolvedUser, initialDraft?.awaitingPayment])

  useEffect(() => {
    if (initialDraft?.awaitingPayment && !resolvedUser) return
    setBuyer((b) => ({
      ...b,
      name: resolvedUser?.name ?? b.name,
      email: resolvedUser?.email ?? b.email,
    }))
  }, [resolvedUser?.name, resolvedUser?.email, initialDraft?.awaitingPayment, resolvedUser])

  useEffect(() => {
    if (!alsoAsDriver) return
    setDriver((d) => ({
      ...d,
      name: buyer.name,
      email: buyer.email,
      phone: buyer.phone,
    }))
  }, [alsoAsDriver, buyer.name, buyer.email, buyer.phone])

  const pickupLoc = booking.from.trim() || t('checkout.pickupTbc')
  const returnLoc =
    booking.tripType === 'round' ? pickupLoc : booking.retLoc.trim() || pickupLoc
  const tripDuration = formatTripDuration(
    booking.pickDate,
    booking.pickTime,
    booking.retDate,
    booking.retTime,
  )

  const lug = carLuggageFit(catalogFitInput(car))

  const shouldShowError = useCallback(
    (key: string) => showFieldErrors || Boolean(touched[key as keyof typeof touched]),
    [showFieldErrors, touched],
  )

  const patchFieldError = useCallback((key: string, message: string | null) => {
    setErrs((prev) => {
      const next = { ...prev }
      if (message) next[key] = message
      else delete next[key]
      return next
    })
  }, [])

  const validateReview = useCallback(() => {
    const e: Record<string, string> = {}
    if (!buyer.name.trim()) {
      e.buyerName = t('checkout.errNameRequired')
    }
    const buyerEmailErr = validateDriverEmail(buyer.email, t)
    if (buyerEmailErr) e.buyerEmail = buyerEmailErr
    const buyerPhoneErr = validateDriverPhone(buyer.phone, t)
    if (buyerPhoneErr) e.buyerPhone = buyerPhoneErr
    Object.assign(e, validateBuyerAddress(buyer, t))

    if (!alsoAsDriver) {
      if (!driver.name.trim()) {
        e.driverName = t('checkout.errDriverName')
      }
      const driverEmailErr = validateDriverEmail(driver.email, t)
      if (driverEmailErr) e.driverEmail = driverEmailErr
      const driverPhoneErr = validateDriverPhone(driver.phone, t)
      if (driverPhoneErr) e.driverPhone = driverPhoneErr
    }

    if (!driver.license.trim()) {
      e.driverLicense = t('checkout.errDriverLicense')
    }

    setErrs(e)
    setShowFieldErrors(true)
    setTouched({
      buyerEmail: true,
      buyerPhone: true,
      driverEmail: true,
      driverPhone: true,
    })
    if (Object.keys(e).length > 0) {
      requestAnimationFrame(() => {
        document
          .querySelector('.checkout-validation-banner, .auth-field-error')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
    return Object.keys(e).length === 0
  }, [buyer, driver, alsoAsDriver, t])

  const touchValidateField = useCallback(
    (scope: 'buyer' | 'driver', field: 'email' | 'phone', value: string) => {
      const key = `${scope}${field.charAt(0).toUpperCase()}${field.slice(1)}` as
        | 'buyerEmail'
        | 'buyerPhone'
        | 'driverEmail'
        | 'driverPhone'
      setTouched((t) => ({ ...t, [key]: true }))
      const msg =
        field === 'email' ? validateDriverEmail(value, t) : validateDriverPhone(value, t)
      setErrs((prev) => {
        const next = { ...prev }
        if (msg) next[key] = msg
        else delete next[key]
        return next
      })
    },
    [t],
  )

  const updateContactField = useCallback(
    (scope: 'buyer' | 'driver', field: 'email' | 'phone', value: string) => {
      const key = `${scope}${field.charAt(0).toUpperCase()}${field.slice(1)}` as
        | 'buyerEmail'
        | 'buyerPhone'
        | 'driverEmail'
        | 'driverPhone'
      const nextValue = field === 'phone' ? normalizePhoneInput(value) : value
      const setter = scope === 'buyer' ? setBuyer : setDriver
      setter((prev) => ({ ...prev, [field]: nextValue }))
      if (touched[key]) {
        const msg =
          field === 'email'
            ? validateDriverEmail(nextValue, t)
            : validateDriverPhone(nextValue, t)
        setErrs((prev) => {
          const next = { ...prev }
          if (msg) next[key] = msg
          else delete next[key]
          return next
        })
      }
    },
    [touched, t],
  )

  const createBooking = useCallback(async () => {
    if (!bookingHasCompleteTrip(booking)) {
      setFlowError(t('checkout.errTripDatesRequired'))
      return
    }
    if (!startYmd || !endYmd) {
      setFlowError(t('checkout.errPickValidDates'))
      return
    }
    if (!preview || previewError) {
      setFlowError(previewError ?? t('checkout.errPricePreview'))
      return
    }
    setFlowError(null)
    setSubmitting(true)
    try {
      const returnLoc = booking.tripType === 'round' ? booking.from : (booking.retLoc || booking.from)
      const { rentalId: id } = await createPortalBooking({
        data: {
          carId: car.id,
          startDate: startYmd,
          endDate: endYmd,
          pickUpTime: toTimeHms(booking.pickTime),
          returnTime: toTimeHms(booking.retTime),
          pickUpLocation: booking.from.trim(),
          returnLocation: returnLoc.trim(),
          childSeat: addons.child,
          secondDriver: addons.second,
          couponCode: appliedPromo?.code ?? null,
          fullName: (alsoAsDriver ? buyer.name : driver.name).trim(),
          icOrPassport: driver.license.trim(),
          phone: (alsoAsDriver ? buyer.phone : driver.phone).trim(),
          email: buyer.email.trim(),
          address: formatInternationalAddress(buyer) || undefined,
        },
      })
      await navigate({ to: '/pay/$rentalId', params: { rentalId: id } })
      clearCheckoutDraft()
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : t('checkout.errCreateBooking'))
    } finally {
      setSubmitting(false)
    }
  }, [
    car.id,
    startYmd,
    endYmd,
    buyer,
    driver,
    alsoAsDriver,
    booking,
    addons,
    navigate,
    appliedPromo,
    preview,
    previewError,
    t,
  ])

  const applyPromoCode = useCallback(async () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoBusy(true)
    setPromoError(null)
    try {
      const result = await validatePromo({
        data: {
          code,
          cartContext: {
            carId: car.id,
            carCategory: car.category,
            subTotalSen: previewSubtotalSen,
            customerEmail: buyer.email.trim() || undefined,
          },
        },
      })
      if (result.valid) {
        setAppliedPromo({ code: result.code, discountSen: result.discountSen })
      } else {
        setAppliedPromo(null)
        setPromoError(result.reason)
      }
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : t('checkout.errValidatePromo'))
    } finally {
      setPromoBusy(false)
    }
  }, [promoInput, car.id, car.category, previewSubtotalSen, buyer.email, t])

  const removePromoCode = useCallback(() => {
    setAppliedPromo(null)
    setPromoError(null)
    setPromoInput('')
  }, [])

  // If the subtotal changes (date adjustments etc.), re-validate the applied
  // promo silently. This keeps the discount accurate without surprising
  // failures at checkout.
  useEffect(() => {
    if (!appliedPromo) return
    let cancelled = false
    void (async () => {
      try {
        const res = await validatePromo({
          data: {
            code: appliedPromo.code,
            cartContext: {
              carId: car.id,
              carCategory: car.category,
              subTotalSen: previewSubtotalSen,
              customerEmail: buyer.email.trim() || undefined,
            },
          },
        })
        if (cancelled) return
        if (res.valid) {
          setAppliedPromo({ code: res.code, discountSen: res.discountSen })
        } else {
          setAppliedPromo(null)
          setPromoError(res.reason)
        }
      } catch {
        // Ignore — user can retry manually.
      }
    })()
    return () => {
      cancelled = true
    }
    // Intentionally not depending on buyer.email — only re-validate on cart
    // size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSubtotalSen, car.id, car.category])

  const tripSearch = useMemo(() => checkoutSearchFromBooking(booking), [booking])
  const checkoutReturnTo = useMemo(() => {
    const params = new URLSearchParams()
    if (tripSearch.startDate) params.set('startDate', tripSearch.startDate)
    if (tripSearch.endDate) params.set('endDate', tripSearch.endDate)
    if (tripSearch.pickTime) params.set('pickTime', tripSearch.pickTime)
    if (tripSearch.retTime) params.set('retTime', tripSearch.retTime)
    if (tripSearch.from) params.set('from', tripSearch.from)
    if (tripSearch.retLoc) params.set('retLoc', tripSearch.retLoc)
    if (tripSearch.tripType) params.set('tripType', tripSearch.tripType)
    if (tripSearch.adults) params.set('adults', tripSearch.adults)
    if (tripSearch.children) params.set('children', tripSearch.children)
    const q = params.toString()
    return href(`/checkout/${car.id}${q ? `?${q}` : ''}`)
  }, [car.id, tripSearch, href])

  const persistDraft = useCallback(
    (overrides: { guestCheckout: boolean; awaitingPayment: boolean }) => {
      saveCheckoutDraft({
        carId: car.id,
        buyer,
        driver,
        alsoAsDriver,
        addons,
        appliedPromo,
        guestCheckout: overrides.guestCheckout,
        awaitingPayment: overrides.awaitingPayment,
      })
    },
    [car.id, buyer, driver, alsoAsDriver, addons, appliedPromo],
  )

  useEffect(() => {
    if (resolvedSessionPending || autoPayAttempted.current) return
    if (!resolvedUser || guestCheckout) return
    const draft = loadCheckoutDraft(car.id)
    const resumeAfterAuth =
      Boolean(draft?.awaitingPayment && !draft.guestCheckout) ||
      (step === 1 && !guestCheckout)
    if (!resumeAfterAuth) return
    autoPayAttempted.current = true
    clearCheckoutDraft()
    void createBooking()
  }, [resolvedSessionPending, resolvedUser, guestCheckout, step, car.id, createBooking])

  const advance = useCallback(async () => {
    setFlowError(null)
    if (step === 0) {
      if (!validateReview()) return
      if (resolvedSessionPending) return
      if (resolvedUser) {
        await createBooking()
        return
      }
      persistDraft({ guestCheckout: false, awaitingPayment: true })
      setStep(1)
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (step === 1) {
      if (resolvedSessionPending) return
      if (!resolvedUser && !guestCheckout) return
      await createBooking()
    }
  }, [
    step,
    validateReview,
    resolvedUser,
    guestCheckout,
    createBooking,
    resolvedSessionPending,
    persistDraft,
  ])

  const handleInlineAuthSuccess = useCallback(async () => {
    setAccountAuthMode(null)
    autoPayAttempted.current = false
    await authClient.getSession()
    clearCheckoutDraft()
    await createBooking()
  }, [createBooking])

  const continueAsGuest = useCallback(() => {
    setFlowError(null)
    setAccountAuthMode(null)
    persistDraft({ guestCheckout: true, awaitingPayment: true })
    setGuestCheckout(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [persistDraft])

  const openAccountAuth = useCallback(
    (mode: 'sign-in' | 'register') => {
      persistDraft({ guestCheckout: false, awaitingPayment: true })
      setAccountAuthMode(mode)
      requestAnimationFrame(() => {
        document.querySelector('.checkout-inline-auth')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      })
    },
    [persistDraft],
  )

  return (
    <div className="checkout">
      <header className="checkout-header">
        <Link to={backHref} className="close-btn" aria-label={t('common.back')}>
          <ArrowLeft size={16} />
        </Link>
        <div className="checkout-stepbar">
          {checkoutSteps.map((label, i) => (
            <div key={label} className={'checkout-step' + (step === i ? ' on' : step > i ? ' done' : '')}>
              <span className="checkout-step-num">
                {step > i ? <Check size={12} /> : String(i + 1).padStart(2, '0')}
              </span>
              <span>{label}</span>
              {i < 1 ? <span className="checkout-step-line" /> : null}
            </div>
          ))}
        </div>
        <span className="checkout-help">
          <Phone size={12} /> {t('checkout.needHelp')}
        </span>
        </header>

        <div className="checkout-grid">
          <main className="checkout-main">
            {step === 0 ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">{t('checkout.step1of2')}</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    {t('checkout.reviewTitle')}
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    {t('checkout.reviewSub')}
                  </p>
                </div>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>{t('checkout.addonsTitle')}</h3>
                    <span className="checkout-card-meta">{t('checkout.addonsMeta')}</span>
                  </div>
                  <div className="addon-list">
                    {ADDONS.map((a) => (
                      <label key={a.key} className={'addon' + (addons[a.key] ? ' on' : '')}>
                        <input
                          type="checkbox"
                          checked={addons[a.key]}
                          onChange={(e) => setAddons((prev) => ({ ...prev, [a.key]: e.target.checked }))}
                        />
                        <div className="addon-tick">
                          <Check size={12} />
                        </div>
                        <div className="addon-body">
                          <div className="addon-top">
                            <span className="addon-name">{a.title}</span>
                            <span className="addon-price">
                              + RM {a.price} <span>{a.per}</span>
                            </span>
                          </div>
                          <p>{a.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>{t('checkout.buyerInfoTitle')}</h3>
                    <span className="checkout-card-meta">{t('checkout.buyerInfoMeta')}</span>
                  </div>
                  {showFieldErrors && Object.keys(errs).length > 0 ? (
                    <div className="checkout-validation-banner" role="alert">
                      <strong>{t('checkout.completeRequiredFields')}</strong>
                      <span>
                        {t('checkout.fieldsNeedAttention', { count: Object.keys(errs).length })}
                      </span>
                    </div>
                  ) : null}
                  <form
                    className="form-grid"
                    autoComplete="on"
                    noValidate
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <CheckoutField
                      label={t('checkout.fullName')}
                      inputId="checkout-buyer-name"
                      inputName="name"
                      autoComplete="name"
                      error={errs.buyerName}
                      showError={shouldShowError('buyerName')}
                    >
                      {(field) => (
                        <input
                          {...field}
                          type="text"
                          value={buyer.name}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, name: v }))
                            if (showFieldErrors) {
                              patchFieldError(
                                'buyerName',
                                v.trim() ? null : t('checkout.errNameRequired'),
                              )
                            }
                          }}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              setBuyer((b) => ({ ...b, name: value }))
                              if (showFieldErrors) {
                                patchFieldError(
                                  'buyerName',
                                  value.trim() ? null : t('checkout.errNameRequired'),
                                )
                              }
                            })
                          }
                          placeholder={t('checkout.placeholderBuyerName')}
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label={t('checkout.email')}
                      inputId="checkout-buyer-email"
                      inputName="email"
                      autoComplete="email"
                      error={errs.buyerEmail}
                      showError={shouldShowError('buyerEmail')}
                    >
                      {(field) => (
                        <input
                          {...field}
                          type="email"
                          value={buyer.email}
                          onChange={(e) => updateContactField('buyer', 'email', e.target.value)}
                          onBlur={(e) => touchValidateField('buyer', 'email', e.target.value)}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              updateContactField('buyer', 'email', value)
                            })
                          }
                          placeholder={t('checkout.placeholderEmail')}
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label={t('checkout.mobileNumber')}
                      inputId="checkout-buyer-tel"
                      inputName="tel"
                      autoComplete="tel"
                      error={errs.buyerPhone}
                      showError={shouldShowError('buyerPhone')}
                    >
                      {(field) => (
                        <input
                          {...field}
                          type="tel"
                          value={buyer.phone}
                          onChange={(e) => updateContactField('buyer', 'phone', e.target.value)}
                          onBlur={(e) => touchValidateField('buyer', 'phone', e.target.value)}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              updateContactField('buyer', 'phone', value)
                            })
                          }
                          placeholder={t('checkout.placeholderPhone')}
                        />
                      )}
                    </CheckoutField>

                    <p className="checkout-field-group-label form-grid-span-full">
                      {t('checkout.billingAddress')}
                    </p>
                    <CheckoutField
                      label={t('checkout.addressLine1')}
                      inputId="checkout-buyer-address-line1"
                      inputName="address-line1"
                      autoComplete="billing address-line1"
                      error={errs.buyerAddressLine1}
                      showError={shouldShowError('buyerAddressLine1')}
                      className="form-grid-span-full"
                    >
                      {(field) => (
                        <input
                          {...field}
                          type="text"
                          value={buyer.addressLine1}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, addressLine1: v }))
                            if (showFieldErrors) {
                              patchFieldError(
                                'buyerAddressLine1',
                                v.trim() ? null : t('checkout.errAddressLine1'),
                              )
                            }
                          }}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              setBuyer((b) => ({ ...b, addressLine1: value }))
                              if (showFieldErrors) {
                                patchFieldError(
                                  'buyerAddressLine1',
                                  value.trim() ? null : t('checkout.errAddressLine1'),
                                )
                              }
                            })
                          }
                          placeholder={t('checkout.placeholderAddress1')}
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label={t('checkout.addressLine2')}
                      optional
                      optionalLabel={t('checkout.optional')}
                      inputId="checkout-buyer-address-line2"
                      inputName="address-line2"
                      autoComplete="billing address-line2"
                      className="form-grid-span-full"
                    >
                      {(field) => (
                        <input
                          {...field}
                          type="text"
                          value={buyer.addressLine2}
                          onChange={(e) => setBuyer((b) => ({ ...b, addressLine2: e.target.value }))}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              setBuyer((b) => ({ ...b, addressLine2: value }))
                            })
                          }
                          placeholder={t('checkout.placeholderAddress2')}
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label={t('checkout.cityTown')}
                      inputId="checkout-buyer-city"
                      inputName="city"
                      autoComplete="billing address-level2"
                      error={errs.buyerCity}
                      showError={shouldShowError('buyerCity')}
                    >
                      {(field) => (
                        <input
                          {...field}
                          type="text"
                          value={buyer.city}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, city: v }))
                            if (showFieldErrors) {
                              patchFieldError('buyerCity', v.trim() ? null : t('checkout.errCity'))
                            }
                          }}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              setBuyer((b) => ({ ...b, city: value }))
                              if (showFieldErrors) {
                                patchFieldError('buyerCity', value.trim() ? null : t('checkout.errCity'))
                              }
                            })
                          }
                          placeholder={t('checkout.placeholderCity')}
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label={t('checkout.stateProvince')}
                      optional
                      optionalLabel={t('checkout.optional')}
                      inputId="checkout-buyer-state"
                      inputName="state"
                      autoComplete="billing address-level1"
                    >
                      {(field) => (
                        <input
                          {...field}
                          type="text"
                          value={buyer.stateProvince}
                          onChange={(e) => setBuyer((b) => ({ ...b, stateProvince: e.target.value }))}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              setBuyer((b) => ({ ...b, stateProvince: value }))
                            })
                          }
                          placeholder={t('checkout.placeholderState')}
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label={t('checkout.postalCode')}
                      inputId="checkout-buyer-postal-code"
                      inputName="postal-code"
                      autoComplete="billing postal-code"
                      error={errs.buyerPostalCode}
                      showError={shouldShowError('buyerPostalCode')}
                    >
                      {(field) => (
                        <input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          value={buyer.postalCode}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, postalCode: v }))
                            if (showFieldErrors) {
                              patchFieldError(
                                'buyerPostalCode',
                                v.trim() ? null : t('checkout.errPostalCode'),
                              )
                            }
                          }}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              setBuyer((b) => ({ ...b, postalCode: value }))
                              if (showFieldErrors) {
                                patchFieldError(
                                  'buyerPostalCode',
                                  value.trim() ? null : t('checkout.errPostalCode'),
                                )
                              }
                            })
                          }
                          placeholder={t('checkout.placeholderPostal')}
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label={t('checkout.country')}
                      inputId="checkout-buyer-country"
                      inputName="country"
                      autoComplete="billing country"
                      error={errs.buyerCountry}
                      showError={shouldShowError('buyerCountry')}
                    >
                      {(field) => (
                        <select
                          {...field}
                          value={buyer.country}
                          onChange={(e) => {
                            const v = normalizeCountryCode(e.target.value)
                            setBuyer((b) => ({ ...b, country: v }))
                            if (showFieldErrors) {
                              patchFieldError(
                                'buyerCountry',
                                !v.trim()
                                  ? t('checkout.errCountry')
                                  : isValidCountryCode(v)
                                    ? null
                                    : t('checkout.errCountryInvalid'),
                              )
                            }
                          }}
                          onAnimationStart={(event) =>
                            syncAutofillValue(event, (value) => {
                              const v = normalizeCountryCode(value)
                              setBuyer((b) => ({ ...b, country: v }))
                              if (showFieldErrors) {
                                patchFieldError(
                                  'buyerCountry',
                                  !v.trim()
                                    ? t('checkout.errCountry')
                                    : isValidCountryCode(v)
                                      ? null
                                      : t('checkout.errCountryInvalid'),
                                )
                              }
                            })
                          }
                        >
                          {COUNTRY_OPTIONS.map(({ code, name }) => (
                            <option key={code} value={code}>
                              {name}
                            </option>
                          ))}
                        </select>
                      )}
                    </CheckoutField>

                    <label className={'checkout-also-driver form-grid-span-full' + (alsoAsDriver ? ' on' : '')}>
                      <input
                        type="checkbox"
                        className="checkout-also-driver-input"
                        checked={alsoAsDriver}
                        onChange={(e) => {
                          const on = e.target.checked
                          setAlsoAsDriver(on)
                          if (on) {
                            setDriver((d) => ({
                              ...d,
                              name: buyer.name,
                              email: buyer.email,
                              phone: buyer.phone,
                            }))
                          }
                        }}
                      />
                      <span className="checkout-also-driver-tick" aria-hidden>
                        <Check size={14} strokeWidth={2.5} />
                      </span>
                      <span className="checkout-also-driver-label">
                        <strong>{t('checkout.alsoDriver')}</strong>
                        <span className="checkout-also-driver-hint">{t('checkout.driverDetails')}</span>
                      </span>
                    </label>
                  </form>
                </section>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>{t('checkout.driverDetails')}</h3>
                    <span className="checkout-card-meta">
                      {alsoAsDriver ? t('checkout.buyerInfoMeta') : t('checkout.driverDetails')}
                    </span>
                  </div>
                  <div className="form-grid">
                    {!alsoAsDriver ? (
                      <>
                        <CheckoutField
                          label={t('checkout.fullName')}
                          inputId="checkout-driver-name"
                          inputName="driver-name"
                          autoComplete="off"
                          error={errs.driverName}
                          showError={shouldShowError('driverName')}
                        >
                          {(field) => (
                            <input
                              {...field}
                              type="text"
                              value={driver.name}
                              onChange={(e) => {
                                const v = e.target.value
                                setDriver((d) => ({ ...d, name: v }))
                                if (showFieldErrors) {
                                  patchFieldError(
                                    'driverName',
                                    v.trim()
                                      ? null
                                      : t('checkout.errDriverName'),
                                  )
                                }
                              }}
                              placeholder={t('checkout.namePlaceholder')}
                            />
                          )}
                        </CheckoutField>
                        <CheckoutField
                          label={t('checkout.email')}
                          inputId="checkout-driver-email"
                          inputName="driver-email"
                          autoComplete="off"
                          error={errs.driverEmail}
                          showError={shouldShowError('driverEmail')}
                        >
                          {(field) => (
                            <input
                              {...field}
                              type="email"
                              value={driver.email}
                              onChange={(e) => updateContactField('driver', 'email', e.target.value)}
                              onBlur={(e) => touchValidateField('driver', 'email', e.target.value)}
                              placeholder={t('checkout.placeholderEmail')}
                            />
                          )}
                        </CheckoutField>
                        <CheckoutField
                          label={t('checkout.mobileNumber')}
                          inputId="checkout-driver-tel"
                          inputName="driver-tel"
                          autoComplete="off"
                          error={errs.driverPhone}
                          showError={shouldShowError('driverPhone')}
                        >
                          {(field) => (
                            <input
                              {...field}
                              type="tel"
                              value={driver.phone}
                              onChange={(e) => updateContactField('driver', 'phone', e.target.value)}
                              onBlur={(e) => touchValidateField('driver', 'phone', e.target.value)}
                              placeholder={t('checkout.placeholderPhone')}
                            />
                          )}
                        </CheckoutField>
                      </>
                    ) : (
                      <p className="checkout-driver-linked form-grid-span-full">
                        {t('checkout.buyerDetails')}{' '}
                        <strong>{buyer.name.trim() || t('checkout.fullName')}</strong>
                        {buyer.email ? ` · ${buyer.email}` : ''}
                        {buyer.phone ? ` · ${buyer.phone}` : ''}
                      </p>
                    )}
                    <div className="driver-id-row form-grid-span-full">
                      <CheckoutField
                        label={t('checkout.licenseNumber')}
                        inputId="checkout-driver-license"
                        inputName="driver-license"
                        autoComplete="off"
                        error={errs.driverLicense}
                        showError={shouldShowError('driverLicense')}
                      >
                        {(field) => (
                          <input
                            {...field}
                            type="text"
                            value={driver.license}
                            onChange={(e) => {
                              const v = e.target.value
                              setDriver((d) => ({ ...d, license: v }))
                              if (showFieldErrors) {
                                patchFieldError(
                                  'driverLicense',
                                  v.trim()
                                    ? null
                                    : t('checkout.errDriverLicense'),
                                )
                              }
                            }}
                            placeholder={t('checkout.placeholderLicense')}
                          />
                        )}
                      </CheckoutField>
                      <CheckoutField
                        label={t('checkout.issuingCountry')}
                        inputId="checkout-driver-country"
                        inputName="driver-country"
                        autoComplete="off"
                      >
                        {(field) => (
                          <select
                            {...field}
                            value={driver.country}
                            onChange={(e) =>
                              setDriver((d) => ({ ...d, country: normalizeCountryCode(e.target.value) }))
                            }
                          >
                            {COUNTRY_OPTIONS.map(({ code, name }) => (
                              <option key={code} value={code}>
                                {name}
                              </option>
                            ))}
                          </select>
                        )}
                      </CheckoutField>
                    </div>
                  </div>
                </section>


              </div>
            ) : null}

            {step === 1 && (resolvedUser || guestCheckout) ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">{t('checkout.step2of2')}</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    {t('checkout.paymentTitle')}
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    {guestCheckout && !resolvedUser
                      ? t('checkout.guestPaymentSub')
                      : t('checkout.secureCheckoutNote')}
                  </p>
                </div>

                {flowError ? (
                  <p className="checkout-flow-error" role="alert">
                    {flowError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 1 && !resolvedUser && !guestCheckout && resolvedSessionPending ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">{t('checkout.step2of2')}</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    {t('checkout.paymentTitle')}
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LoadingSpinner size={16} aria-hidden />
                    {t('nav.loadingAccount')}
                  </p>
                </div>
              </div>
            ) : null}

            {step === 1 && !resolvedUser && !guestCheckout && !resolvedSessionPending ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">{t('checkout.step2of2')}</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    {t('checkout.signInToContinue')}
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    {t('checkout.signInToContinueSub')}
                  </p>
                </div>
                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>{t('checkout.customerAccount')}</h3>
                  </div>
                  <p className="checkout-account-copy">{t('checkout.signInOrCreate')}</p>
                  <div className="checkout-account-actions">
                    <button
                      type="button"
                      className={'btn btn-lg' + (accountAuthMode === 'sign-in' ? ' btn-leaf' : ' btn-ghost')}
                      onClick={() => openAccountAuth('sign-in')}
                    >
                      {t('auth.signIn')}
                    </button>
                    <button
                      type="button"
                      className={'btn btn-lg' + (accountAuthMode === 'register' ? ' btn-leaf' : ' btn-ghost')}
                      onClick={() => openAccountAuth('register')}
                    >
                      {t('auth.createAccountBtn')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-lg" onClick={continueAsGuest}>
                      {t('checkout.continueAsGuest')}
                    </button>
                  </div>
                  {accountAuthMode ? (
                    <CheckoutInlineAuth
                      mode={accountAuthMode}
                      locale={locale}
                      returnTo={checkoutReturnTo}
                      defaultEmail={buyer.email}
                      onSuccess={() => void handleInlineAuthSuccess()}
                      onSwitchMode={setAccountAuthMode}
                      onCancel={() => setAccountAuthMode(null)}
                    />
                  ) : null}
                  <p className="checkout-account-footnote">{t('checkout.accountFootnote')}</p>
                  <Link
                    to="/book/$carId"
                    params={{ carId: car.id }}
                    search={{
                      startDate: tripSearch.startDate,
                      endDate: tripSearch.endDate,
                    }}
                    className="checkout-edit"
                  >
                    {t('checkout.openBookingForm')}
                  </Link>
                </section>
              </div>
            ) : null}
          </main>

          <aside className="checkout-summary">
            <div className="cs-car">
              {car.coverPhotoUrl ? (
                <img src={car.coverPhotoUrl} alt="" />
              ) : (
                <div style={{ width: 96, height: 60, background: 'var(--canvas-2)', borderRadius: 10 }} />
              )}
              <div className="cs-car-body">
                <div className="cs-car-head">
                  <div className="cs-car-name">{vehicleTitle(car)}</div>
                  <div className="cs-trip-duration">
                    <Clock size={13} aria-hidden />
                    <span>{tripDuration}</span>
                  </div>
                </div>
                <div className="cs-car-meta">
                  <Cog size={11} /> {car.category} ·{' '}
                  <span>
                    {lug.seats} {t('common.seats')}
                  </span>
                </div>
              </div>
            </div>

            <div className="cs-trip">
              <div className="cs-trip-legs">
                <div className="cs-trip-leg">
                  <span className="cs-trip-lbl">{t('booking.pickup')}</span>
                  <strong>
                    {booking.pickDate?.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </strong>
                  <em>{booking.pickTime.trim() || '—'}</em>
                  <span className="cs-trip-loc">
                    <MapPin size={11} aria-hidden />
                    <span>{pickupLoc}</span>
                  </span>
                </div>
                <div className="cs-trip-leg cs-trip-leg--return">
                  <span className="cs-trip-lbl">{t('booking.return')}</span>
                  <strong>
                    {booking.retDate?.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </strong>
                  <em>{booking.retTime.trim() || '—'}</em>
                  <span className="cs-trip-loc">
                    <MapPin size={11} aria-hidden />
                    <span>{returnLoc}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="cs-divider" />
            {previewLoading ? (
              <p className="cs-row" style={{ justifyContent: 'center', gap: 8 }}>
                <LoadingSpinner size={14} aria-hidden />
                {t('checkout.priceCalculating')}
              </p>
            ) : previewError ? (
              <p className="cs-promo-error">{previewError}</p>
            ) : preview ? (
              <div className="cs-rows">
                {seasonLines.length > 0 ? (
                  seasonLines.map((line) => {
                    const season = checkoutSeasonLabel(line.seasonType, t)
                    const title =
                      line.days === 1
                        ? t('checkout.seasonLineOne', { season })
                        : t('checkout.seasonLineMany', { season, count: line.days })
                    return (
                      <div
                        key={`${line.seasonType}-${line.dateLabel}`}
                        className="cs-row cs-row--season"
                      >
                        <div>
                          <div className="cs-row-season-main">{title}</div>
                          <div className="cs-row-sub">
                            {t('checkout.seasonLineDetail', {
                              dates: line.dateLabel,
                              rate: Math.round(line.dailyRateRm),
                            })}
                          </div>
                        </div>
                        <span>RM {Math.round(line.subtotalRm)}</span>
                      </div>
                    )
                  })
                ) : (
                  <div className="cs-row">
                    <span>{t('checkout.rentalDays', { days: preview.days })}</span>
                    <span>RM {baseRentalRm}</span>
                  </div>
                )}
                {extraHoursCharge > 0 ? (
                  <div className="cs-row">
                    <span>
                      {preview.extraRule === 'full-day-cap'
                        ? t('checkout.extraFullDay')
                        : t('checkout.extraHours', { time: formatExtraHours(extraHours) })}
                    </span>
                    <span>RM {extraHoursCharge}</span>
                  </div>
                ) : null}
                {preview.addonsTotal > 0 ? (
                  <>
                    {ADDONS.filter((a) => addons[a.key]).map((a) => (
                      <div key={a.key} className="cs-row">
                        <span>{a.title}</span>
                        <span>RM {a.price}</span>
                      </div>
                    ))}
                  </>
                ) : null}
                {deliveryFeeRm > 0 ? (
                  <div className="cs-row">
                    <span>{t('checkout.deliveryFee')}</span>
                    <span>RM {deliveryFeeRm}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="cs-rows">
              {appliedPromo && discount > 0 ? (
                <div className="cs-row">
                  <span>
                    {t('checkout.promoApplied')}{' '}
                    <code style={{ fontFamily: 'monospace' }}>{appliedPromo.code}</code>{' '}
                    <button
                      type="button"
                      onClick={removePromoCode}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brand-coral)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.85em',
                      }}
                    >
                      {t('checkout.removePromo')}
                    </button>
                  </span>
                  <span style={{ color: 'var(--brand-coral)' }}>−RM {discount}</span>
                </div>
              ) : null}
            </div>
            {!appliedPromo ? (
              <div className="cs-promo">
                <label htmlFor="cs-promo-input" className="cs-promo-label">
                  {t('checkout.havePromo')}
                </label>
                <div className="cs-promo-row">
                  <input
                    id="cs-promo-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase())
                      if (promoError) setPromoError(null)
                    }}
                    placeholder={t('checkout.promoPlaceholder')}
                    autoComplete="off"
                    disabled={promoBusy}
                    className="cs-promo-input"
                  />
                  <button
                    type="button"
                    onClick={() => void applyPromoCode()}
                    disabled={!promoInput.trim() || promoBusy}
                    className="cs-promo-btn"
                  >
                    {promoBusy ? <LoadingSpinner size={14} aria-hidden /> : t('checkout.applyPromo')}
                  </button>
                </div>
                {promoError ? <p className="cs-promo-error">{promoError}</p> : null}
              </div>
            ) : null}
            <div className="cs-divider" />
            <div className="cs-total">
              <span>{t('checkout.totalToPay')}</span>
              <span>RM {total}</span>
            </div>
            <div className="cs-trust">
              <span>
                <Check size={11} /> {t('checkout.noChargeUntilPayment')}
              </span>
            </div>

            {step === 1 && !resolvedUser && !guestCheckout && !resolvedSessionPending ? (
                <button type="button" className="btn btn-ghost btn-lg" onClick={() => setStep(0)}>
                  {t('checkout.backToReview')}
                </button>
              ) : (
                <div className="cs-pay-actions">
                  <button type="button" className="btn btn-leaf btn-lg" onClick={() => void advance()} disabled={submitting || resolvedSessionPending || previewLoading || !preview || Boolean(previewError) || (step === 1 && !resolvedUser && !guestCheckout)}>
                    {step === 0
                      ? resolvedUser
                        ? t('checkout.payAmount', { total })
                        : t('checkout.payNow')
                      : submitting
                        ? t('checkout.redirectingPayment')
                        : t('checkout.payAmount', { total })}
                    {submitting ? <LoadingSpinner size={16} aria-hidden /> : <ArrowRight size={14} />}
                  </button>
                  <CheckoutPaymentIcons />
                </div>
              )}

          </aside>
        </div>
    </div>
  )
}
