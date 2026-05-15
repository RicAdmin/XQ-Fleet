import type { CarCategory } from '#/db/schema'

/** Illustrative luggage fit (75 L “large”, 35 L “small”) by fleet category — same rules as the pick-car guide. */
export type HeuristicLuggageFit = {
  seats: number
  lg: number
  sm: number
  boot: string
  doors: number
  groups: readonly string[]
}

export function heuristicLuggageFit(category: CarCategory): HeuristicLuggageFit {
  switch (category) {
    case 'economy':
      return {
        seats: 5,
        lg: 2,
        sm: 2,
        boot: '~400 L',
        doors: 4,
        groups: ['Small', 'Comfort'],
      }
    case 'mpv':
      return {
        seats: 7,
        lg: 3,
        sm: 3,
        boot: '~520 L',
        doors: 4,
        groups: ['Comfort'],
      }
    case 'suv':
      return {
        seats: 5,
        lg: 2,
        sm: 3,
        boot: '~480 L',
        doors: 5,
        groups: ['Adventure', 'Comfort'],
      }
    default:
      return {
        seats: 5,
        lg: 2,
        sm: 2,
        boot: 'Varies',
        doors: 4,
        groups: ['Comfort'],
      }
  }
}
