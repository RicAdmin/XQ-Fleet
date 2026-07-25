import { describe, expect, it } from 'vitest'

import type { PublicCarRow } from '#/lib/portal-functions'
import {
  fleetBookingCapacity,
  isFleetAtCapacity,
  type FleetCapacity,
} from '#/lib/fleet-capacity'
import {
  listAvailableCarsForTrip,
  rentalIntervalsOverlap,
  type AvailableCarsForTripDb,
} from '#/lib/available-cars-for-trip'

function sampleCar(overrides: Partial<PublicCarRow> = {}): PublicCarRow {
  return {
    id: 'car-1',
    make: 'Perodua',
    model: 'Axia',
    year: 2023,
    category: 'economy',
    dailyRateSen: 7000,
    priceLowSeasonSen: 7000,
    pricePeakSeasonSen: 9000,
    priceSuperPeakSeasonSen: 11000,
    coverPhotoUrl: null,
    coverPhotoAlt: null,
    notes: null,
    slug: 'perodua-axia',
    featured: false,
    passengers: 4,
    doors: 4,
    bodyType: 'hatchback',
    transmission: 'auto',
    fuelType: 'petrol',
    appleCarPlay: false,
    androidAuto: false,
    bootCapacityL: 200,
    bootCapacityLabel: '200L',
    largeSuitcasesCount: 1,
    smallCarryonsCount: 2,
    combinedCapacityL: 200,
    combinedCapacityLabel: '200L',
    tagFunAdventure: false,
    tagFamilyComfort: true,
    tagSmallOku: false,
    fuelPolicy: 'full-to-full',
    carLocations: ['airport', 'jetty', 'hotel'],
    longDescription: null,
    highlights: [],
    metaTitle: null,
    metaDescription: null,
    promotionalPriceSen: null,
    ...overrides,
  }
}

function fakeDb(
  cars: PublicCarRow[],
  blockingRentals: Array<{ carId: string; start: Date; end: Date }> = [],
  capacities: Record<string, FleetCapacity> = {},
): AvailableCarsForTripDb {
  return {
    listAvailableCars: async ({ category, excludeCarIds }) => {
      let rows = cars
      if (category) rows = rows.filter((c) => c.category === category)
      if (excludeCarIds && excludeCarIds.length > 0) {
        const blocked = new Set(excludeCarIds)
        rows = rows.filter((c) => !blocked.has(c.id))
      }
      return rows
    },
    findCarIdsWithBlockingRentals: async (tripStart, tripEnd) => {
      const overlapCounts = new Map<string, number>()
      for (const rental of blockingRentals) {
        if (rentalIntervalsOverlap(rental.start, rental.end, tripStart, tripEnd)) {
          overlapCounts.set(rental.carId, (overlapCounts.get(rental.carId) ?? 0) + 1)
        }
      }

      const atCapacity: string[] = []
      for (const [carId, count] of overlapCounts) {
        const capacity = capacities[carId] ?? { numberOfUnits: 1, overbookUnits: 0 }
        if (isFleetAtCapacity(count, capacity)) {
          atCapacity.push(carId)
        }
      }
      return atCapacity
    },
  }
}

describe('rentalIntervalsOverlap', () => {
  it('detects overlapping pending/active rental windows for a Trip', () => {
    const tripStart = new Date(2026, 4, 22)
    const tripEnd = new Date(2026, 4, 24)

    expect(rentalIntervalsOverlap(new Date(2026, 4, 20), new Date(2026, 4, 23), tripStart, tripEnd)).toBe(
      true,
    )
    expect(rentalIntervalsOverlap(new Date(2026, 4, 23), new Date(2026, 4, 26), tripStart, tripEnd)).toBe(
      true,
    )
    expect(rentalIntervalsOverlap(new Date(2026, 4, 24), new Date(2026, 4, 26), tripStart, tripEnd)).toBe(
      false,
    )
    expect(rentalIntervalsOverlap(new Date(2026, 4, 18), new Date(2026, 4, 22), tripStart, tripEnd)).toBe(
      false,
    )
  })
})

