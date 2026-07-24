import type { PublicCarRow } from '#/lib/portal-functions'
import { publicLocalePath } from '#/lib/brand'
import { countRentalDays } from '#/lib/pricing-logic'
import { parseLocalYmd } from '#/lib/booking-datetime'

export class AgentCheckoutHandoffError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgentCheckoutHandoffError'
  }
}

export type TripInput = {
  startDate?: string
  endDate?: string
  from?: string
  retLoc?: string
  tripType?: 'round' | 'oneway'
  pickTime?: string
  retTime?: string
  adults?: number
  children?: number
}

export type QuoteEstimate = {
  nights: number
  estimatedTotalMyr: number
  disclaimer: string
}

export type AvailableCarResult = {
  id: string
  displayName: string
  category: string
  dailyRateMyr: number
  quoteEstimate: QuoteEstimate
}

export type SearchAvailableCarsResult = {
  message: string
  cars: AvailableCarResult[]
}

export type CheckoutUrlResult = {
  checkoutUrl: string
}

export type AgentCheckoutHandoffDeps = {
  searchCars: (input: { startDate: string; endDate: string }) => Promise<PublicCarRow[]>
  getCar: (carId: string) => Promise<PublicCarRow | null>
  siteUrl?: string
}

const QUOTE_DISCLAIMER =
  'Estimate only: daily rate × trip nights. Checkout totals are authoritative and may differ.'

export function tripNights(startDate: string, endDate: string): number {
  const start = parseLocalYmd(startDate)
  const end = parseLocalYmd(endDate)
  if (!start || !end) return 0
  return countRentalDays(start, end)
}

export function quoteEstimateForTrip(
  dailyRateSen: number,
  startDate: string,
  endDate: string,
): QuoteEstimate {
  const nights = tripNights(startDate, endDate)
  const dailyRateMyr = dailyRateSen / 100
  return {
    nights,
    estimatedTotalMyr: Math.round(dailyRateMyr * nights * 100) / 100,
    disclaimer: QUOTE_DISCLAIMER,
  }
}

function requireTripDates(trip: TripInput): { startDate: string; endDate: string } {
  if (!trip.startDate || !trip.endDate) {
    throw new AgentCheckoutHandoffError('startDate and endDate are required for the Trip.')
  }

  const start = parseLocalYmd(trip.startDate)
  const end = parseLocalYmd(trip.endDate)
  if (!start || !end) {
    throw new AgentCheckoutHandoffError('startDate and endDate must be valid YYYY-MM-DD dates.')
  }
  if (end <= start) {
    throw new AgentCheckoutHandoffError('endDate must be after startDate for the Trip.')
  }

  return { startDate: trip.startDate, endDate: trip.endDate }
}

/** Agent meet-point ids mapped to checkout labels used by the public site. */
const MEET_POINT_ALIASES: Record<string, string> = {
  'lgk-airport': 'Langkawi Intl Airport · Door 3',
  airport: 'Langkawi Intl Airport · Door 3',
  'kuah-jetty': 'Langkawi Ferry Jetty (Kuah)',
  jetty: 'Langkawi Ferry Jetty (Kuah)',
}

export function normalizeMeetPointForCheckout(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  const trimmed = value.trim()
  return MEET_POINT_ALIASES[trimmed.toLowerCase()] ?? trimmed
}

function carDisplayName(car: PublicCarRow): string {
  return `${car.make} ${car.model}`.trim()
}

function mapAvailableCar(car: PublicCarRow, trip: { startDate: string; endDate: string }): AvailableCarResult {
  const quoteEstimate = quoteEstimateForTrip(car.dailyRateSen, trip.startDate, trip.endDate)
  return {
    id: car.id,
    displayName: carDisplayName(car),
    category: car.category,
    dailyRateMyr: car.dailyRateSen / 100,
    quoteEstimate,
  }
}

export async function searchAvailableCars(
  trip: TripInput,
  deps: AgentCheckoutHandoffDeps,
): Promise<SearchAvailableCarsResult> {
  const { startDate, endDate } = requireTripDates(trip)
  const cars = await deps.searchCars({ startDate, endDate })
  const results = cars.map((car) => mapAvailableCar(car, { startDate, endDate }))

  if (results.length === 0) {
    return {
      message: 'No available cars for this Trip. Try different dates.',
      cars: [],
    }
  }

  return {
    message: `${results.length} available car${results.length === 1 ? '' : 's'} for this Trip.`,
    cars: results,
  }
}

export function buildCheckoutUrl(siteUrl: string, carId: string, trip: TripInput): string {
  const { startDate, endDate } = requireTripDates(trip)
  const base = publicLocalePath(`/checkout/${carId}`, 'en', siteUrl)
  const params = new URLSearchParams({
    startDate,
    endDate,
  })

  if (trip.from) params.set('from', normalizeMeetPointForCheckout(trip.from)!)
  if (trip.retLoc) params.set('retLoc', normalizeMeetPointForCheckout(trip.retLoc)!)
  if (trip.tripType) params.set('tripType', trip.tripType)
  if (trip.pickTime) params.set('pickTime', trip.pickTime)
  if (trip.retTime) params.set('retTime', trip.retTime)
  if (trip.adults != null) params.set('adults', String(trip.adults))
  if (trip.children != null) params.set('children', String(trip.children))

  return `${base}?${params.toString()}`
}

export async function getCheckoutUrl(
  input: { carId: string } & TripInput,
  deps: AgentCheckoutHandoffDeps,
): Promise<CheckoutUrlResult> {
  requireTripDates(input)
  const car = await deps.getCar(input.carId)
  if (!car) {
    throw new AgentCheckoutHandoffError(`Unknown car id: ${input.carId}`)
  }

  const siteUrl = deps.siteUrl ?? 'http://localhost:3000'
  return {
    checkoutUrl: buildCheckoutUrl(siteUrl, input.carId, input),
  }
}
