import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'

import type { LandingContent } from '#/i18n/content'
import { usePublicI18n } from '#/i18n/usePublicI18n'

const LandingContentContext = createContext<LandingContent | null>(null)

export function LandingContentProvider({
  content,
  children,
}: {
  content: LandingContent
  children: ReactNode
}) {
  return (
    <LandingContentContext.Provider value={content}>
      {children}
    </LandingContentContext.Provider>
  )
}

/** Locale-aware marketing content (FAQs, attractions, promos, etc.). */
export function useLandingContent() {
  const { locale, t } = usePublicI18n()
  const content = useContext(LandingContentContext)
  if (!content) {
    throw new Error('useLandingContent must be used within LandingContentProvider')
  }
  return useMemo(() => ({ content, t, locale }), [content, t, locale])
}
