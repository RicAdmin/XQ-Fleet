/**
 * Accessible name for fleet car card hit targets.
 * Includes all visible badge / rating / seats / doors / price text.
 */
export function buildFleetCarCardAriaLabel(input: {
  make: string
  model: string
  category: string
  isOku: boolean
  okuLabel: string
  rating: string
  seatsLabel: string
  doorsLabel: string
  pricePrefix: string
  price: string
  perDay: string
}): string {
  const parts = [
    `${input.make} ${input.model}`,
    input.category,
    input.isOku ? input.okuLabel : null,
    input.rating,
    input.seatsLabel,
    input.doorsLabel,
    `${input.pricePrefix} ${input.price} ${input.perDay}`,
  ]
  return parts.filter(Boolean).join(', ')
}
