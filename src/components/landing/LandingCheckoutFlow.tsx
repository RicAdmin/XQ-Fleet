import { useCallback, useEffect, useMemo, useId, useState, type ReactNode } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Cog,
  Globe,
  Key,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { LoadingSpinner } from '#/components/ui/LoadingSpinner'
import { checkoutSearchFromBooking, bookingHasCompleteTrip } from '#/lib/checkout-trip'
import { createPortalBooking } from '#/lib/portal-booking-functions'
import {
  estimateExtraHoursCharge,
  formatExtraHours,
  formatTripDuration,
  tripExtraHours,
} from '#/lib/booking-datetime'
import { heuristicLuggageFit } from '#/lib/fleet-luggage-fit'
import type { PublicCarRow } from '#/lib/portal-functions'

function toPricingLocation(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('airport')) return 'Airport'
  if (l.includes('jetty') || l.includes('ferry')) return 'Jetty'
  if (l.includes('hotel')) return 'Hotel'
  return 'Office'
}

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

type PayMethod = 'card' | 'fpx' | 'grab' | 'later'

const CHECKOUT_COUNTRIES = [
  'Malaysia',
  'Singapore',
  'Thailand',
  'Indonesia',
  'Philippines',
  'United States',
  'United Kingdom',
  'Australia',
  'Other',
] as const

type BuyerAddress = {
  addressLine1: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  country: string
}

function formatInternationalAddress(address: BuyerAddress): string {
  const locality = [address.postalCode.trim(), address.city.trim()].filter(Boolean).join(' ')
  const region = [locality, address.stateProvince.trim()].filter(Boolean).join(', ')
  return [
    address.addressLine1.trim(),
    address.addressLine2.trim(),
    region,
    address.country.trim(),
  ]
    .filter(Boolean)
    .join('\n')
}

function validateBuyerAddress(address: BuyerAddress): Record<string, string> {
  const e: Record<string, string> = {}
  if (!address.addressLine1.trim()) {
    e.buyerAddressLine1 = 'Enter street address, P.O. box, or company name.'
  }
  if (!address.city.trim()) {
    e.buyerCity = 'Enter city or town.'
  }
  if (!address.postalCode.trim()) {
    e.buyerPostalCode = 'Enter postal or ZIP code.'
  }
  if (!address.country.trim()) {
    e.buyerCountry = 'Select country.'
  }
  return e
}

