import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirectWithParams } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/checkout/confirmed/$rentalId')({
  beforeLoad: ({ params }) => legacyLocaleRedirectWithParams('/checkout/confirmed/$rentalId', params),
})
