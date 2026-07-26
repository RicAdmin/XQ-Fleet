import { describe, expect, it } from 'vitest'

import {
  INTERNAL_JOBS_PATH,
  INTERNAL_LOGIN_PATH,
  isPublicInternalPath,
} from '#/lib/internal-routes'

describe('internal-routes', () => {
  it('exposes stable staff workspace paths', () => {
    expect(INTERNAL_LOGIN_PATH).toBe('/internal/login')
    expect(INTERNAL_JOBS_PATH).toBe('/internal/jobs')
  })

  it('treats login and invite as public internal paths', () => {
    expect(isPublicInternalPath('/internal/login')).toBe(true)
    expect(isPublicInternalPath('/internal/invite/abc')).toBe(true)
    expect(isPublicInternalPath('/internal/jobs')).toBe(false)
    expect(isPublicInternalPath('/internal/job')).toBe(false)
  })
})
