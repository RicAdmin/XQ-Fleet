import { describe, expect, it, vi } from 'vitest'

import type { PublicCarRow } from '#/lib/portal-functions'
import { handleMcpHttpRequest, type McpServerDeps } from '#/lib/mcp-server'

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

function mcpDeps(overrides: Partial<McpServerDeps> = {}): McpServerDeps {
  return {
    searchCars: async () => [sampleCar()],
    getCar: async (carId) => (carId === 'car-1' ? sampleCar() : null),
    listFleetCars: async () => [sampleCar()],
    siteUrl: 'https://carxq.com',
    ...overrides,
  }
}

async function parseSseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  const dataLine = text
    .split('\n')
    .find((line) => line.startsWith('data: '))
    ?.slice('data: '.length)

  if (!dataLine) {
    throw new Error(`Expected SSE data line in MCP response: ${text}`)
  }

  return JSON.parse(dataLine)
}

async function postMcp(body: Record<string, unknown>, deps: McpServerDeps): Promise<unknown> {
  const request = new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-03-26',
    },
    body: JSON.stringify(body),
  })

  const response = await handleMcpHttpRequest(request, deps)
  expect(response.status).toBe(200)
  return parseSseJson(response)
}

describe('public MCP server at /api/mcp', () => {
  it('lists search_available_cars, get_checkout_url, and recommend_car_fit tools', async () => {
    const payload = (await postMcp(
      { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
      mcpDeps(),
    )) as { result: { tools: Array<{ name: string }> } }

    const toolNames = payload.result.tools.map((tool) => tool.name)
    expect(toolNames).toEqual([
      'search_available_cars',
      'get_checkout_url',
      'recommend_car_fit',
    ])
  })

  it('invokes search_available_cars through the Agent checkout handoff seam', async () => {
    const payload = (await postMcp(
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'search_available_cars',
          arguments: {
            startDate: '2026-05-22',
            endDate: '2026-05-24',
          },
        },
      },
      mcpDeps(),
    )) as { result: { content: Array<{ text: string }> } }

    const result = JSON.parse(payload.result.content[0].text)
    expect(result.cars).toHaveLength(1)
    expect(result.cars[0]).toMatchObject({
      id: 'car-1',
      displayName: 'Perodua Axia',
      quoteEstimate: {
        nights: 2,
        estimatedTotalMyr: 140,
      },
    })
    expect(result.cars[0].quoteEstimate.disclaimer).toMatch(/estimate/i)
  })

  it('invokes get_checkout_url through the Agent checkout handoff seam', async () => {
    const payload = (await postMcp(
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_checkout_url',
          arguments: {
            carId: 'car-1',
            startDate: '2026-05-22',
            endDate: '2026-05-24',
          },
        },
      },
      mcpDeps(),
    )) as { result: { content: Array<{ text: string }> } }

    const result = JSON.parse(payload.result.content[0].text)
    expect(result.checkoutUrl).toBe(
      'https://carxq.com/en/checkout/car-1?startDate=2026-05-22&endDate=2026-05-24',
    )
  })

  it('returns a tool error for an unknown car id', async () => {
    const payload = (await postMcp(
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'get_checkout_url',
          arguments: {
            carId: 'missing',
            startDate: '2026-05-22',
            endDate: '2026-05-24',
          },
        },
      },
      mcpDeps(),
    )) as { result: { isError?: boolean; content: Array<{ text: string }> } }

    expect(payload.result.isError).toBe(true)
    expect(payload.result.content[0].text).toMatch(/unknown car/i)
  })

  it('invokes recommend_car_fit through the Car fit recommendation seam', async () => {
    const listFleetCars = vi.fn(async () => [sampleCar()])
    const searchCars = vi.fn(async () => [sampleCar()])
    const payload = (await postMcp(
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'recommend_car_fit',
          arguments: {
            adults: 2,
            tripStyle: 'Small',
          },
        },
      },
      mcpDeps({ listFleetCars, searchCars }),
    )) as { result: { content: Array<{ text: string }> } }

    const result = JSON.parse(payload.result.content[0].text)
    expect(listFleetCars).toHaveBeenCalledTimes(1)
    expect(searchCars).not.toHaveBeenCalled()
    expect(result.primary).toMatchObject({
      category: 'economy',
      examples: [
        expect.objectContaining({
          id: 'car-1',
          dailyRateMyr: 70,
        }),
      ],
    })
    expect(result.primary.rationale.length).toBeGreaterThan(0)
    expect(Array.isArray(result.alternatives)).toBe(true)
    expect(typeof result.partialFit).toBe('boolean')
    expect(typeof result.tightFit).toBe('boolean')
    expect(result.primary.examples[0]).not.toHaveProperty('quoteEstimate')
    expect(result).not.toHaveProperty('rentalId')
  })

  it('returns a tool error for invalid Hire intent on recommend_car_fit', async () => {
    const payload = (await postMcp(
      {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'recommend_car_fit',
          arguments: {
            adults: 0,
          },
        },
      },
      mcpDeps(),
    )) as { result: { isError?: boolean; content: Array<{ text: string }> } }

    // Zod may reject before the seam; either path is a tool error without a Rental.
    expect(payload.result.isError).toBe(true)
    expect(payload.result.content[0].text.length).toBeGreaterThan(0)
  })
})
