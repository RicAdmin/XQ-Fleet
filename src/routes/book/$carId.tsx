import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirectWithParams } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/book/$carId')({
  beforeLoad: ({ params, location }) =>
    legacyLocaleRedirectWithParams('/book/$carId', params, location.search as Record<string, unknown>),
})
