import { describe, expect, it } from 'vitest'

import { buildFleetCarCardAriaLabel } from '#/lib/fleet-car-card-a11y'

describe('buildFleetCarCardAriaLabel', () => {
  it('includes category, rating, seats, doors, and price', () => {
    const label = buildFleetCarCardAriaLabel({
      make: 'Perodua',
      model: 'Bezza',
      category: 'Sedan',
      isOku: false,
      okuLabel: 'OKU friendly',
      rating: '4.8',
      seatsLabel: '5 seats',
      doorsLabel: '4 doors',
      pricePrefix: 'From',
      price: 'RM 120',
      perDay: '/day',
    })
    expect(label).toBe(
      'Perodua Bezza, Sedan, 4.8, 5 seats, 4 doors, From RM 120 /day',
    )
  })

  it('includes OKU label when applicable', () => {
    const label = buildFleetCarCardAriaLabel({
      make: 'Honda',
      model: 'N-Box',
      category: 'MPV',
      isOku: true,
      okuLabel: 'OKU friendly',
      rating: '4.8',
      seatsLabel: '4 seats',
      doorsLabel: '5 doors',
      pricePrefix: 'From',
      price: 'RM 150',
      perDay: '/day',
    })
    expect(label).toContain('OKU friendly')
  })
})
