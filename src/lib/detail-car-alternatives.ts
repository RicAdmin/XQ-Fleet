import { catalogFitInput } from '#/lib/car-catalog'
import { carLuggageFit } from '#/lib/fleet-luggage-fit'
import type { PublicCarRow } from '#/lib/portal-functions'

export type CategoryAlternative = {
  car: PublicCarRow
  highlight: string
}

function modelHaystack(car: PublicCarRow) {
  return `${car.make} ${car.model} ${car.notes ?? ''}`.toLowerCase()
}

/** One-line card copy: first clause from notes, or a trimmed phrase that fits narrow columns. */
function highlightFromNotes(notes: string, maxLen = 58): string | null {
  const t = notes.trim()
  if (!t) return null

  const firstClause = t.split(/[,;]/)[0]?.trim() ?? t
  if (firstClause.length <= maxLen) return firstClause

  const words = firstClause.split(/\s+/)
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxLen) break
    line = next
  }
  return line || null
}

function differentiator(
  reference: PublicCarRow,
  candidate: PublicCarRow,
  tier: 'below' | 'above',
): string {
  const hay = modelHaystack(candidate)

  if (/convert|cabrio|roadster|spyder/.test(hay)) {
    return 'Open-air driving experience'
  }
  if (/mpv|alphard|vellfire|staria|serena|odyssey/.test(hay)) {
    return 'Extra space for passengers'
  }
  if (/hrv|x50|x70|suv|fortuner|seltos/.test(hay)) {
    return 'Higher ride height'
  }

  if (candidate.notes?.trim()) {
    const fromNotes = highlightFromNotes(candidate.notes)
    if (fromNotes) return fromNotes
  }

  if (candidate.year >= reference.year + 2) {
    return 'Newer model year on the fleet'
  }
  if (candidate.year > reference.year) {
    return 'More recent model year'
  }

  const refFit = carLuggageFit(catalogFitInput(reference))
  const candFit = carLuggageFit(catalogFitInput(candidate))
  if (candFit.lg + candFit.sm > refFit.lg + refFit.sm) {
    return 'Fits more luggage'
  }
  if (candFit.seats > refFit.seats) {
    return 'More passenger seats'
  }

  if (tier === 'below') {
    if (/mini|axia|bezza|saga|vios|myvi|i10|picanto/.test(hay)) {
      return 'Easy to park in town'
    }
    if (candidate.year < reference.year) {
      return 'Proven island daily driver'
    }
    return 'Light and efficient for short hops'
  }

  if (/city|civic|accord|camry|altis|x50/.test(hay)) {
    return 'Smoother ride for longer days'
  }
  if (candidate.year < reference.year) {
    return 'Spacious cabin for the class'
  }
  return 'Extra comfort for island drives'
}

/** Two same-category options: nearest lower and nearest higher daily rate than `current`. */
export function getCategoryAlternatives(
  current: PublicCarRow,
  fleet: PublicCarRow[],
): CategoryAlternative[] {
  const peers = fleet.filter((c) => c.id !== current.id && c.category === current.category)
  if (peers.length === 0) return []

  const cheaper = peers
    .filter((c) => c.dailyRateSen < current.dailyRateSen)
    .sort((a, b) => b.dailyRateSen - a.dailyRateSen)[0]

  const pricier = peers
    .filter((c) => c.dailyRateSen > current.dailyRateSen)
    .sort((a, b) => a.dailyRateSen - b.dailyRateSen)[0]

  const out: CategoryAlternative[] = []
  if (cheaper) {
    out.push({
      car: cheaper,
      highlight: differentiator(current, cheaper, 'below'),
    })
  }
  if (pricier) {
    out.push({
      car: pricier,
      highlight: differentiator(current, pricier, 'above'),
    })
  }
  return out
}
