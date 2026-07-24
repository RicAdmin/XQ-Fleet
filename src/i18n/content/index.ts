import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE } from '#/i18n/locales'

import { enLandingContent, type LandingContent } from '#/i18n/content/en'

export type { LandingContent }

export async function loadLandingContent(locale: Locale): Promise<LandingContent> {
  switch (locale) {
    case 'ms':
      return (await import('#/i18n/content/ms')).msLandingContent
    case 'zh':
      return (await import('#/i18n/content/zh')).zhLandingContent
    case 'en':
    default:
      return enLandingContent
  }
}

const cache = new Map<Locale, LandingContent>([[DEFAULT_LOCALE, enLandingContent]])

export function getLandingContent(locale: Locale): LandingContent {
  return cache.get(locale) ?? cache.get(DEFAULT_LOCALE) ?? enLandingContent
}

export function primeLandingContent(locale: Locale, content: LandingContent) {
  cache.set(locale, content)
}
