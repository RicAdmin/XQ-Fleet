import { cars } from '#/db/schema'
import type { CarCategory } from '#/db/schema'
import type { CarCatalogFitInput } from '#/lib/fleet-luggage-fit'

/** Per-car catalog fields (from data/Car.csv) exposed on public APIs. */
export type PublicCarCatalogFields = {
  slug: string | null
  featured: boolean
  passengers: number
  doors: number
  bodyType: string | null
  transmission: string | null
  fuelType: string | null
  appleCarPlay: boolean
  androidAuto: boolean
  bootCapacityL: number | null
  bootCapacityLabel: string | null
  largeSuitcasesCount: number | null
  smallCarryonsCount: number | null
  combinedCapacityL: number | null
  combinedCapacityLabel: string | null
  tagFunAdventure: boolean
  tagFamilyComfort: boolean
  tagSmallOku: boolean
  fuelPolicy: string | null
  carLocations: string | null
  longDescription: string | null
  highlights: string[] | null
  metaTitle: string | null
  metaDescription: string | null
  promotionalPriceSen: number | null
}

/** Drizzle select fragment for catalog fields on `cars`. */
export const publicCarCatalogSelect = {
  slug: cars.slug,
  featured: cars.featured,
  passengers: cars.passengers,
  doors: cars.doors,
  bodyType: cars.bodyType,
  transmission: cars.transmission,
  fuelType: cars.fuelType,
  appleCarPlay: cars.appleCarPlay,
  androidAuto: cars.androidAuto,
  bootCapacityL: cars.bootCapacityL,
  bootCapacityLabel: cars.bootCapacityLabel,
  largeSuitcasesCount: cars.largeSuitcasesCount,
  smallCarryonsCount: cars.smallCarryonsCount,
  combinedCapacityL: cars.combinedCapacityL,
  combinedCapacityLabel: cars.combinedCapacityLabel,
  tagFunAdventure: cars.tagFunAdventure,
  tagFamilyComfort: cars.tagFamilyComfort,
  tagSmallOku: cars.tagSmallOku,
  fuelPolicy: cars.fuelPolicy,
  carLocations: cars.carLocations,
  longDescription: cars.longDescription,
  highlights: cars.highlights,
  metaTitle: cars.metaTitle,
  metaDescription: cars.metaDescription,
  promotionalPriceSen: cars.promotionalPriceSen,
} as const

/** Map a public car row to luggage-fit input. */
export function catalogFitInput(
  car: PublicCarCatalogFields & { category: CarCategory },
): CarCatalogFitInput {
  return {
    category: car.category,
    passengers: car.passengers,
    doors: car.doors,
    largeSuitcasesCount: car.largeSuitcasesCount,
    smallCarryonsCount: car.smallCarryonsCount,
    bootCapacityLabel: car.bootCapacityLabel,
    bootCapacityL: car.bootCapacityL,
    combinedCapacityL: car.combinedCapacityL,
  }
}
