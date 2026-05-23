import { describe, expect, it } from 'vitest'

import { toCheckoutCustomer } from '#/lib/checkout-session'

describe('toCheckoutCustomer', () => {
  it('returns customer session user', () => {
    expect(
      toCheckoutCustomer({ name: 'Ada', email: 'ada@example.com', role: 'customer' }),
    ).toEqual({ name: 'Ada', email: 'ada@example.com' })
  })

  it('allows session payloads without role (client cache)', () => {
    expect(toCheckoutCustomer({ name: 'Ada', email: 'ada@example.com' })).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
    })
  })

  it('rejects staff and admin roles', () => {
    expect(toCheckoutCustomer({ email: 's@example.com', role: 'staff' })).toBeUndefined()
    expect(toCheckoutCustomer({ email: 'o@example.com', role: 'owner' })).toBeUndefined()
  })

  it('rejects missing email', () => {
    expect(toCheckoutCustomer({ name: 'Ada', role: 'customer' } as never)).toBeUndefined()
  })
})
