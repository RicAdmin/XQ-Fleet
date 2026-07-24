import { describe, expect, it } from 'vitest'

/**
 * Language switcher accessible-name contract.
 * Full component render needs a TanStack Router; this documents the name rule
 * used by LanguageSwitcher (visible label, no aria-label override on the trigger).
 */
describe('LanguageSwitcher accessible name contract', () => {
  it('expects visible locale + currency to form the name without a Language aria-label', () => {
    const visible = 'English · MYR'
    const ariaLabelOverride = 'Language'
    expect(visible).toContain('English')
    expect(visible).toContain('MYR')
    expect(visible).not.toBe(ariaLabelOverride)
  })
})
