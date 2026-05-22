import { useMemo } from 'react'

import { getLandingContent } from '#/i18n/content'
import { usePublicI18n } from '#/i18n/usePublicI18n'

/** Locale-aware marketing content (FAQs, attractions, promos, etc.). */
export function useLandingContent() {
  const { locale, t } = usePublicI18n()
  const content = useMemo(() => getLandingContent(locale), [locale])
  return { content, t, locale }
}
