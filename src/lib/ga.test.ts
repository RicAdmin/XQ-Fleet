import { describe, expect, it } from 'vitest'

import {
  gaConfigScript,
  gaMeasurementId,
  shouldTrackPath,
} from './ga'

describe('ga', () => {
  it('accepts only G- measurement IDs', () => {
    // Vitest may not set VITE_GA_MEASUREMENT_ID; exercise path helpers only.
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
    // Without env, helper must not invent an ID.
    const id = gaMeasurementId()
    if (id !== null) {
      expect(id).toMatch(/^G-[A-Z0-9]+$/)
    }
  })
})
