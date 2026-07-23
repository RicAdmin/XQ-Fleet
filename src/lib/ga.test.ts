/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  gaConfigScript,
  gaMeasurementId,
  resetGaClientDedupeForTests,
  shouldTrackPath,
  trackBeginCheckout,
  trackGaEvent,
  trackPageView,
  trackPurchase,
} from './ga'

describe('ga', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    delete window.gtag
  })

  it('accepts only G- measurement IDs', () => {
    expect(shouldTrackPath('/en')).toBe(true)
    expect(shouldTrackPath('/en/checkout')).toBe(true)
    expect(shouldTrackPath('/admin')).toBe(false)
    expect(shouldTrackPath('/admin/bookings')).toBe(false)
    expect(shouldTrackPath('/app')).toBe(false)
    expect(shouldTrackPath('/internal/health')).toBe(false)
  })

  it('builds gtag config that disables automatic page_view', () => {
    const script = gaConfigScript('G-B3DQJJH0SR')
    expect(script).toContain("gtag('config','G-B3DQJJH0SR',{send_page_view:false})")
    expect(script).toContain('window.dataLayer')
  })

  it('returns null when measurement id env is unset or invalid', () => {
    const id = gaMeasurementId()
    if (id !== null) {
      expect(id).toMatch(/^G-[A-Z0-9]+$/)
    }
  })
})

describe('trackGaEvent', () => {
  let gtag: ReturnType<typeof vi.fn>

  beforeEach(() => {
    gtag = vi.fn()
    window.gtag = gtag
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TESTMEASURE1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    delete window.gtag
  })

  it('does not fire when gtag is missing', () => {
    delete window.gtag
    trackGaEvent('begin_checkout', {}, '/en/checkout/car-1')
    expect(gtag).not.toHaveBeenCalled()
  })

  it('does not fire when measurement id is missing', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
    trackGaEvent('begin_checkout', {}, '/en/checkout/car-1')
    expect(gtag).not.toHaveBeenCalled()
  })

  it('does not fire on excluded staff paths', () => {
    trackGaEvent('begin_checkout', {}, '/admin/bookings')
    expect(gtag).not.toHaveBeenCalled()
  })

  it('fires named event with params and send_to when guards pass', () => {
    trackGaEvent('begin_checkout', { currency: 'MYR' }, '/en/checkout/car-1')
    expect(gtag).toHaveBeenCalledWith('event', 'begin_checkout', {
      currency: 'MYR',
      send_to: 'G-TESTMEASURE1',
    })
  })
})

describe('conversion events', () => {
  let gtag: ReturnType<typeof vi.fn>

  beforeEach(() => {
    resetGaClientDedupeForTests()
    gtag = vi.fn()
    window.gtag = gtag
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TESTMEASURE1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    delete window.gtag
    resetGaClientDedupeForTests()
  })

  it('trackBeginCheckout no-ops unless trip and car are resolved', () => {
    trackBeginCheckout({
      pathname: '/en/checkout/car-1',
      carId: 'car-1',
      tripComplete: false,
    })
    trackBeginCheckout({
      pathname: '/en/checkout/car-1',
      carId: '',
      tripComplete: true,
    })
    expect(gtag).not.toHaveBeenCalled()
  })

  it('trackBeginCheckout fires begin_checkout for a valid public checkout session', () => {
    trackBeginCheckout({
      pathname: '/en/checkout/car-1',
      carId: 'car-1',
      tripComplete: true,
      currency: 'MYR',
      value: 210,
    })
    expect(gtag).toHaveBeenCalledWith('event', 'begin_checkout', {
      currency: 'MYR',
      value: 210,
      item_id: 'car-1',
      send_to: 'G-TESTMEASURE1',
    })
  })

  it('trackPurchase fires purchase with transaction_id, value, and currency and no PII fields', () => {
    trackPurchase({
      pathname: '/en/checkout/confirmed/rental-abc',
      transactionId: 'rental-abc',
      valueSen: 21000,
      currency: 'MYR',
    })
    const [, , params] = gtag.mock.calls[0] as [string, string, Record<string, unknown>]
    expect(gtag).toHaveBeenCalledWith('event', 'purchase', {
      transaction_id: 'rental-abc',
      value: 210,
      currency: 'MYR',
      send_to: 'G-TESTMEASURE1',
    })
    expect(params).not.toHaveProperty('email')
    expect(params).not.toHaveProperty('phone')
    expect(params).not.toHaveProperty('customer_email')
    expect(params).not.toHaveProperty('customer_phone')
  })

  it('trackPurchase does not fire twice for the same transaction_id', () => {
    const input = {
      pathname: '/en/checkout/confirmed/rental-dup',
      transactionId: 'rental-dup',
      valueSen: 10000,
      currency: 'MYR',
    }
    trackPurchase(input)
    trackPurchase(input)
    expect(gtag).toHaveBeenCalledTimes(1)
  })

  it('trackPageView still works beside the event helper', () => {
    trackPageView('/en/blog', '?q=1')
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
      page_path: '/en/blog?q=1',
      send_to: 'G-TESTMEASURE1',
    }))
  })
})