function FieldLabel({ children, optional = false }: { children: ReactNode; optional?: boolean }) {
  return (
    <span>
      {children}
      {optional ? (
        <span className="checkout-optional"> · optional</span>
      ) : (
        <span className="field-required-mark" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </span>
  )
}

function CheckoutField({
  label,
  optional = false,
  error,
  showError = false,
  className,
  children,
}: {
  label: ReactNode
  optional?: boolean
  error?: string
  showError?: boolean
  className?: string
  children: (aria: {
    'aria-invalid'?: boolean
    'aria-describedby'?: string
    'aria-required'?: boolean
  }) => ReactNode
}) {
  const errorId = useId()
  const invalid = Boolean(showError && error)

  return (
    <label
      className={['auth-field', invalid ? 'auth-field--invalid' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel optional={optional}>{label}</FieldLabel>
      {children({
        'aria-invalid': invalid ? true : undefined,
        'aria-describedby': invalid ? errorId : undefined,
        'aria-required': optional ? undefined : true,
      })}
      {invalid ? (
        <em id={errorId} className="auth-field-error" role="alert">
          {error}
        </em>
      ) : null}
    </label>
  )
}

const ADDONS: Array<{
  key: AddonKey
  title: string
  desc: string
  price: number
  per: string
}> = [
  {
    key: 'child',
    title: 'Child safety seat',
    desc: 'Suitable for ages 0–4. Installed for you at pickup.',
    price: 30,
    per: 'one time',
  },
  {
    key: 'second',
    title: 'Additional driver',
    desc: 'Add a friend or family member. License required at pickup.',
    price: 20,
    per: 'one time',
  },
]

const PAY_METHODS: Array<{
  id: PayMethod
  title: string
  desc: string
  icon: typeof Wallet
  disabled?: boolean
}> = [
  { id: 'card', title: 'Credit / Debit card', desc: 'Visa, Mastercard, AMEX — via secure gateway', icon: Wallet },
  { id: 'fpx', title: 'Online banking (FPX)', desc: 'Maybank, CIMB, RHB, Public Bank, +14', icon: Globe },
  { id: 'grab', title: 'GrabPay', desc: 'Coming soon', icon: Sparkles, disabled: true },
  { id: 'later', title: 'Pay at pickup', desc: 'Not available for online holds yet', icon: Key, disabled: true },
]

const IPAY88_PAYMENTS = [
  { id: 'visa', label: 'Visa', src: '/images/payments/visalogo.png' },
  { id: 'mastercard', label: 'Mastercard', src: '/images/payments/masterlogo.jpeg' },
  { id: 'unionpay', label: 'UnionPay', src: '/images/payments/union.png' },
  { id: 'fpx', label: 'FPX Online Banking', src: '/images/payments/FPX-Logo.jpg' },
  { id: 'duitnow', label: 'DuitNow', src: '/images/payments/duitnow.png' },
  { id: 'tng', label: "Touch 'n Go eWallet", src: '/images/payments/TngGO.jpg' },
] as const

function CheckoutPaymentIcons() {
  return (
    <div className="cs-pay-icons" aria-label="Accepted payment methods via iPay88">
      {IPAY88_PAYMENTS.map(({ id, label, src }) => (
        <div key={id} className="cs-pay-chip" title={label}>
          <img src={src} alt={label} loading="lazy" decoding="async" />
        </div>
      ))}
    </div>
  )
}

function nightsBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return 1
  const ms = b.getTime() - a.getTime()
  return ms > 0 ? Math.max(1, Math.round(ms / 86_400_000)) : 1
}

function vehicleTitle(car: PublicCarRow) {
  return `${car.year} ${car.make} ${car.model}`
}

function validateDriverEmail(value: string): string | null {
  const v = value.trim()
  if (!v) {
    return 'Add the email where you’d like your booking confirmation sent.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return 'That email doesn’t look quite right — try something like name@example.com.'
  }
  return null
}

function validateDriverPhone(value: string): string | null {
  const v = value.trim()
  if (!v) {
    return 'We’ll use this to reach you about pickup — please add your mobile number.'
  }
  const digits = v.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) {
    return 'Enter a valid mobile number (8–15 digits; country code optional, e.g. +60 12 345 6789).'
  }
  return null
}

function PayMethodPicker({
  payMethod,
  onChange,
  name,
  compact = false,
}: {
  payMethod: PayMethod
  onChange: (id: PayMethod) => void
  name: string
  compact?: boolean
}) {
  return (
    <div className={'pay-methods' + (compact ? ' pay-methods--compact' : '')}>
      {PAY_METHODS.map((m) => {
        const Icon = m.icon
        return (
          <label
            key={m.id}
            className={'pay-method' + (payMethod === m.id ? ' on' : '')}
            style={
              m.disabled
                ? { cursor: 'not-allowed', opacity: 0.55, pointerEvents: 'none' as const }
                : undefined
            }
          >
            <input
              type="radio"
              name={name}
              disabled={m.disabled}
              checked={payMethod === m.id}
              onChange={() => {
                if (!m.disabled) onChange(m.id)
              }}
            />
            <span className="pay-method-radio" />
            <span className="pay-method-icon">
              <Icon size={compact ? 14 : 16} />
            </span>
            <span className="pay-method-body">
              <strong>{m.title}</strong>
              <span>{m.desc}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}

type LandingCheckoutFlowProps = {
  car: PublicCarRow
  booking: BookingState
  startYmd?: string
  endYmd?: string
  user?: SessionUserLite
  backHref: string
}

export function LandingCheckoutFlow({
  car,
  booking,
  startYmd,
  endYmd,
  user,
  backHref,
}: LandingCheckoutFlowProps) {
  const navigate = useNavigate()
  const nights = nightsBetween(booking.pickDate, booking.retDate)
  const daily = Math.round(car.dailyRateSen / 100)
  const subtotal = daily * nights
  const discount = Math.round(subtotal * 0.15)
  const [step, setStep] = useState(0)
  const [guestCheckout, setGuestCheckout] = useState(false)
  const [addons, setAddons] = useState<Record<AddonKey, boolean>>({
    child: false,
    second: false,
  })
  const [buyer, setBuyer] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: 'Malaysia',
  })
  const [driver, setDriver] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    license: '',
    country: 'Malaysia',
  })
  const [alsoAsDriver, setAlsoAsDriver] = useState(true)
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [touched, setTouched] = useState<{
    buyerEmail?: boolean
    buyerPhone?: boolean
    driverEmail?: boolean
    driverPhone?: boolean
  }>({})
  const [rentalId, setRentalId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [flowError, setFlowError] = useState<string | null>(null)

  useEffect(() => {
    if (user) setGuestCheckout(false)
  }, [user])

  useEffect(() => {
    setBuyer((b) => ({
      ...b,
      name: user?.name ?? b.name,
      email: user?.email ?? b.email,
    }))
  }, [user?.name, user?.email])

  useEffect(() => {
    if (!alsoAsDriver) return
    setDriver((d) => ({
      ...d,
      name: buyer.name,
      email: buyer.email,
      phone: buyer.phone,
    }))
  }, [alsoAsDriver, buyer.name, buyer.email, buyer.phone])

  const addonCost = useMemo(() => {
    let sum = 0
    if (addons.child) sum += 30
    if (addons.second) sum += 20
    return sum
  }, [addons])

  const pickupLoc = booking.from.trim() || 'Pickup location TBC'
  const returnLoc =
    booking.tripType === 'round' ? pickupLoc : booking.retLoc.trim() || pickupLoc
  const tripDuration = formatTripDuration(
    booking.pickDate,
    booking.pickTime,
    booking.retDate,
    booking.retTime,
  )
  const extraHours = tripExtraHours(
    booking.pickDate,
    booking.pickTime,
    booking.retDate,
    booking.retTime,
    nights,
  )
  const extraHoursCharge = estimateExtraHoursCharge(extraHours, car.extHourLowSen, car.dailyRateSen)

  const tax = Math.round((subtotal - discount + addonCost + extraHoursCharge) * 0.06)
  const total = subtotal - discount + addonCost + extraHoursCharge + tax

  const lug = heuristicLuggageFit(car.category)

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
      e.buyerName = 'Please enter the name for this booking.'
    }
    const buyerEmailErr = validateDriverEmail(buyer.email)
    if (buyerEmailErr) e.buyerEmail = buyerEmailErr
    const buyerPhoneErr = validateDriverPhone(buyer.phone)
    if (buyerPhoneErr) e.buyerPhone = buyerPhoneErr
    Object.assign(e, validateBuyerAddress(buyer))

    if (!alsoAsDriver) {
      if (!driver.name.trim()) {
        e.driverName = 'Please enter the driver’s full name as shown on their license.'
      }
      const driverEmailErr = validateDriverEmail(driver.email)
      if (driverEmailErr) e.driverEmail = driverEmailErr
      const driverPhoneErr = validateDriverPhone(driver.phone)
      if (driverPhoneErr) e.driverPhone = driverPhoneErr
    }

    if (!driver.license.trim()) {
      e.driverLicense = 'Please enter the driver’s IC, passport, or license number.'
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
  }, [buyer, driver, alsoAsDriver])

  const touchValidateField = useCallback(
    (scope: 'buyer' | 'driver', field: 'email' | 'phone', value: string) => {
      const key = `${scope}${field.charAt(0).toUpperCase()}${field.slice(1)}` as
        | 'buyerEmail'
        | 'buyerPhone'
        | 'driverEmail'
        | 'driverPhone'
      setTouched((t) => ({ ...t, [key]: true }))
      const msg = field === 'email' ? validateDriverEmail(value) : validateDriverPhone(value)
      setErrs((prev) => {
        const next = { ...prev }
        if (msg) next[key] = msg
        else delete next[key]
        return next
      })
    },
    [],
  )

  const updateContactField = useCallback(
    (scope: 'buyer' | 'driver', field: 'email' | 'phone', value: string) => {
      const key = `${scope}${field.charAt(0).toUpperCase()}${field.slice(1)}` as
        | 'buyerEmail'
        | 'buyerPhone'
        | 'driverEmail'
        | 'driverPhone'
      const setter = scope === 'buyer' ? setBuyer : setDriver
      setter((prev) => ({ ...prev, [field]: value }))
      if (touched[key]) {
        const msg = field === 'email' ? validateDriverEmail(value) : validateDriverPhone(value)
        setErrs((prev) => {
          const next = { ...prev }
          if (msg) next[key] = msg
          else delete next[key]
          return next
        })
      }
    },
    [touched],
  )

  const createBooking = useCallback(async () => {
    if (!bookingHasCompleteTrip(booking)) {
      setFlowError('Pickup and return dates and times are required. Go back and complete your search.')
      return
    }
    if (!startYmd || !endYmd) {
      setFlowError('Pick valid dates from the search bar first.')
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
          pickUpLocation: toPricingLocation(booking.from),
          returnLocation: toPricingLocation(returnLoc),
          childSeat: addons.child,
          secondDriver: addons.second,
          couponCode: null,
          fullName: (alsoAsDriver ? buyer.name : driver.name).trim(),
          icOrPassport: driver.license.trim(),
          phone: (alsoAsDriver ? buyer.phone : driver.phone).trim(),
          email: buyer.email.trim(),
          address: formatInternationalAddress(buyer) || undefined,
        },
      })
      setRentalId(id)
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Could not create booking.')
    } finally {
      setSubmitting(false)
    }
  }, [car.id, startYmd, endYmd, buyer, driver, alsoAsDriver, booking, addons])

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
    return `/checkout/${car.id}${q ? `?${q}` : ''}`
  }, [car.id, tripSearch])

  const advance = useCallback(async () => {
    setFlowError(null)
    if (step === 0) {
      if (!validateReview()) return
      setStep(1)
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (step === 1) {
      if (!user && !guestCheckout) return
      if (payMethod === 'later' || payMethod === 'grab') {
        setFlowError('Choose card or FPX to continue.')
        return
      }
      await createBooking()
      return
    }
    if (step === 2 && rentalId) {
      await navigate({ to: '/pay/$rentalId', params: { rentalId } })
    }
  }, [step, validateReview, user, guestCheckout, payMethod, createBooking, rentalId, navigate])

  const continueAsGuest = useCallback(() => {
    setFlowError(null)
    setGuestCheckout(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="checkout">
      <header className="checkout-header">
        <Link to={backHref} className="close-btn" aria-label="Back">
          <ArrowLeft size={16} />
        </Link>
        <div className="checkout-stepbar">
          {(['Review', 'Payment', 'Confirmation'] as const).map((label, i) => (
            <div key={label} className={'checkout-step' + (step === i ? ' on' : step > i ? ' done' : '')}>
              <span className="checkout-step-num">
                {step > i ? <Check size={12} /> : String(i + 1).padStart(2, '0')}
              </span>
              <span>{label}</span>
              {i < 2 ? <span className="checkout-step-line" /> : null}
            </div>
          ))}
        </div>
        <span className="checkout-help">
          <Phone size={12} /> Need help? +60 11 3521 5576
        </span>
        </header>

        <div className="checkout-grid">
          <main className="checkout-main">
            {step === 0 ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">Step 1 of 3</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    Review your rental.
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    Confirm the details below — we&apos;ll email your receipt after payment.
                  </p>
                </div>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Add-ons &amp; protection</h3>
                    <span className="checkout-card-meta">Optional · skip any you don&apos;t need</span>
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
                    <h3>Buyer information</h3>
                    <span className="checkout-card-meta">
                      Booking contact &amp; confirmation email · <span className="field-required-note">* Required</span>
                    </span>
                  </div>
                  {showFieldErrors && Object.keys(errs).length > 0 ? (
                    <div className="checkout-validation-banner" role="alert">
                      <strong>Please complete the required fields below.</strong>
                      <span>
                        {Object.keys(errs).length} field{Object.keys(errs).length !== 1 ? 's' : ''} need
                        your attention.
                      </span>
                    </div>
                  ) : null}
                  <div className="form-grid">
                    <CheckoutField
                      label="Full name"
                      error={errs.buyerName}
                      showError={shouldShowError('buyerName')}
                    >
                      {(aria) => (
                        <input
                          {...aria}
                          value={buyer.name}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, name: v }))
                            if (showFieldErrors) {
                              patchFieldError(
                                'buyerName',
                                v.trim() ? null : 'Please enter the name for this booking.',
                              )
                            }
                          }}
                          placeholder="John Tan"
                          autoComplete="name"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label="Email"
                      error={errs.buyerEmail}
                      showError={shouldShowError('buyerEmail')}
                    >
                      {(aria) => (
                        <input
                          {...aria}
                          type="email"
                          value={buyer.email}
                          onChange={(e) => updateContactField('buyer', 'email', e.target.value)}
                          onBlur={(e) => touchValidateField('buyer', 'email', e.target.value)}
                          placeholder="john@example.com"
                          autoComplete="email"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label="Mobile number"
                      error={errs.buyerPhone}
                      showError={shouldShowError('buyerPhone')}
                    >
                      {(aria) => (
                        <input
                          {...aria}
                          type="tel"
                          value={buyer.phone}
                          onChange={(e) => updateContactField('buyer', 'phone', e.target.value)}
                          onBlur={(e) => touchValidateField('buyer', 'phone', e.target.value)}
                          placeholder="+60 12 345 6789"
                          autoComplete="tel"
                        />
                      )}
                    </CheckoutField>

                    <p className="checkout-field-group-label form-grid-span-full">Billing address</p>
                    <CheckoutField
                      label="Address line 1"
                      error={errs.buyerAddressLine1}
                      showError={shouldShowError('buyerAddressLine1')}
                      className="form-grid-span-full"
                    >
                      {(aria) => (
                        <input
                          {...aria}
                          value={buyer.addressLine1}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, addressLine1: v }))
                            if (showFieldErrors) {
                              patchFieldError(
                                'buyerAddressLine1',
                                v.trim() ? null : 'Enter street address, P.O. box, or company name.',
                              )
                            }
                          }}
                          placeholder="Street address, P.O. box, company name"
                          autoComplete="address-line1"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField label="Address line 2" optional className="form-grid-span-full">
                      {(aria) => (
                        <input
                          {...aria}
                          value={buyer.addressLine2}
                          onChange={(e) => setBuyer((b) => ({ ...b, addressLine2: e.target.value }))}
                          placeholder="Apartment, suite, unit, building, floor"
                          autoComplete="address-line2"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label="City / Town"
                      error={errs.buyerCity}
                      showError={shouldShowError('buyerCity')}
                    >
                      {(aria) => (
                        <input
                          {...aria}
                          value={buyer.city}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, city: v }))
                            if (showFieldErrors) {
                              patchFieldError('buyerCity', v.trim() ? null : 'Enter city or town.')
                            }
                          }}
                          placeholder="Kuah"
                          autoComplete="address-level2"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField label="State / Province / Region" optional>
                      {(aria) => (
                        <input
                          {...aria}
                          value={buyer.stateProvince}
                          onChange={(e) => setBuyer((b) => ({ ...b, stateProvince: e.target.value }))}
                          placeholder="Kedah"
                          autoComplete="address-level1"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label="Postal / ZIP code"
                      error={errs.buyerPostalCode}
                      showError={shouldShowError('buyerPostalCode')}
                    >
                      {(aria) => (
                        <input
                          {...aria}
                          value={buyer.postalCode}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, postalCode: v }))
                            if (showFieldErrors) {
                              patchFieldError(
                                'buyerPostalCode',
                                v.trim() ? null : 'Enter postal or ZIP code.',
                              )
                            }
                          }}
                          placeholder="07000"
                          autoComplete="postal-code"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label="Country"
                      error={errs.buyerCountry}
                      showError={shouldShowError('buyerCountry')}
                    >
                      {(aria) => (
                        <select
                          {...aria}
                          value={buyer.country}
                          onChange={(e) => {
                            const v = e.target.value
                            setBuyer((b) => ({ ...b, country: v }))
                            if (showFieldErrors) {
                              patchFieldError('buyerCountry', v.trim() ? null : 'Select country.')
                            }
                          }}
                          autoComplete="country-name"
                        >
                          {CHECKOUT_COUNTRIES.map((o) => (
                            <option key={o} value={o}>
                              {o}
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
                        <strong>Also as driver</strong>
                        <span className="checkout-also-driver-hint">
                          Use these details for the person picking up the car
                        </span>
                      </span>
                    </label>
                  </div>
                </section>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Driver details</h3>
                    <span className="checkout-card-meta">
                      {alsoAsDriver
                        ? 'License details for pickup · * Required'
                        : 'Person who will collect and drive the car · * Required'}
                    </span>
                  </div>
                  <div className="form-grid">
                    {!alsoAsDriver ? (
                      <>
                        <CheckoutField
                          label="Full name"
                          error={errs.driverName}
                          showError={shouldShowError('driverName')}
                        >
                          {(aria) => (
                            <input
                              {...aria}
                              value={driver.name}
                              onChange={(e) => {
                                const v = e.target.value
                                setDriver((d) => ({ ...d, name: v }))
                                if (showFieldErrors) {
                                  patchFieldError(
                                    'driverName',
                                    v.trim()
                                      ? null
                                      : 'Please enter the driver’s full name as shown on their license.',
                                  )
                                }
                              }}
                              placeholder="Driver full name"
                              autoComplete="off"
                            />
                          )}
                        </CheckoutField>
                        <CheckoutField
                          label="Email"
                          error={errs.driverEmail}
                          showError={shouldShowError('driverEmail')}
                        >
                          {(aria) => (
                            <input
                              {...aria}
                              type="email"
                              value={driver.email}
                              onChange={(e) => updateContactField('driver', 'email', e.target.value)}
                              onBlur={(e) => touchValidateField('driver', 'email', e.target.value)}
                              placeholder="driver@example.com"
                              autoComplete="off"
                            />
                          )}
                        </CheckoutField>
                        <CheckoutField
                          label="Mobile number"
                          error={errs.driverPhone}
                          showError={shouldShowError('driverPhone')}
                        >
                          {(aria) => (
                            <input
                              {...aria}
                              type="tel"
                              value={driver.phone}
                              onChange={(e) => updateContactField('driver', 'phone', e.target.value)}
                              onBlur={(e) => touchValidateField('driver', 'phone', e.target.value)}
                              placeholder="+60 12 345 6789"
                              autoComplete="off"
                            />
                          )}
                        </CheckoutField>
                      </>
                    ) : (
                      <p className="checkout-driver-linked form-grid-span-full">
                        Using <strong>{buyer.name.trim() || 'buyer name'}</strong>
                        {buyer.email ? ` · ${buyer.email}` : ''}
                        {buyer.phone ? ` · ${buyer.phone}` : ''}
                      </p>
                    )}
                    <CheckoutField
                      label="IC / Passport / License no."
                      error={errs.driverLicense}
                      showError={shouldShowError('driverLicense')}
                      className={alsoAsDriver ? 'form-grid-span-full' : undefined}
                    >
                      {(aria) => (
                        <input
                          {...aria}
                          value={driver.license}
                          onChange={(e) => {
                            const v = e.target.value
                            setDriver((d) => ({ ...d, license: v }))
                            if (showFieldErrors) {
                              patchFieldError(
                                'driverLicense',
                                v.trim()
                                  ? null
                                  : 'Please enter the driver’s IC, passport, or license number.',
                              )
                            }
                          }}
                          placeholder="MyKad / IDP / DL no."
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField
                      label="Issuing country"
                      className={alsoAsDriver ? 'form-grid-span-full' : undefined}
                    >
                      {(aria) => (
                        <select
                          {...aria}
                          value={driver.country}
                          onChange={(e) => setDriver((d) => ({ ...d, country: e.target.value }))}
                        >
                          {CHECKOUT_COUNTRIES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      )}
                    </CheckoutField>
                  </div>
                </section>


              </div>
            ) : null}

            {step === 1 && (user || guestCheckout) ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">Step 2 of 3</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    Payment.
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    {guestCheckout && !user
                      ? 'Complete payment with the details you entered — no account required.'
                      : "Secure checkout — you'll finish card or bank payment on the next screen (iPay88)."}
                  </p>
                </div>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Choose a payment method</h3>
                    <span className="checkout-card-meta">
                      <Shield size={11} /> Encrypted connection
                    </span>
                  </div>
                  <div className="pay-methods">
                    <PayMethodPicker payMethod={payMethod} onChange={setPayMethod} name="method-main" />
                  </div>
                </section>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>What happens next</h3>
                  </div>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                    We&apos;ll create your booking and take you to our payment page. Your car is held for a short window
                    while you complete payment.
                  </p>
                </section>

                {flowError ? (
                  <p className="checkout-flow-error" role="alert">
                    {flowError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 1 && !user && !guestCheckout ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">Step 2 of 3</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    Sign in to continue.
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    We need your account to hold the car and send your booking confirmation.
                  </p>
                </div>
                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Customer account</h3>
                  </div>
                  <p className="checkout-account-copy">
                    Sign in or create an account to save bookings to your profile — or continue as guest with the
                    details you already entered.
                  </p>
                  <div className="checkout-account-actions">
                    <Link to="/login" search={{ returnTo: checkoutReturnTo }} className="btn btn-leaf btn-lg">
                      Log in
                    </Link>
                    <Link to="/register" search={{ returnTo: checkoutReturnTo }} className="btn btn-ghost btn-lg">
                      Create account
                    </Link>
                    <button type="button" className="btn btn-ghost btn-lg" onClick={continueAsGuest}>
                      Continue as guest
                    </button>
                  </div>
                  <p className="checkout-account-footnote">
                    Or continue on the standard booking page (same dates we passed in the link).
                  </p>
                  <Link
                    to="/book/$carId"
                    params={{ carId: car.id }}
                    search={{
                      startDate: tripSearch.startDate,
                      endDate: tripSearch.endDate,
                    }}
                    className="checkout-edit"
                  >
                    Open booking form →
                  </Link>
                </section>
              </div>
            ) : null}

            {step === 2 && rentalId ? (
              <div className="checkout-section">
                <div className="confirmation-hero">
                  <div className="confirmation-tick">
                    <Check size={26} />
                  </div>
                  <span className="eyebrow" style={{ color: 'var(--brand-leaf)' }}>
                    Step 3 of 3 · Booking created
                  </span>
                  <h2 className="h-section">You&apos;re almost there.</h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    We&apos;ve saved your trip for <b style={{ color: 'var(--ink)' }}>{buyer.email}</b>. Complete
                    payment now to confirm — show your booking reference at pickup.
                  </p>
                  <div className="confirmation-id">
                    <span>Booking ref</span>
                    <strong>{rentalId.slice(0, 8).toUpperCase()}</strong>
                  </div>
                </div>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Secure payment</h3>
                  </div>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                    You&apos;ll pay <b>RM {total}</b> (or your deposit, if applicable) on the next screen via iPay88.
                  </p>
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
              <div>
                <div className="cs-car-name">{vehicleTitle(car)}</div>
                <div className="cs-car-meta">
                  <Cog size={11} /> {car.category} · <span>{lug.seats} seats</span>
                </div>
              </div>
            </div>

            <div className="cs-trip">
              <div className="cs-trip-legs">
                <div className="cs-trip-leg">
                  <span className="cs-trip-lbl">Pickup</span>
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
                <div className="cs-trip-duration">
                  <Clock size={13} aria-hidden />
                  <span>{tripDuration}</span>
                </div>
                <div className="cs-trip-leg cs-trip-leg--return">
                  <span className="cs-trip-lbl">Return</span>
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
            <div className="cs-rows">
              <div className="cs-row">
                <span>
                  Daily rate × {nights}
                </span>
                <span>RM {subtotal}</span>
              </div>
              <div className="cs-row">
                <span>Early-bird discount</span>
                <span style={{ color: 'var(--brand-coral)' }}>−RM {discount}</span>
              </div>
              {extraHours > 0 ? (
                <div className="cs-row">
                  <span>Extra hours ({formatExtraHours(extraHours)})</span>
                  <span>RM {extraHoursCharge}</span>
                </div>
              ) : null}
              {ADDONS.filter((a) => addons[a.key]).map((a) => (
                <div key={a.key} className="cs-row">
                  <span>{a.title}</span>
                  <span>RM {a.price}</span>
                </div>
              ))}
              <div className="cs-row">
                <span>Service tax (6%)</span>
                <span>RM {tax}</span>
              </div>
            </div>
            <div className="cs-divider" />
            <div className="cs-total">
              <span>Total to pay</span>
              <span>RM {total}</span>
            </div>
            <div className="cs-trust">
              <span>
                <Check size={11} /> No charge until you complete payment
              </span>
            </div>

            {step < 2 ? (
              step === 1 && !user && !guestCheckout ? (
                <button type="button" className="btn btn-ghost btn-lg" onClick={() => setStep(0)}>
                  Back to review
                </button>
              ) : (
                <div className="cs-pay-actions">
                  <button type="button" className="btn btn-leaf btn-lg" onClick={() => void advance()} disabled={submitting}>
                    {step === 0
                      ? 'Continue to payment'
                      : submitting
                        ? 'Creating booking…'
                        : 'Create booking & continue'}
                    {submitting ? <LoadingSpinner size={16} aria-hidden /> : <ArrowRight size={14} />}
                  </button>
                  <CheckoutPaymentIcons />
                </div>
              )
            ) : (
              <div className="cs-pay-actions">
                <button type="button" className="btn btn-leaf btn-lg" onClick={() => void advance()} disabled={!rentalId}>
                  Pay RM {total} <ArrowRight size={14} />
                </button>
                <CheckoutPaymentIcons />
              </div>
            )}

          </aside>
        </div>
    </div>
  )
}
