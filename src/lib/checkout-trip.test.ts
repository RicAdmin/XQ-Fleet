import { describe, expect, it } from 'vitest'

import { addCalendarDays, startOfLocalDay } from '#/lib/booking-datetime'
import type { BookingState } from '#/lib/booking-state'
import {
  bookingHasPickupReturnDetails,
  parseCheckoutSearch,
} from '#/lib/checkout-trip'

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
      from: undefined,
      retLoc: undefined,
      tripType: undefined,
      pickTime: undefined,
      retTime: undefined,
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
      from: undefined,
      retLoc: undefined,
      tripType: undefined,
      pickTime: undefined,
      retTime: undefined,
      adults: '2',
      children: '0',
    })
  })

  it('keeps pickup and return times through search parsing', () => {
    expect(
      parseCheckoutSearch({
        startDate: '2026-05-22',
        endDate: '2026-05-24',
        pickTime: '10:00 AM',
        retTime: '04:30 PM',
      }),
    ).toMatchObject({
      pickTime: '10:00 AM',
      retTime: '04:30 PM',
    })
  })
})

describe('bookingHasPickupReturnDetails', () => {
  const pick = addCalendarDays(startOfLocalDay(), 5)
  const ret = addCalendarDays(startOfLocalDay(), 9)

  const base: BookingState = {
    from: 'Langkawi Intl Airport · Door 3',
    retLoc: 'Langkawi Intl Airport · Door 3',
    tripType: 'round',
    pickDate: pick,
    retDate: ret,
    pickTime: '10:00 AM',
    retTime: '10:00 AM',
    adults: 2,
    children: 0,
  }

  it('requires dates, times, and pickup location', () => {
    expect(bookingHasPickupReturnDetails(base)).toBe(true)
    expect(bookingHasPickupReturnDetails({ ...base, from: '' })).toBe(false)
    expect(bookingHasPickupReturnDetails({ ...base, pickTime: '' })).toBe(false)
  })

  it('requires return location for one-way trips', () => {
    expect(
      bookingHasPickupReturnDetails({
        ...base,
        tripType: 'oneway',
        retLoc: '',
      }),
    ).toBe(false)
    expect(
      bookingHasPickupReturnDetails({
        ...base,
        tripType: 'oneway',
        retLoc: 'Kuah Jetty',
      }),
    ).toBe(true)
  })
})
