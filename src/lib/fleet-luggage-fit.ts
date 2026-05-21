import type { CarCategory } from '#/db/schema'

type CarSpecInput = {
  make: string
  model: string
  category: CarCategory
  notes?: string | null
}

/** Illustrative luggage fit (75 L “large”, 35 L “small”) by fleet category — same rules as the pick-car guide. */
export type HeuristicLuggageFit = {
  seats: number
  lg: number
  sm: number
  boot: string
  doors: number
  groups: readonly string[]
}

export function heuristicLuggageFit(category: CarCategory): HeuristicLuggageFit {
  switch (category) {
    case 'economy':
      return {
        seats: 5,
        lg: 2,
        sm: 2,
        boot: '~400 L',
        doors: 4,
        groups: ['Small', 'Comfort'],
      }
    case 'mpv':
      return {
        seats: 7,
        lg: 3,
        sm: 3,
        boot: '~520 L',
        doors: 4,
        groups: ['Comfort'],
      }
    case 'suv':
      return {
        seats: 5,
        lg: 2,
        sm: 3,
        boot: '~480 L',
        doors: 5,
        groups: ['Adventure', 'Comfort'],
      }
    default:
      return {
        seats: 5,
        lg: 2,
        sm: 2,
        boot: 'Varies',
        doors: 4,
        groups: ['Comfort'],
      }
  }
}

/** Passenger capacity label for cards and detail UI. */
export function fleetPassengerLabel(car: CarSpecInput): string {
  const seats = heuristicLuggageFit(car.category).seats
  return `${seats} passengers`
}

/** Fuel type from notes or common fleet naming; defaults to petrol. */
export function fleetFuelType(car: CarSpecInput): string {
  const hay = `${car.make} ${car.model} ${car.notes ?? ''}`.toLowerCase()
  if (/\bdiesel\b/.test(hay)) return 'Diesel'
  if (/\b(hybrid|phev|plug-in)\b/.test(hay)) return 'Hybrid'
  if (/\bev\b|electric\b/.test(hay)) return 'Electric'
  return 'Petrol'
}
