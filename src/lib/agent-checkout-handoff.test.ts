import { describe, expect, it, vi } from 'vitest'

import type { PublicCarRow } from '#/lib/portal-functions'
import {
  AgentCheckoutHandoffError,
  buildCheckoutUrl,
  getCheckoutUrl,
  normalizeMeetPointForCheckout,
  quoteEstimateForTrip,
  searchAvailableCars,
  tripNights,
  type AgentCheckoutHandoffDeps,
} from '#/lib/agent-checkout-handoff'

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

function deps(overrides: Partial<AgentCheckoutHandoffDeps> = {}): AgentCheckoutHandoffDeps {
  return {
    searchCars: async () => [sampleCar()],
    getCar: async (carId) => (carId === 'car-1' ? sampleCar() : null),
    siteUrl: 'https://carxq.com',
    ...overrides,
  }
}

describe('agent checkout handoff', () => {
  it('counts trip nights as calendar days between start and return', () => {
    expect(tripNights('2026-05-22', '2026-05-24')).toBe(2)
    expect(tripNights('2026-05-22', '2026-05-22')).toBe(0)
  })

  it('builds a quote estimate from daily rate and nights', () => {
    const quote = quoteEstimateForTrip(7000, '2026-05-22', '2026-05-25')
    expect(quote.nights).toBe(3)
    expect(quote.estimatedTotalMyr).toBe(210)
    expect(quote.disclaimer).toMatch(/estimate/i)
  })

  it('returns available cars with quote estimates for a trip', async () => {
    const result = await searchAvailableCars(
      { startDate: '2026-05-22', endDate: '2026-05-24' },
      deps(),
    )

    expect(result.cars).toHaveLength(1)
    expect(result.cars[0]).toMatchObject({
      id: 'car-1',
      displayName: 'Perodua Axia',
      category: 'economy',
      dailyRateMyr: 70,
      quoteEstimate: {
        nights: 2,
        estimatedTotalMyr: 140,
      },
    })
    expect(result.cars[0].quoteEstimate.disclaimer).toMatch(/estimate/i)
    expect(result.message).toMatch(/1 available car/i)
  })

  it('returns an empty successful search when no cars are available', async () => {
    const result = await searchAvailableCars(
      { startDate: '2026-05-22', endDate: '2026-05-24' },
      deps({ searchCars: async () => [] }),
    )

    expect(result.cars).toEqual([])
    expect(result.message).toMatch(/no available cars/i)
  })

  it('requires trip dates for search', async () => {
    await expect(
      searchAvailableCars({ startDate: '2026-05-22' }, deps()),
    ).rejects.toThrow(AgentCheckoutHandoffError)
    await expect(
      searchAvailableCars({ startDate: '2026-05-22' }, deps()),
    ).rejects.toThrow(/startDate and endDate/i)
  })

  it('builds an English checkout URL with required trip dates', () => {
    const url = buildCheckoutUrl('https://carxq.com', 'car-1', {
      startDate: '2026-05-22',
      endDate: '2026-05-24',
      from: 'lgk-airport',
      pickTime: '10:00',
      adults: 2,
    })

    expect(url).toBe(
      'https://carxq.com/en/checkout/car-1?startDate=2026-05-22&endDate=2026-05-24&from=Langkawi+Intl+Airport+%C2%B7+Door+3&pickTime=10%3A00&adults=2',
    )
  })

  it('maps agent meet point ids to checkout labels', () => {
    expect(normalizeMeetPointForCheckout('lgk-airport')).toBe('Langkawi Intl Airport · Door 3')
    expect(normalizeMeetPointForCheckout('kuah-jetty')).toBe('Langkawi Ferry Jetty (Kuah)')
  })

  it('rejects invalid or reversed trip dates', async () => {
    await expect(
      searchAvailableCars(
        { startDate: '2026-05-24', endDate: '2026-05-22' },
        deps(),
      ),
    ).rejects.toThrow(/endDate must be after startDate/i)

    await expect(
      searchAvailableCars(
        { startDate: '2026-05-22', endDate: '2026-05-22' },
        deps(),
      ),
    ).rejects.toThrow(/endDate must be after startDate/i)

    await expect(
      searchAvailableCars(
        { startDate: 'not-a-date', endDate: '2026-05-24' },
        deps(),
      ),
    ).rejects.toThrow(/valid YYYY-MM-DD/i)
  })

  it('returns a checkout URL for a known car', async () => {
    const result = await getCheckoutUrl(
      {
        carId: 'car-1',
        startDate: '2026-05-22',
        endDate: '2026-05-24',
      },
      deps(),
    )

    expect(result.checkoutUrl).toContain('/en/checkout/car-1')
    expect(result.checkoutUrl).toContain('startDate=2026-05-22')
    expect(result.checkoutUrl).toContain('endDate=2026-05-24')
  })

  it('refuses checkout URL without required trip dates', async () => {
    await expect(
      getCheckoutUrl({ carId: 'car-1', startDate: '2026-05-22' }, deps()),
    ).rejects.toThrow(/startDate and endDate/i)
  })

  it('returns a clear error for an unknown car id', async () => {
    await expect(
      getCheckoutUrl(
        { carId: 'missing', startDate: '2026-05-22', endDate: '2026-05-24' },
        deps(),
      ),
    ).rejects.toThrow(/unknown car/i)
  })

  it('only reads fleet data via injected deps — no Rental or payment side effects', async () => {
    const searchCars = vi.fn(async () => [sampleCar()])
    const getCar = vi.fn(async (carId: string) => (carId === 'car-1' ? sampleCar() : null))
    const handoffDeps = deps({ searchCars, getCar })

    await searchAvailableCars(
      { startDate: '2026-05-22', endDate: '2026-05-24' },
      handoffDeps,
    )
    await getCheckoutUrl(
      { carId: 'car-1', startDate: '2026-05-22', endDate: '2026-05-24' },
      handoffDeps,
    )

    expect(searchCars).toHaveBeenCalledOnce()
    expect(searchCars).toHaveBeenCalledWith({
      startDate: '2026-05-22',
      endDate: '2026-05-24',
    })
    expect(getCar).toHaveBeenCalledOnce()
    expect(getCar).toHaveBeenCalledWith('car-1')
  })
})
