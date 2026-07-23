import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { gaMeasurementId, trackPageView } from '#/lib/ga'

/** Fires GA4 page_view on client navigations (initial load + SPA transitions). */
export function GaPageViews() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const search = useRouterState({ select: (s) => s.location.searchStr })
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    if (!gaMeasurementId()) return
    const key = `${pathname}${search}`
    if (lastKey.current === key) return
    lastKey.current = key
    trackPageView(pathname, search)
  }, [pathname, search])

  return null
}
