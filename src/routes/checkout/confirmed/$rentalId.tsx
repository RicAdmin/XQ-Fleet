import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirectWithParams } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/checkout/confirmed/$rentalId')({
  beforeLoad: ({ params, location }) =>
    legacyLocaleRedirectWithParams(
      '/checkout/confirmed/$rentalId',
      params,
      location.search as Record<string, unknown>,
    ),
})
