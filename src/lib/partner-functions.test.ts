import { describe, expect, it } from 'vitest'

import { formatPartnerCode } from '#/lib/partner-functions'

function normalizePartnerCode(code: string) {
  return formatPartnerCode(code)
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

describe('partner code formatting', () => {
  it('formats codes in uppercase', () => {
    expect(formatPartnerCode(' lar ')).toBe('LAR')
    expect(formatPartnerCode('lc1')).toBe('LC1')
  })
})

describe('partner code normalization', () => {
  it('normalizes codes to uppercase slug form', () => {
    expect(normalizePartnerCode(' Island Motors ')).toBe('ISLAND-MOTORS')
    expect(normalizePartnerCode('A_B')).toBe('A_B')
    expect(normalizePartnerCode('!!!')).toBe('')
  })
})
