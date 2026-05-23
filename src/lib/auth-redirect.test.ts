import { describe, expect, it } from 'vitest'

import { authReturnPath, authVerifyCallbackPath } from '#/lib/auth-redirect'

describe('authReturnPath', () => {
  it('keeps /account without locale prefix', () => {
    expect(authReturnPath('en', '/account')).toBe('/account')
    expect(authReturnPath('ms', '/account')).toBe('/account')
  })

  it('strips mistaken locale prefix from account', () => {
    expect(authReturnPath('en', '/en/account')).toBe('/account')
  })

  it('prefixes locale checkout paths', () => {
    expect(authReturnPath('ms', '/checkout/abc')).toBe('/ms/checkout/abc')
  })
})

describe('authVerifyCallbackPath', () => {
  it('points verification callback at locale login with returnTo', () => {
    expect(authVerifyCallbackPath('en', '/account')).toBe('/en/login?returnTo=%2Faccount')
  })
})
