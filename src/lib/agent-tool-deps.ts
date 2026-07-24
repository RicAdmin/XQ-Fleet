import { publicSiteUrl } from '#/lib/brand'
import type { AgentCheckoutHandoffDeps } from '#/lib/agent-checkout-handoff'
import type { CarFitRecommendationDeps } from '#/lib/car-fit-recommendation'
import {
  drizzleAvailableCarsForTripDb,
  listAvailableCarsForTrip,
} from '#/lib/available-cars-for-trip'
import {
  getPublicCarDetail,
  getPublicCars,
  publicCarDetailToRow,
} from '#/lib/portal-functions'

export type AgentToolDeps = AgentCheckoutHandoffDeps & CarFitRecommendationDeps

export function createAgentToolDeps(): AgentToolDeps {
  return {
    siteUrl: publicSiteUrl(),
    searchCars: async (input) => {
      const { db } = await import('#/db')
      return listAvailableCarsForTrip(drizzleAvailableCarsForTripDb(db), input)
    },
    getCar: async (carId) => {
      const detail = await getPublicCarDetail({ data: { carId } })
      return detail ? publicCarDetailToRow(detail) : null
    },
    // Public fleet catalog (status=available). Not Trip Available-car / rental-overlap listing.
    listFleetCars: async () => getPublicCars(),
  }
}