describe('listAvailableCarsForTrip', () => {
  it('lists all Available cars when Trip dates are omitted', async () => {
    const cars = [sampleCar(), sampleCar({ id: 'car-2', make: 'Proton', model: 'Saga' })]
    const result = await listAvailableCarsForTrip(fakeDb(cars), {})
    expect(result).toHaveLength(2)
  })

  it('returns an empty list for invalid Trip dates', async () => {
    const cars = [sampleCar()]
    const result = await listAvailableCarsForTrip(fakeDb(cars), {
      startDate: 'not-a-date',
      endDate: '2026-05-24',
    })
    expect(result).toEqual([])
  })

  it('excludes cars blocked by overlapping pending or active Rentals', async () => {
    const cars = [
      sampleCar({ id: 'car-free' }),
      sampleCar({ id: 'car-blocked', make: 'Proton', model: 'Saga' }),
    ]
    const db = fakeDb(cars, [
      {
        carId: 'car-blocked',
        start: new Date(2026, 4, 20),
        end: new Date(2026, 4, 25),
      },
    ])

    const result = await listAvailableCarsForTrip(db, {
      startDate: '2026-05-22',
      endDate: '2026-05-24',
    })

    expect(result.map((c) => c.id)).toEqual(['car-free'])
  })

  it('keeps multi-unit cars available until capacity is reached', async () => {
    const cars = [sampleCar({ id: 'car-mpv' })]
    const db = fakeDb(
      cars,
      [
        {
          carId: 'car-mpv',
          start: new Date(2026, 4, 20),
          end: new Date(2026, 4, 25),
        },
      ],
      { 'car-mpv': { numberOfUnits: 2, overbookUnits: 0 } },
    )

    const result = await listAvailableCarsForTrip(db, {
      startDate: '2026-05-22',
      endDate: '2026-05-24',
    })

    expect(result.map((c) => c.id)).toEqual(['car-mpv'])
    expect(fleetBookingCapacity({ numberOfUnits: 2, overbookUnits: 0 })).toBe(2)
  })

  it('keeps cars when Rentals do not overlap the Trip', async () => {
    const cars = [sampleCar({ id: 'car-free' })]
    const db = fakeDb(cars, [
      {
        carId: 'car-free',
        start: new Date(2026, 4, 10),
        end: new Date(2026, 4, 15),
      },
    ])

    const result = await listAvailableCarsForTrip(db, {
      startDate: '2026-05-22',
      endDate: '2026-05-24',
    })

    expect(result.map((c) => c.id)).toEqual(['car-free'])
  })

  it('filters by category when provided', async () => {
    const cars = [
      sampleCar({ id: 'eco', category: 'economy' }),
      sampleCar({ id: 'mpv', category: 'mpv', make: 'Toyota', model: 'Alphard' }),
    ]

    const result = await listAvailableCarsForTrip(fakeDb(cars), { category: 'mpv' })
    expect(result.map((c) => c.id)).toEqual(['mpv'])
  })

  it('ignores category filter when category is all', async () => {
    const cars = [
      sampleCar({ id: 'eco', category: 'economy' }),
      sampleCar({ id: 'mpv', category: 'mpv', make: 'Toyota', model: 'Alphard' }),
    ]

    const result = await listAvailableCarsForTrip(fakeDb(cars), { category: 'all' })
    expect(result).toHaveLength(2)
  })

  it('lists all cars when Trip dates are present but no Rentals block them', async () => {
    const cars = [sampleCar(), sampleCar({ id: 'car-2', make: 'Proton', model: 'Saga' })]
    const result = await listAvailableCarsForTrip(fakeDb(cars), {
      startDate: '2026-05-22',
      endDate: '2026-05-24',
    })
    expect(result).toHaveLength(2)
  })
})
