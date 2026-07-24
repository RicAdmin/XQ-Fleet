import { catalogFitInput } from '#/lib/car-catalog'
import { carLuggageFit } from '#/lib/fleet-luggage-fit'
import type { PublicCarRow } from '#/lib/portal-functions'
import type { CarCategory } from '#/db/schema'

export class CarFitRecommendationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CarFitRecommendationError'
  }
}

export type TripStyle = 'Small' | 'Comfort' | 'Adventure'

export type HireIntent = {
  adults?: number
  children?: number
  bags?: number
  tripStyle?: TripStyle
}

export type CarFitExample = {
  id: string
  displayName: string
  category: CarCategory
  dailyRateMyr: number
  seats: number
  bagCapacity: number
  fitsParty: boolean
  fitsBags: boolean
}

export type CategoryExamples = {
  category: CarCategory
  examples: CarFitExample[]
}

export type CarFitRecommendation = {
  primary: CategoryExamples & { rationale: string }
  alternatives: CategoryExamples[]
  tightFit: boolean
  partialFit: boolean
  message: string
}

export type CarFitRecommendationDeps = {
  listFleetCars: () => Promise<PublicCarRow[]>
}

const ALL_CATEGORIES: CarCategory[] = ['economy', 'mpv', 'suv', 'other']

const STYLE_CATEGORIES: Record<TripStyle, CarCategory[]> = {
  Small: ['economy'],
  Comfort: ['economy', 'mpv'],
  Adventure: ['suv', 'other'],
}

function requireAdults(intent: HireIntent): number {
  if (intent.adults == null || !Number.isInteger(intent.adults) || intent.adults < 1) {
    throw new CarFitRecommendationError('adults is required and must be an integer ≥ 1 for Hire intent.')
  }
  if (intent.adults > 9) {
    throw new CarFitRecommendationError('adults must be between 1 and 9 for Hire intent.')
  }
  return intent.adults
}

function normalizeChildren(intent: HireIntent): number {
  if (intent.children == null) return 0
  if (!Number.isInteger(intent.children) || intent.children < 0 || intent.children > 8) {
    throw new CarFitRecommendationError('children must be an integer between 0 and 8 for Hire intent.')
  }
  return intent.children
}

function normalizeBags(intent: HireIntent): number {
  if (intent.bags == null) return 0
  if (!Number.isInteger(intent.bags) || intent.bags < 0) {
    throw new CarFitRecommendationError('bags must be a non-negative integer for Hire intent.')
  }
  return intent.bags
}

function carDisplayName(car: PublicCarRow): string {
  return `${car.make} ${car.model}`.trim()
}

function carCapacity(car: PublicCarRow) {
  const fit = carLuggageFit(catalogFitInput(car))
  return { seats: fit.seats, bagCapacity: fit.lg + fit.sm }
}

function toExample(car: PublicCarRow, party: number, bags: number): CarFitExample {
  const { seats, bagCapacity } = carCapacity(car)
  return {
    id: car.id,
    displayName: carDisplayName(car),
    category: car.category,
    dailyRateMyr: car.dailyRateSen / 100,
    seats,
    bagCapacity,
    fitsParty: seats >= party,
    fitsBags: bagCapacity >= bags,
  }
}

function perfectFit(example: CarFitExample): boolean {
  return example.fitsParty && example.fitsBags
}

function exampleFitRank(example: CarFitExample): number {
  if (perfectFit(example)) return 2
  if (example.fitsParty || example.fitsBags) return 1
  return 0
}

function pickExamples(cars: PublicCarRow[], category: CarCategory, party: number, bags: number): CarFitExample[] {
  const inCategory = cars.filter((c) => c.category === category)
  const mapped = inCategory.map((c) => toExample(c, party, bags))
  const perfect = mapped.filter(perfectFit)
  const pool = perfect.length > 0 ? perfect : mapped
  return [...pool]
    .sort((a, b) => {
      const rankDiff = exampleFitRank(b) - exampleFitRank(a)
      if (rankDiff !== 0) return rankDiff
      // Among partial fits, prefer more capacity before price.
      if (!perfectFit(a) || !perfectFit(b)) {
        const seatDiff = b.seats - a.seats
        if (seatDiff !== 0) return seatDiff
        const bagDiff = b.bagCapacity - a.bagCapacity
        if (bagDiff !== 0) return bagDiff
      }
      return a.dailyRateMyr - b.dailyRateMyr || a.displayName.localeCompare(b.displayName)
    })
    .slice(0, 3)
}

function categoryHasPerfectFit(cars: PublicCarRow[], category: CarCategory, party: number, bags: number): boolean {
  return cars.some((c) => {
    if (c.category !== category) return false
    return perfectFit(toExample(c, party, bags))
  })
}

function maxSeatsInCategory(cars: PublicCarRow[], category: CarCategory): number {
  let max = 0
  for (const car of cars) {
    if (car.category !== category) continue
    max = Math.max(max, carCapacity(car).seats)
  }
  return max
}

