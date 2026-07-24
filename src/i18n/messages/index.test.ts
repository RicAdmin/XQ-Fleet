import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Locale } from '#/i18n/locales'

const msStub = {
  notFound: {
    title: 'Halaman tidak dijumpai',
    documentTitle: '404 — MS',
  },
} as never

vi.mock('#/i18n/messages/ms', () => ({
  msMessages: msStub,
}))

describe('lazy locale message cache', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('falls back to English until a locale catalog is primed or loaded', async () => {
    const { messages, enMessages, primeMessages } = await import('#/i18n/messages')

    expect(messages.ms).toBe(enMessages)

    primeMessages('ms' as Locale, msStub)
    expect(messages.ms).toBe(msStub)
    expect(messages.ms.notFound.title).toBe('Halaman tidak dijumpai')
  })

  it('hydrates the sync proxy from loadMessages for deferred locales', async () => {
    const { loadMessages, messages, enMessages } = await import('#/i18n/messages')

    expect(messages.ms).toBe(enMessages)
    const loaded = await loadMessages('ms')
    expect(loaded).toBe(msStub)
    expect(messages.ms).toBe(msStub)
  })

  it('returns a stable promise from ensureMessages for React use()', async () => {
    const { ensureMessages } = await import('#/i18n/messages')

    const first = ensureMessages('ms')
    const second = ensureMessages('ms')
    expect(second).toBe(first)
    await expect(first).resolves.toBe(msStub)
  })
})
