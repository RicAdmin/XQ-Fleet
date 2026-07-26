import { describe, expect, it } from 'vitest'

import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'

import {
  canAccessSurface,
  getDefaultHomePathForPersona,
  getHomePathForRole,
  resolveDashboardPersona,
} from '#/lib/auth-model'

describe('auth-model helpers', () => {
  it('maps each role to the correct home path', () => {
    expect(getHomePathForRole('owner')).toBe(INTERNAL_JOBS_PATH)
    expect(getHomePathForRole('staff', 'customer_service')).toBe(INTERNAL_JOBS_PATH)
    expect(getHomePathForRole('staff', 'operations')).toBe(INTERNAL_JOBS_PATH)
    expect(getHomePathForRole('customer')).toBe('/')
  })

  it('knows which roles can reach each protected surface', () => {
    expect(canAccessSurface('owner', 'admin')).toBe(true)
    expect(canAccessSurface('staff', 'admin')).toBe(true)
    expect(canAccessSurface('owner', 'app')).toBe(true)
    expect(canAccessSurface('staff', 'app')).toBe(true)
    expect(canAccessSurface('customer', 'app')).toBe(false)
    expect(canAccessSurface('customer', 'account')).toBe(true)
  })

  it('resolves dashboard personas and super-admin view mode', () => {
    expect(
      resolveDashboardPersona({
        role: 'staff',
        staffProfile: 'operations',
      }),
    ).toBe('operations')

    expect(
      resolveDashboardPersona({
        role: 'super_admin',
        viewMode: 'customer_service',
      }),
    ).toBe('customer_service')

    expect(
      resolveDashboardPersona({
        role: 'super_admin',
        viewMode: 'operations',
      }),
    ).toBe('operations')

    expect(
      resolveDashboardPersona({
        role: 'super_admin',
        viewMode: 'admin',
      }),
    ).toBe('admin')

    expect(resolveDashboardPersona({ role: 'owner' })).toBe('admin')
  })

  it('maps personas to default home paths', () => {
    expect(getDefaultHomePathForPersona('customer_service')).toBe(INTERNAL_JOBS_PATH)
    expect(getDefaultHomePathForPersona('operations')).toBe(INTERNAL_JOBS_PATH)
    expect(getDefaultHomePathForPersona('admin')).toBe(INTERNAL_JOBS_PATH)
  })
})
