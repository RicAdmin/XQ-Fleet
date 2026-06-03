import type { CarCategory } from '#/db/schema'

/** Fields used to derive luggage / capacity display (from DB or CSV catalog). */
export type CarCatalogFitInput = {
  category: CarCategory
  passengers?: number | null
  doors?: number | null
  largeSuitcasesCount?: number | null
  smallCarryonsCount?: number | null
  bootCapacityLabel?: string | null
  bootCapacityL?: number | null
  combinedCapacityL?: number | null
}

export type CarLuggageFit = {
  seats: number
  lg: number
  sm: number
  boot: string
  doors: number
  groups: readonly string[]
}

/** Category defaults when per-car catalog counts are missing. */
export function heuristicLuggageFit(category: CarCategory): CarLuggageFit {
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

/** Luggage fit from catalog row, falling back to category heuristics. */
export function carLuggageFit(car: CarCatalogFitInput): CarLuggageFit {
  const base = heuristicLuggageFit(car.category)
  const boot =
    car.bootCapacityLabel?.trim() ||
    (car.bootCapacityL != null ? `${car.bootCapacityL} L` : null) ||
    base.boot

  return {
    seats: car.passengers ?? base.seats,
    lg: car.largeSuitcasesCount ?? base.lg,
    sm: car.smallCarryonsCount ?? base.sm,
    boot,
    doors: car.doors ?? base.doors,
    groups: base.groups,
  }
}

export type CarSpecInput = CarCatalogFitInput & {
  make: string
  model: string
  notes?: string | null
  fuelType?: string | null
}

/** Passenger capacity label for cards and detail UI. */
export function fleetPassengerLabel(car: CarSpecInput): string {
  const seats = carLuggageFit(car).seats
  return `${seats} passengers`
}

/** Fuel type from catalog, notes, or model naming. */
export function fleetFuelType(car: CarSpecInput): string {
  if (car.fuelType?.trim()) return car.fuelType.trim()
  const hay = `${car.make} ${car.model} ${car.notes ?? ''}`.toLowerCase()
  if (/\bdiesel\b/.test(hay)) return 'Diesel'
  if (/\b(hybrid|phev|plug-in)\b/.test(hay)) return 'Hybrid'
  if (/\bev\b|electric\b/.test(hay)) return 'Electric'
  return 'Petrol'
}

/** Combined luggage litres for display (catalog or estimate from bag counts). */
export function catalogCombinedLitres(car: CarCatalogFitInput, fit: CarLuggageFit): number {
  if (car.combinedCapacityL != null && car.combinedCapacityL > 0) return car.combinedCapacityL
  return fit.lg * 75 + fit.sm * 35
}
