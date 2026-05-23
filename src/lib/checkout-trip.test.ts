import { describe, expect, it } from 'vitest'

import { parseCheckoutSearch } from '#/lib/checkout-trip'

describe('parseCheckoutSearch', () => {
  it('accepts adults and children as strings or numbers', () => {
    expect(
      parseCheckoutSearch({
        startDate: '2026-05-22',
        endDate: '2026-05-24',
        adults: '2',
        children: '0',
      }),
    ).toEqual({
      startDate: '2026-05-22',
      endDate: '2026-05-24',
      adults: '2',
      children: '0',
    })

    expect(
      parseCheckoutSearch({
        startDate: '2026-05-22',
        endDate: '2026-05-24',
        adults: 2,
        children: 0,
      }),
    ).toEqual({
      startDate: '2026-05-22',
      endDate: '2026-05-24',
      adults: '2',
      children: '0',
    })
  })
})
