import { describe, expect, it } from 'vitest'

import {
  canAccessSurface,
  getHomePathForRole,
  getLoginPathForSurface,
  isAppRole,
} from '#/lib/auth-model'

describe('auth-model helpers', () => {
  it('maps each role to the correct home path', () => {
    expect(getHomePathForRole('owner')).toBe('/admin')
    expect(getHomePathForRole('staff')).toBe('/app')
    expect(getHomePathForRole('customer')).toBe('/')
  })

  it('knows which roles can reach each protected surface', () => {
    expect(canAccessSurface('owner', 'admin')).toBe(true)
    expect(canAccessSurface('staff', 'admin')).toBe(false)
    expect(canAccessSurface('owner', 'app')).toBe(true)
    expect(canAccessSurface('staff', 'app')).toBe(true)
    expect(canAccessSurface('customer', 'app')).toBe(false)
    expect(canAccessSurface('customer', 'account')).toBe(true)
  })

  it('returns the correct login routes and role guards', () => {
    expect(getLoginPathForSurface('admin')).toBe('/internal/login')
    expect(getLoginPathForSurface('app')).toBe('/internal/login')
    expect(getLoginPathForSurface('account')).toBe('/en/login')
    expect(isAppRole('owner')).toBe(true)
    expect(isAppRole('staff')).toBe(true)
    expect(isAppRole('customer')).toBe(true)
    expect(isAppRole('unknown')).toBe(false)
  })
})
