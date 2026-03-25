import { useState } from 'react'

import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import PublicPageShell from '#/components/shells/PublicPageShell'
import { getRequestSession } from '#/lib/auth-functions'
import { createPortalBooking } from '#/lib/portal-booking-functions'
import { getPublicCarDetail } from '#/lib/portal-functions'

export const Route = createFileRoute('/book/$carId')({
  validateSearch: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  beforeLoad: async ({ params, search }) => {
    const session = await getRequestSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { returnTo: `/book/${params.carId}?startDate=${search.startDate ?? ''}&endDate=${search.endDate ?? ''}` },
      })
    }
    return { session }
  },
  loader: async ({ params }) => {
    const car = await getPublicCarDetail({ data: { carId: params.carId } })
    if (!car) throw redirect({ to: '/' })
    return { car }
  },
  component: BookingPage,
})

function formatRM(amountSen: number) {
  return `RM ${(amountSen / 100).toFixed(2)}`
}

function calcDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0
  return Math.ceil((e.getTime() - s.getTime()) / 86_400_000)
}

function BookingPage() {
  const navigate = Route.useNavigate()
  const { carId } = Route.useParams()
  const { startDate: initStart = '', endDate: initEnd = '' } = Route.useSearch()
  const { car } = Route.useLoaderData()

  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(initStart || today)
  const [endDate, setEndDate] = useState(initEnd || '')
  const [fullName, setFullName] = useState('')
  const [icOrPassport, setIcOrPassport] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const days = calcDays(startDate, endDate)
  const totalSen = days > 0 ? car.dailyRateSen * days : 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (days <= 0) {
      setError('Please select valid pickup and return dates.')
      return
    }
    setIsSubmitting(true)
    try {
      const { rentalId } = await createPortalBooking({
        data: { carId, startDate, endDate, fullName, icOrPassport, phone, address },
      })
      await navigate({ to: '/account/bookings/$rentalId', params: { rentalId }, search: { confirmed: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PublicPageShell className="page-wrap px-4 pb-16 pt-8">
      <div className="booking-page">
        {/* Header */}
        <div className="booking-header">
          <p className="booking-eyebrow">Book your car</p>
          <h1 className="booking-title">
            {car.year} {car.make} {car.model}
          </h1>
          <p className="booking-rate">{formatRM(car.dailyRateSen)} / day</p>
        </div>

        <div className="booking-layout">
          {/* Form */}
          <form className="booking-form" onSubmit={handleSubmit}>
            <section className="booking-section">
              <h2 className="booking-section-title">Rental period</h2>
              <div className="booking-date-row">
                <div>
                  <label className="field-label" htmlFor="book-start">
                    Pickup date
                  </label>
                  <input
                    id="book-start"
                    type="date"
                    className="field-input"
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-end">
                    Return date
                  </label>
                  <input
                    id="book-end"
                    type="date"
                    className="field-input"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="booking-section">
              <h2 className="booking-section-title">Your details</h2>
              <div className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="book-name">
                    Full name (as per IC / passport)
                  </label>
                  <input
                    id="book-name"
                    type="text"
                    autoComplete="name"
                    className="field-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-ic">
                    IC or passport number
                  </label>
                  <input
                    id="book-ic"
                    type="text"
                    className="field-input"
                    value={icOrPassport}
                    onChange={(e) => setIcOrPassport(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-phone">
                    Phone number
                  </label>
                  <input
                    id="book-phone"
                    type="tel"
                    autoComplete="tel"
                    className="field-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-address">
                    Address <span className="text-[var(--sea-ink-soft)] font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="book-address"
                    className="field-input resize-none"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {error ? <p className="form-error">{error}</p> : null}

            <button
              type="submit"
              className="button-primary w-full justify-center"
              disabled={isSubmitting || days <= 0}
            >
              {isSubmitting ? 'Confirming booking…' : 'Confirm booking'}
            </button>
          </form>

          {/* Summary card */}
          <aside className="booking-summary-card">
            {car.photos[0] ? (
              <img
                src={car.photos[0].url}
                alt={`${car.make} ${car.model}`}
                className="booking-summary-photo"
              />
            ) : (
              <div className="booking-summary-photo-placeholder" />
            )}
            <div className="booking-summary-body">
              <p className="booking-summary-car">
                {car.year} {car.make} {car.model}
              </p>
              <p className="booking-summary-category">{car.category}</p>

              {days > 0 ? (
                <div className="booking-summary-breakdown">
                  <div className="booking-summary-row">
                    <span>{formatRM(car.dailyRateSen)} × {days} day{days !== 1 ? 's' : ''}</span>
                    <span>{formatRM(totalSen)}</span>
                  </div>
                  <div className="booking-summary-total-row">
                    <span>Total</span>
                    <span>{formatRM(totalSen)}</span>
                  </div>
                </div>
              ) : (
                <p className="booking-summary-hint">Select dates to see total</p>
              )}

              {car.notes ? (
                <p className="booking-summary-notes">{car.notes}</p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </PublicPageShell>
  )
}
