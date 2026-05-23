import '#/components/landing/cxq-landing-scoped.css'
import '#/components/landing/cxq-landing-overrides.css'

import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowRight, Check, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import { z } from 'zod'

import { LocaleLink } from '#/components/i18n/LocaleLink'
import { SiteFooter } from '#/components/landing/CxqLandingPage'
import type { Locale } from '#/i18n/locales'
import { usePublicI18n } from '#/i18n/usePublicI18n'
import type { TranslateFn } from '#/i18n/translate'
import { getGuestBookingSummary } from '#/lib/portal-booking-functions'

export const Route = createFileRoute('/$locale/checkout/confirmed/$rentalId')({
  validateSearch: z.object({
    payment: z.enum(['response', 'error']).optional(),
  }),
  loader: async ({ params }) => {
    const booking = await getGuestBookingSummary({ data: { rentalId: params.rentalId } })
    return { booking, rentalId: params.rentalId }
  },
  component: GuestBookingConfirmedPage,
})

const DATE_LOCALE: Record<Locale, string> = {
  en: 'en-GB',
  ms: 'ms-MY',
  zh: 'zh-CN',
}

type ConfirmationVariant = 'success' | 'pending' | 'error' | 'awaiting' | 'notFound'

function formatRM(amountSen: number) {
  return `RM ${(amountSen / 100).toFixed(2)}`
}

