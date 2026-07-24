import { describe, expect, it } from 'vitest'

import type { PublicCarRow } from '#/lib/portal-functions'
import {
  createAgentActionsRouteHandlers,
  type AgentActionsDeps,
} from '#/lib/agent-actions-route'

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
    carLocations: 'airport,jetty,hotel',
    longDescription: null,
    highlights: [],
    metaTitle: null,
    metaDescription: null,
    promotionalPriceSen: null,
    ...overrides,
  }
}

function deps(overrides: Partial<AgentActionsDeps> = {}): AgentActionsDeps {
  return {
    searchCars: async () => [sampleCar()],
    getCar: async (carId) => (carId === 'car-1' ? sampleCar() : null),
    listFleetCars: async () => [sampleCar()],
    siteUrl: 'https://carxq.com',
    ...overrides,
  }
}

function post(path: string, body: unknown): Request {
  return new Request(`https://carxq.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GPT Actions HTTP routes', () => {
  it('searches Available cars for a Trip as JSON', async () => {
    const handlers = createAgentActionsRouteHandlers(deps())
    const response = await handlers.searchAvailableCars(
      post('/api/actions/search-available-cars', {
        startDate: '2026-08-15',
        endDate: '2026-08-18',
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toMatch(/application\/json/)
    await expect(response.json()).resolves.toMatchObject({
      message: '1 available car for this Trip.',
      cars: [
        {
          id: 'car-1',
          displayName: 'Perodua Axia',
          dailyRateMyr: 70,
          quoteEstimate: { nights: 3, estimatedTotalMyr: 210 },
        },
      ],
    })
  })

  it('returns a Checkout URL without creating a Rental', async () => {
    const handlers = createAgentActionsRouteHandlers(deps())
    const response = await handlers.getCheckoutUrl(
      post('/api/actions/get-checkout-url', {
        carId: 'car-1',
        startDate: '2026-08-15',
        endDate: '2026-08-18',
        from: 'lgk-airport',
        pickTime: '10:00',
        adults: 2,
      }),
    )

    expect(response.status).toBe(200)
    const body = (await response.json()) as { checkoutUrl: string }
    expect(body.checkoutUrl).toBe(
      'https://carxq.com/en/checkout/car-1?startDate=2026-08-15&endDate=2026-08-18&from=Langkawi+Intl+Airport+%C2%B7+Door+3&pickTime=10%3A00&adults=2',
    )
    expect(body).not.toHaveProperty('rentalId')
  })

  it('recommends a Car fit from Hire intent as JSON', async () => {
    const handlers = createAgentActionsRouteHandlers(deps())
    const response = await handlers.recommendCarFit(
      post('/api/actions/recommend-car-fit', {
        adults: 2,
        children: 1,
        bags: 2,
        tripStyle: 'Small',
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      primary: {
        category: 'economy',
        examples: [{ id: 'car-1', displayName: 'Perodua Axia' }],
      },
      partialFit: false,
    })
  })

  it('returns a useful 400 JSON response for invalid Action input', async () => {
    const handlers = createAgentActionsRouteHandlers(deps())
    const response = await handlers.searchAvailableCars(
      post('/api/actions/search-available-cars', {
        startDate: '2026-08-18',
        endDate: '2026-08-15',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'invalid_request',
      message: 'endDate must be after startDate for the Trip.',
    })
  })
})
