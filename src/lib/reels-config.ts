import reelsDocument from '../../data/reels.json'

export type ReelCar = {
  make: string
  model: string
  category: string
  body: string
  seats: number
  doors: number
  transmission: string
  fuel: string
  luggage: string
  priceLowSeason: number
  highlights: string[]
  image: string
  oku?: boolean
}

export type Reel = {
  id: string
  order: number
  tagline: string
  taglineShort: string
  clip: string
  thumb: string
  car: ReelCar
}

type CarCatalogEntry = {
  aliases?: string[]
  make: string
  model: string
  category: string
  pricePerDay: number
  seats: number
  doors: number
  transmission: string
  body: string
  fuel: string
  luggage: string
  image: string
  highlights: string[]
  oku?: boolean
}

type CarVideoJson = {
  order: number
  video: string
  car_model: string
  description: string
}

function videoUrl(filename: string): string {
  return `/video/${encodeURIComponent(filename)}`
}

function carImageUrl(filename: string): string {
  return `/image/car_model/${encodeURIComponent(filename)}`
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function firstSentence(text: string, maxLen = 140): string {
  const match = text.match(/^[^.!?]+[.!?]?/)
  const sentence = (match?.[0] ?? text).trim()
  if (sentence.length <= maxLen) return sentence
  return `${sentence.slice(0, maxLen - 1).trim()}…`
}

function buildCatalogLookup(catalog: Record<string, CarCatalogEntry>): Map<string, CarCatalogEntry> {
  const lookup = new Map<string, CarCatalogEntry>()
  for (const [key, entry] of Object.entries(catalog)) {
    lookup.set(key.toLowerCase(), entry)
    for (const alias of entry.aliases ?? []) {
      lookup.set(alias.toLowerCase(), entry)
    }
  }
  return lookup
}

function resolveCatalogEntry(
  carModel: string,
  lookup: Map<string, CarCatalogEntry>,
): CarCatalogEntry {
  const hit = lookup.get(carModel.trim().toLowerCase())
  if (!hit) {
    throw new Error(
      `Unknown car_model "${carModel}" in data/reels.json. Add it to carCatalog or fix the name.`,
    )
  }
  return hit
}

function toReelCar(entry: CarCatalogEntry): ReelCar {
  return {
    make: entry.make,
    model: entry.model,
    category: entry.category,
    body: entry.body,
    seats: entry.seats,
    doors: entry.doors,
    transmission: entry.transmission,
    fuel: entry.fuel,
    luggage: entry.luggage,
    priceLowSeason: entry.pricePerDay,
    highlights: entry.highlights,
    image: carImageUrl(entry.image),
    oku: entry.oku,
  }
}

function toReel(entry: CarVideoJson, lookup: Map<string, CarCatalogEntry>): Reel {
  const catalog = resolveCatalogEntry(entry.car_model, lookup)
  const description = entry.description.trim()
  return {
    id: `${slugify(entry.car_model)}-${entry.order}`,
    order: entry.order,
    tagline: description,
    taglineShort: firstSentence(description),
    clip: videoUrl(entry.video.trim()),
    thumb: carImageUrl(catalog.image),
    car: toReelCar(catalog),
  }
}

const catalogLookup = buildCatalogLookup(reelsDocument.carCatalog as Record<string, CarCatalogEntry>)

/** Landing-page reels — sourced from `data/reels.json` → `car_videos`. */
export const REELS: Reel[] = (reelsDocument.car_videos as CarVideoJson[])
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((entry) => toReel(entry, catalogLookup))
