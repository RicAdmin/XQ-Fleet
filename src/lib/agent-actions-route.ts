import {
  AgentCheckoutHandoffError,
  getCheckoutUrl,
  searchAvailableCars,
  type AgentCheckoutHandoffDeps,
  type TripInput,
} from '#/lib/agent-checkout-handoff'
import {
  CarFitRecommendationError,
  recommendCarFit,
  type CarFitRecommendationDeps,
  type HireIntent,
} from '#/lib/car-fit-recommendation'
import { createAgentToolDeps } from '#/lib/agent-tool-deps'

export type AgentActionsDeps = AgentCheckoutHandoffDeps &
  CarFitRecommendationDeps

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json()
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new AgentCheckoutHandoffError('Request body must be a JSON object.')
  }
  return body as Record<string, unknown>
}

export function createAgentActionsRouteHandlers(deps: AgentActionsDeps) {
  return {
    async searchAvailableCars(request: Request): Promise<Response> {
      try {
        const input = (await jsonBody(request)) as TripInput
        return jsonResponse(await searchAvailableCars(input, deps))
      } catch (error) {
        if (
          error instanceof AgentCheckoutHandoffError ||
          error instanceof SyntaxError
        ) {
          return jsonResponse(
            { error: 'invalid_request', message: error.message },
            400,
          )
        }
        throw error
      }
    },
    async getCheckoutUrl(request: Request): Promise<Response> {
      try {
        const input = (await jsonBody(request)) as unknown as Parameters<
          typeof getCheckoutUrl
        >[0]
        return jsonResponse(await getCheckoutUrl(input, deps))
      } catch (error) {
        if (
          error instanceof AgentCheckoutHandoffError ||
          error instanceof SyntaxError
        ) {
          return jsonResponse(
            { error: 'invalid_request', message: error.message },
            400,
          )
        }
        throw error
      }
    },
    async recommendCarFit(request: Request): Promise<Response> {
      try {
        const input = (await jsonBody(request)) as HireIntent
        return jsonResponse(await recommendCarFit(input, deps))
      } catch (error) {
        if (
          error instanceof CarFitRecommendationError ||
          error instanceof SyntaxError
        ) {
          return jsonResponse(
            { error: 'invalid_request', message: error.message },
            400,
          )
        }
        throw error
      }
    },
  }
}

export const agentActionsRouteHandlers = createAgentActionsRouteHandlers(
  createAgentToolDeps(),
)
