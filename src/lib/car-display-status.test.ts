import { describe, expect, it } from 'vitest'

import { deriveCarDisplayStatus, pickOpenRentalForDisplay } from './car-display-status'

describe('deriveCarDisplayStatus', () => {
  const now = new Date('2026-07-24T12:00:00+08:00')

  it('keeps reserved before pickup date', () => {
    expect(
      deriveCarDisplayStatus(
        'reserved',
        {
          status: 'pending',
          startDate: '2026-08-01T00:00:00+08:00',
          endDate: '2026-08-03T00:00:00+08:00',
        },
        now,
      ),
    ).toBe('reserved')
  })

  it('shows overdue when reserved and pickup date has passed without handover', () => {
    expect(
      deriveCarDisplayStatus(
        'reserved',
        {
          status: 'pending',
          startDate: '2026-06-01T00:00:00+08:00',
          endDate: '2026-06-03T00:00:00+08:00',
        },
        now,
      ),
    ).toBe('overdue')
  })

  it('shows overdue on pickup day once start time is reached', () => {
    expect(
      deriveCarDisplayStatus(
        'reserved',
        {
          status: 'pending',
          startDate: '2026-07-24T00:00:00+08:00',
          endDate: '2026-07-26T00:00:00+08:00',
        },
        now,
      ),
    ).toBe('overdue')
  })

  it('keeps rented when still within planned return date', () => {
    expect(
      deriveCarDisplayStatus(
        'rented',
        {
          status: 'active',
          startDate: '2026-07-20T00:00:00+08:00',
          endDate: '2026-07-25T00:00:00+08:00',
        },
        now,
      ),
    ).toBe('rented')
  })

  it('shows overdue when rented past planned return date', () => {
    expect(
      deriveCarDisplayStatus(
        'rented',
        {
          status: 'active',
          startDate: '2026-07-01T00:00:00+08:00',
          endDate: '2026-07-10T00:00:00+08:00',
        },
        now,
      ),
    ).toBe('overdue')
  })

  it('returns stored status when there is no open rental', () => {
    expect(deriveCarDisplayStatus('available', null, now)).toBe('available')
    expect(deriveCarDisplayStatus('reserved', null, now)).toBe('reserved')
  })
})

describe('pickOpenRentalForDisplay', () => {
  it('prefers active over pending', () => {
    const picked = pickOpenRentalForDisplay([
      { id: '1', status: 'pending' },
      { id: '2', status: 'active' },
      { id: '3', status: 'closed' },
    ])
    expect(picked?.id).toBe('2')
  })

  it('falls back to pending', () => {
    const picked = pickOpenRentalForDisplay([
      { id: '1', status: 'closed' },
      { id: '2', status: 'pending' },
    ])
    expect(picked?.id).toBe('2')
  })
})
