import { describe, expect, it } from 'vitest'

import type { PublicCarRow } from '#/lib/portal-functions'
import { uniquePublicCarModels } from '#/lib/portal-functions'

function sampleCar(overrides: Partial<PublicCarRow> = {}): PublicCarRow {
  return {
    id: 'car-1',
    make: 'Honda',
    model: 'City 5G',
    year: 2024,
    category: 'economy',
    dailyRateSen: 12_000,
    priceLowSeasonSen: 12_000,
    pricePeakSeasonSen: 12_000,
    priceSuperPeakSeasonSen: 12_000,
    coverPhotoUrl: null,
    coverPhotoAlt: null,
    notes: null,
    slug: null,
    featured: false,
    passengers: 5,
    doors: 4,
    bodyType: 'Sedan',
    transmission: 'Auto',
    fuelType: 'Petrol',
    appleCarPlay: true,
    androidAuto: true,
    bootCapacityL: 400,
    bootCapacityLabel: '400 L',
    largeSuitcasesCount: 2,
    smallCarryonsCount: 2,
    combinedCapacityL: 400,
    combinedCapacityLabel: '400 L',
    tagFunAdventure: false,
    tagFamilyComfort: false,
    tagSmallOku: false,
    fuelPolicy: 'Full to full',
    carLocations: null,
    longDescription: null,
    highlights: null,
    metaTitle: null,
    metaDescription: null,
    promotionalPriceSen: null,
    ...overrides,
  }
}

describe('uniquePublicCarModels', () => {
  it('returns one row per make/model', () => {
    const result = uniquePublicCarModels([
      sampleCar({ id: 'a' }),
      sampleCar({ id: 'b' }),
      sampleCar({ id: 'c', make: 'Honda', model: 'N-Box' }),
    ])

    expect(result).toHaveLength(2)
    expect(result.map((car) => car.id)).toEqual(['a', 'c'])
  })

  it('prefers featured and slugged listing cars', () => {
    const result = uniquePublicCarModels([
      sampleCar({ id: 'plain' }),
      sampleCar({ id: 'featured', featured: true, slug: 'honda-city-5g' }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('featured')
  })
})
