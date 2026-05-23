import { describe, expect, it } from 'vitest'

import { ipay88PaymentReturnUrl } from '#/lib/ipay88-process-payment'

describe('ipay88PaymentReturnUrl', () => {
  it('builds guest checkout return URL with locale', () => {
    expect(
      ipay88PaymentReturnUrl({
        rentalId: '76a01887-176f-4959-9293-d81b0a71cc12',
        locale: 'en',
        guestCheckout: true,
        payment: 'response',
        siteUrl: 'https://car.xqholidays.com.my',
      }),
    ).toBe(
      'https://car.xqholidays.com.my/en/checkout/confirmed/76a01887-176f-4959-9293-d81b0a71cc12?payment=response',
    )
  })

  it('builds account return URL for logged-in customers', () => {
    expect(
      ipay88PaymentReturnUrl({
        rentalId: '76a01887-176f-4959-9293-d81b0a71cc12',
        locale: 'ms',
        guestCheckout: false,
        payment: 'error',
        siteUrl: 'https://car.xqholidays.com.my',
      }),
    ).toBe(
      'https://car.xqholidays.com.my/ms/account/bookings/76a01887-176f-4959-9293-d81b0a71cc12?payment=error',
    )
  })
})
