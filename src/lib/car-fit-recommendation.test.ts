import { describe, expect, it, vi } from 'vitest'

import type { PublicCarRow } from '#/lib/portal-functions'
import {
  CarFitRecommendationError,
  recommendCarFit,
  type CarFitRecommendationDeps,
} from '#/lib/car-fit-recommendation'

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

function deps(overrides: Partial<CarFitRecommendationDeps> = {}): CarFitRecommendationDeps {
  return {
    listFleetCars: async () => [sampleCar()],
    ...overrides,
  }
}

describe('car fit recommendation', () => {
  it('requires adults on Hire intent', async () => {
    await expect(recommendCarFit({}, deps())).rejects.toBeInstanceOf(CarFitRecommendationError)
    await expect(recommendCarFit({ adults: 0 }, deps())).rejects.toThrow(/adults/i)
  })

  it('defaults children and bags to 0 and returns a primary Category with rationale', async () => {
    const result = await recommendCarFit({ adults: 2 }, deps())
    expect(result.primary.category).toBe('economy')
    expect(result.primary.rationale.length).toBeGreaterThan(0)
    expect(result.partialFit).toBe(false)
    expect(result.primary.examples).toEqual([
      expect.objectContaining({
        id: 'car-1',
        displayName: 'Perodua Axia',
        category: 'economy',
        dailyRateMyr: 70,
        fitsParty: true,
        fitsBags: true,
      }),
    ])
    expect(result.primary.examples[0]).not.toHaveProperty('quoteEstimate')
  })

  it('lists fleet cars via deps and never searches Trip availability', async () => {
    const listFleetCars = vi.fn(async () => [sampleCar()])
    const searchCars = vi.fn()
    await recommendCarFit({ adults: 2 }, { listFleetCars })
    expect(listFleetCars).toHaveBeenCalledTimes(1)
    expect(searchCars).not.toHaveBeenCalled()
  })

  it('biases primary Category with optional Small / Comfort / Adventure trip style', async () => {
    const fleet = [
      sampleCar({ id: 'e1', category: 'economy', dailyRateSen: 7000, passengers: 4 }),
      sampleCar({
        id: 'm1',
        make: 'Toyota',
        model: 'Innova',
        category: 'mpv',
        dailyRateSen: 14000,
        passengers: 7,
        largeSuitcasesCount: 3,
        smallCarryonsCount: 3,
      }),
      sampleCar({
        id: 's1',
        make: 'Honda',
        model: 'CR-V',
        category: 'suv',
        dailyRateSen: 16000,
        passengers: 5,
        largeSuitcasesCount: 2,
        smallCarryonsCount: 3,
      }),
      sampleCar({
        id: 'o1',
        make: 'Proton',
        model: 'X50',
        category: 'other',
        dailyRateSen: 12000,
        passengers: 5,
      }),
    ]
    const d = deps({ listFleetCars: async () => fleet })

    const small = await recommendCarFit({ adults: 2, tripStyle: 'Small' }, d)
    expect(small.primary.category).toBe('economy')
    expect(small.alternatives.every((a) => a.category === 'economy')).toBe(true)

    const comfort = await recommendCarFit({ adults: 6, tripStyle: 'Comfort' }, d)
    expect(comfort.primary.category).toBe('mpv')
    expect(comfort.alternatives.map((a) => a.category)).toContain('economy')

    const adventure = await recommendCarFit({ adults: 2, tripStyle: 'Adventure' }, d)
    expect(['suv', 'other']).toContain(adventure.primary.category)
    expect(adventure.alternatives.every((a) => a.category === 'suv' || a.category === 'other')).toBe(
      true,
    )
  })

  it('returns at most 3 examples per Category, capacity-first then lowest published daily rate', async () => {
    const fleet = [
      sampleCar({
        id: 'cheap-tight',
        model: 'Bezza',
        dailyRateSen: 6000,
        passengers: 4,
        largeSuitcasesCount: 1,
        smallCarryonsCount: 1,
      }),
      sampleCar({
        id: 'mid-fit',
        model: 'Myvi',
        dailyRateSen: 8000,
        passengers: 5,
        largeSuitcasesCount: 2,
        smallCarryonsCount: 2,
      }),
      sampleCar({
        id: 'cheap-fit',
        model: 'Axia',
        dailyRateSen: 7000,
        passengers: 5,
        largeSuitcasesCount: 2,
        smallCarryonsCount: 2,
      }),
      sampleCar({
        id: 'dear-fit',
        model: 'Alza',
        category: 'economy',
        dailyRateSen: 9000,
        passengers: 5,
        largeSuitcasesCount: 2,
        smallCarryonsCount: 2,
      }),
      sampleCar({
        id: 'extra-fit',
        model: 'Saga',
        dailyRateSen: 7500,
        passengers: 5,
        largeSuitcasesCount: 2,
        smallCarryonsCount: 2,
      }),
    ]
    const result = await recommendCarFit(
      { adults: 4, bags: 3 },
      deps({ listFleetCars: async () => fleet }),
    )
    expect(result.primary.category).toBe('economy')
    expect(result.primary.examples).toHaveLength(3)
    expect(result.primary.examples.map((e) => e.id)).toEqual([
      'cheap-fit',
      'extra-fit',
      'mid-fit',
    ])
    expect(result.primary.examples.every((e) => e.fitsParty && e.fitsBags)).toBe(true)
  })

  it('returns best-effort with partialFit when Hire intent exceeds fleet capacity', async () => {
    const result = await recommendCarFit(
      { adults: 8, bags: 6 },
      deps({
        listFleetCars: async () => [
          sampleCar({
            id: 'small',
            passengers: 4,
            largeSuitcasesCount: 1,
            smallCarryonsCount: 1,
          }),
          sampleCar({
            id: 'mpv-cheap-neither',
            make: 'Toyota',
            model: 'Wish',
            category: 'mpv',
            dailyRateSen: 10000,
            passengers: 6,
            largeSuitcasesCount: 1,
            smallCarryonsCount: 1,
          }),
          sampleCar({
            id: 'mpv-1',
            make: 'Toyota',
            model: 'Innova',
            category: 'mpv',
            dailyRateSen: 14000,
            passengers: 7,
            largeSuitcasesCount: 3,
            smallCarryonsCount: 2,
          }),
        ],
      }),
    )
    expect(result.partialFit).toBe(true)
    expect(result.tightFit).toBe(false)
    expect(result.primary.category).toBe('mpv')
    expect(result.primary.rationale).toMatch(/partial|two cars|fewer bags|larger Category/i)
    expect(result.primary.examples.map((e) => e.id)).toEqual(['mpv-1', 'mpv-cheap-neither'])
    expect(result.primary.examples.every((e) => e.fitsParty && e.fitsBags)).toBe(false)
  })

  it('sets tightFit when party fills Category capacity but still fully fits', async () => {
    const result = await recommendCarFit(
      { adults: 7 },
      deps({
        listFleetCars: async () => [
          sampleCar({
            id: 'mpv-1',
            make: 'Toyota',
            model: 'Innova',
            category: 'mpv',
            dailyRateSen: 14000,
            passengers: 7,
            largeSuitcasesCount: 3,
            smallCarryonsCount: 3,
          }),
        ],
      }),
    )
    expect(result.partialFit).toBe(false)
    expect(result.tightFit).toBe(true)
    expect(result.primary.examples[0]?.fitsParty).toBe(true)
  })

  it('prefers MPV as primary when party size needs more seats and style is omitted', async () => {
    const result = await recommendCarFit(
      { adults: 2, children: 4 },
      deps({
        listFleetCars: async () => [
          sampleCar({ id: 'e1', category: 'economy', passengers: 4, dailyRateSen: 7000 }),
          sampleCar({
            id: 'm1',
            make: 'Toyota',
            model: 'Innova',
            category: 'mpv',
            passengers: 7,
            dailyRateSen: 14000,
            largeSuitcasesCount: 3,
            smallCarryonsCount: 3,
          }),
        ],
      }),
    )
    expect(result.primary.category).toBe('mpv')
    expect(result.partialFit).toBe(false)
  })
})