function formatTripDate(value: string | Date, locale: Locale) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString(DATE_LOCALE[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function bookingRefCode(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function ConfirmationIcon({ variant }: { variant: ConfirmationVariant }) {
  if (variant === 'error' || variant === 'notFound') {
    return (
      <div className="confirmation-tick">
        <XCircle size={26} />
      </div>
    )
  }
  if (variant === 'pending') {
    return (
      <div className="confirmation-tick">
        <Loader2 size={26} className="confirmation-spin-icon" />
      </div>
    )
  }
  return (
    <div className="confirmation-tick">
      <Check size={26} />
    </div>
  )
}

function TripSummaryCard({
  carLabel,
  startDate,
  endDate,
  totalAmountSen,
  locale,
  t,
}: {
  carLabel: string
  startDate: string | Date
  endDate: string | Date
  totalAmountSen: number
  locale: Locale
  t: TranslateFn
}) {
  const dateRange = `${formatTripDate(startDate, locale)} ${t('payment.dateSeparator')} ${formatTripDate(endDate, locale)}`

  return (
    <section className="confirmation-trip-card">
      <h3>{t('payment.tripSummary')}</h3>
      <div className="confirmation-trip-rows">
        <div className="confirmation-trip-row">
          <span>{t('payment.vehicle')}</span>
          <span>{carLabel}</span>
        </div>
        <div className="confirmation-trip-row">
          <span>{t('payment.rentalDates')}</span>
          <span>{dateRange}</span>
        </div>
        <div className="confirmation-trip-row confirmation-trip-row--total">
          <span>{t('payment.total')}</span>
          <strong>{formatRM(totalAmountSen)}</strong>
        </div>
      </div>
    </section>
  )
}

function NextSteps({ variant, t }: { variant: 'success' | 'pending'; t: TranslateFn }) {
  const steps =
    variant === 'success'
      ? [t('payment.successStep1'), t('payment.successStep2')]
      : [t('payment.pendingStep1'), t('payment.pendingStep2'), t('payment.pendingStep3')]

  return (
    <section className="confirmation-steps">
      <h3>{t('payment.whatsNext')}</h3>
      <ol>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  )
}

function GuestBookingConfirmedPage() {
  const { booking, rentalId } = Route.useLoaderData()
  const { payment } = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const { t, locale } = usePublicI18n()

  const showPaymentSuccess = Boolean(booking && payment === 'response' && booking.customerStatus === 'Confirmed')
  const showPaymentPending = Boolean(
    booking && payment === 'response' && booking.customerStatus === 'Pending Payment',
  )
  const showPaymentFail = payment === 'error'
  const showAwaitingPayment = Boolean(booking && !showPaymentSuccess && !showPaymentPending && !showPaymentFail)

  useEffect(() => {
    if (!showPaymentPending) return
    const timer = window.setInterval(() => {
      void router.invalidate()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [showPaymentPending, router])

  let variant: ConfirmationVariant = 'notFound'
  if (booking) {
    if (showPaymentSuccess) variant = 'success'
    else if (showPaymentPending) variant = 'pending'
    else if (showPaymentFail) variant = 'error'
    else variant = 'awaiting'
  }

  const carLabel = booking ? `${booking.carYear} ${booking.carMake} ${booking.carModel}` : ''
  const bookingRef = booking ? bookingRefCode(booking.id) : bookingRefCode(rentalId)

  const heroCopy = (() => {
    switch (variant) {
      case 'success':
        return {
          eyebrow: t('payment.confirmedBadge'),
          title: t('payment.bookingConfirmed'),
          sub: t('payment.confirmationEmailSent'),
        }
      case 'pending':
        return {
          eyebrow: t('payment.paymentReceived'),
          title: t('payment.confirmingBooking'),
          sub: t('payment.paymentSubmitted'),
          hint: t('payment.pendingHint'),
        }
      case 'error':
        return {
          eyebrow: t('payment.paymentIncomplete'),
          title: t('payment.couldNotConfirm'),
          sub: t('payment.paymentFailSub'),
        }
      case 'awaiting':
        return {
          eyebrow: t('payment.bookingSaved'),
          title: t('payment.almostThere'),
          sub: t('payment.completePayment', { car: carLabel }),
        }
      default:
        return {
          eyebrow: t('payment.bookingNotFound'),
          title: t('payment.bookingNotFoundTitle'),
          sub: t('payment.bookingNotFoundSub'),
        }
    }
  })()

  return (
    <div className="cxq-landing-page">
      <div className="page page--checkout" data-screen-label="XQ Car Guest Booking">
        <div className="checkout-page-frame">
            <div className="checkout checkout--confirmed">
            <div className="checkout-section confirmation-page">
              <div className={`confirmation-hero confirmation-hero--${variant}`}>
                <ConfirmationIcon variant={variant} />
                <span
                  className="eyebrow"
                  style={
                    variant === 'error' || variant === 'notFound'
                      ? { color: 'var(--brand-coral)' }
                      : variant === 'success'
                        ? { color: '#1a7a42' }
                        : { color: 'var(--brand-leaf)' }
                  }
                >
                  {heroCopy.eyebrow}
                </span>
                <h2 className="h-section">{heroCopy.title}</h2>
                <p className="h-sub">{heroCopy.sub}</p>
                {'hint' in heroCopy && heroCopy.hint ? (
                  <p className="confirmation-hint">{heroCopy.hint}</p>
                ) : null}
                <div className="confirmation-id">
                  <span>{variant === 'notFound' ? t('payment.reference') : t('payment.bookingRef')}</span>
                  <strong>{bookingRef}</strong>
                </div>
              </div>

              {booking ? (
                <TripSummaryCard
                  carLabel={carLabel}
                  startDate={booking.startDate}
                  endDate={booking.endDate}
                  totalAmountSen={booking.totalAmountSen}
                  locale={locale}
                  t={t}
                />
              ) : null}

              {variant === 'success' || variant === 'pending' ? (
                <NextSteps variant={variant} t={t} />
              ) : null}

              <div className="confirmation-actions">
                {showAwaitingPayment && booking ? (
                  <button
                    type="button"
                    className="btn btn-leaf btn-lg"
                    onClick={() => void navigate({ to: '/pay/$rentalId', params: { rentalId: booking.id } })}
                  >
                    {t('payment.payAmount', { amount: formatRM(booking.totalAmountSen) })}{' '}
                    <ArrowRight size={14} />
                  </button>
                ) : null}

                {showPaymentFail && booking ? (
                  <button
                    type="button"
                    className="btn btn-leaf btn-lg"
                    onClick={() => void navigate({ to: '/pay/$rentalId', params: { rentalId: booking.id } })}
                  >
                    {t('payment.tryAgain')} <ArrowRight size={14} />
                  </button>
                ) : null}

                {variant === 'pending' ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-leaf btn-lg"
                      onClick={() => void navigate({ to: '/pay/$rentalId', params: { rentalId: booking!.id } })}
                    >
                      {t('payment.tryAgain')} <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-lg"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw size={14} /> {t('payment.refreshPage')}
                    </button>
                  </>
                ) : null}

                {variant === 'success' || variant === 'notFound' ? (
                  <LocaleLink to="/" className="btn btn-leaf btn-lg">
                    {t('payment.backHome')} <ArrowRight size={14} />
                  </LocaleLink>
                ) : null}
              </div>

              {booking ? (
                <p className="confirmation-footnote">
                  {t('payment.trackBookings')}{' '}
                  <LocaleLink to="/register" className="checkout-edit">
                    {t('payment.createAccountSameEmail')}
                  </LocaleLink>{' '}
                  {t('payment.withSameEmail')}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}
