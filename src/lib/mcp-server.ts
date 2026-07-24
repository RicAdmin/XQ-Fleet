import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import * as z from 'zod'

import {
  AgentCheckoutHandoffError,
  getCheckoutUrl,
  searchAvailableCars,
  type AgentCheckoutHandoffDeps,
} from '#/lib/agent-checkout-handoff'
import {
  CarFitRecommendationError,
  recommendCarFit,
  type CarFitRecommendationDeps,
} from '#/lib/car-fit-recommendation'

export type McpServerDeps = AgentCheckoutHandoffDeps & CarFitRecommendationDeps

const tripFields = {
  startDate: z.string().describe('Trip pickup date (YYYY-MM-DD)'),
  endDate: z.string().describe('Trip return date (YYYY-MM-DD)'),
  from: z.string().optional().describe('Pickup meet point: lgk-airport, kuah-jetty, or a checkout label'),
  retLoc: z.string().optional().describe('Return meet point: lgk-airport, kuah-jetty, or a checkout label'),
  tripType: z.enum(['round', 'oneway']).optional().describe('Round trip or one-way'),
  pickTime: z.string().optional().describe('Pickup time (HH:mm, 24h)'),
  retTime: z.string().optional().describe('Return time (HH:mm, 24h)'),
  adults: z.number().int().min(1).max(9).optional().describe('Adult passengers'),
  children: z.number().int().min(0).max(8).optional().describe('Child passengers'),
}

const hireIntentFields = {
  adults: z.number().int().min(1).max(9).describe('Adult passengers (required for Hire intent)'),
  children: z.number().int().min(0).max(8).optional().describe('Child passengers (default 0)'),
  bags: z.number().int().min(0).optional().describe('Bag count for capacity fit (default 0)'),
  tripStyle: z
    .enum(['Small', 'Comfort', 'Adventure'])
    .optional()
    .describe('Optional trip style bias matching the pick-car guide'),
}

function toolError(message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true,
  }
}

function jsonResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  }
}

export function createAgentCheckoutMcpServer(deps: McpServerDeps): McpServer {
  const server = new McpServer({
    name: 'XQCar Langkawi',
    version: '1.0.0',
  })

  server.registerTool(
    'search_available_cars',
    {
      title: 'Search available cars',
      description:
        'Find Available cars for a Trip on the XQ Car Langkawi fleet. Returns Quote estimates (non-binding) and car identity.',
      inputSchema: tripFields,
    },
    async (input) => {
      try {
        const result = await searchAvailableCars(input, deps)
        return jsonResult(result)
      } catch (error) {
        if (error instanceof AgentCheckoutHandoffError) {
          return toolError(error.message)
        }
        throw error
      }
    },
  )

  server.registerTool(
    'get_checkout_url',
    {
      title: 'Get Checkout URL',
      description:
        'Build an English Checkout URL for a chosen car and Trip. Does not create a Rental or payment.',
      inputSchema: {
        carId: z.string().describe('Stable car id from search_available_cars'),
        ...tripFields,
      },
    },
    async (input) => {
      try {
        const result = await getCheckoutUrl(input, deps)
        return jsonResult(result)
      } catch (error) {
        if (error instanceof AgentCheckoutHandoffError) {
          return toolError(error.message)
        }
        throw error
      }
    },
  )

  server.registerTool(
    'recommend_car_fit',
    {
      title: 'Recommend car fit',
      description:
        'From Hire intent (party size, optional bags and trip style), return a Car fit recommendation: primary Category, alternatives, and catalog example cars with published daily rates. Not Trip availability and not a Quote estimate. Does not create a Rental.',
      inputSchema: hireIntentFields,
    },
    async (input) => {
      try {
        const result = await recommendCarFit(input, deps)
        return jsonResult(result)
      } catch (error) {
        if (error instanceof CarFitRecommendationError) {
          return toolError(error.message)
        }
        throw error
      }
    },
  )

  return server
}

export async function handleMcpHttpRequest(
  request: Request,
  deps: McpServerDeps,
): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport()
  const server = createAgentCheckoutMcpServer(deps)
  await server.connect(transport)
  return transport.handleRequest(request)
}