function maxBagsInCategory(cars: PublicCarRow[], category: CarCategory): number {
  let max = 0
  for (const car of cars) {
    if (car.category !== category) continue
    max = Math.max(max, carCapacity(car).bagCapacity)
  }
  return max
}

/** Prefer categories that can seat the party and hold bags; fall back to largest capacity. */
function rankCategories(
  candidates: CarCategory[],
  cars: PublicCarRow[],
  party: number,
  bags: number,
): CarCategory[] {
  return [...candidates].sort((a, b) => {
    const aPerfect = categoryHasPerfectFit(cars, a, party, bags) ? 1 : 0
    const bPerfect = categoryHasPerfectFit(cars, b, party, bags) ? 1 : 0
    if (aPerfect !== bPerfect) return bPerfect - aPerfect

    const aSeats = maxSeatsInCategory(cars, a)
    const bSeats = maxSeatsInCategory(cars, b)
    const aSeatOk = aSeats >= party ? 1 : 0
    const bSeatOk = bSeats >= party ? 1 : 0
    if (aSeatOk !== bSeatOk) return bSeatOk - aSeatOk

    const aBags = maxBagsInCategory(cars, a)
    const bBags = maxBagsInCategory(cars, b)
    const aBagOk = aBags >= bags ? 1 : 0
    const bBagOk = bBags >= bags ? 1 : 0
    if (aBagOk !== bBagOk) return bBagOk - aBagOk

    // Prefer more seats when neither (or both) fit — larger groups need MPV before economy.
    if (aSeats !== bSeats) return bSeats - aSeats
    if (aBags !== bBags) return bBags - aBags

    return ALL_CATEGORIES.indexOf(a) - ALL_CATEGORIES.indexOf(b)
  })
}

function candidateCategories(tripStyle: TripStyle | undefined): CarCategory[] {
  if (!tripStyle) return [...ALL_CATEGORIES]
  return [...STYLE_CATEGORIES[tripStyle]]
}

function rationaleFor(
  category: CarCategory,
  party: number,
  bags: number,
  tripStyle: TripStyle | undefined,
  tightFit: boolean,
  partialFit: boolean,
): string {
  const styleBit = tripStyle ? ` for a ${tripStyle} trip style` : ''
  const partyBit = `${party} passenger${party === 1 ? '' : 's'}`
  const bagBit = bags > 0 ? ` and ${bags} bag${bags === 1 ? '' : 's'}` : ''
  let base = `${category} suits ${partyBit}${bagBit}${styleBit}.`
  if (partialFit) {
    base += ' No fleet example fully matches seats and bags — treat examples as partial fits and consider fewer bags, a larger Category, or two cars.'
  } else if (tightFit) {
    base += ' Capacity is tight for this Hire intent.'
  }
  return base
}

export async function recommendCarFit(
  intent: HireIntent,
  deps: CarFitRecommendationDeps,
): Promise<CarFitRecommendation> {
  const adults = requireAdults(intent)
  const children = normalizeChildren(intent)
  const bags = normalizeBags(intent)
  const party = adults + children
  const tripStyle = intent.tripStyle

  if (tripStyle != null && !(tripStyle in STYLE_CATEGORIES)) {
    throw new CarFitRecommendationError('tripStyle must be Small, Comfort, or Adventure when provided.')
  }

  const cars = await deps.listFleetCars()
  const ranked = rankCategories(candidateCategories(tripStyle), cars, party, bags)
  const primaryCategory = ranked[0] ?? 'economy'
  const primaryExamples = pickExamples(cars, primaryCategory, party, bags)

  const primaryPerfect = primaryExamples.length > 0 && primaryExamples.every(perfectFit)
  const partialFit =
    !categoryHasPerfectFit(cars, primaryCategory, party, bags) ||
    (primaryExamples.length > 0 && !primaryPerfect)
  const seatMax = maxSeatsInCategory(cars, primaryCategory)
  const bagMax = maxBagsInCategory(cars, primaryCategory)
  // Tight = at the limit of what the Category can hold, while still a full fit (distinct from partialFit).
  const tightFit =
    !partialFit &&
    ((seatMax > 0 && party >= seatMax) || (bagMax > 0 && bags > 0 && bags >= bagMax))

  const alternatives: CategoryExamples[] = ranked.slice(1).map((category) => ({
    category,
    examples: pickExamples(cars, category, party, bags),
  }))

  // Keep alternatives that either fit or are in the style shortlist; drop empty non-fitting noise when style unset
  const filteredAlternatives = tripStyle
    ? alternatives
    : alternatives.filter(
        (alt) =>
          alt.examples.some(perfectFit) || categoryHasPerfectFit(cars, alt.category, party, bags),
      )

  const message = partialFit
    ? 'Best-effort Car fit recommendation: capacity is strained for this Hire intent.'
    : `Recommended ${primaryCategory} for this Hire intent.`

  return {
    primary: {
      category: primaryCategory,
      rationale: rationaleFor(primaryCategory, party, bags, tripStyle, tightFit, partialFit),
      examples: primaryExamples,
    },
    alternatives: filteredAlternatives,
    tightFit,
    partialFit,
    message,
  }
}
