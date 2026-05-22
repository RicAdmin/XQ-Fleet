import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirectWithParams } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/booking/confirmed/$rentalId')({
  beforeLoad: ({ params }) => legacyLocaleRedirectWithParams('/booking/confirmed/$rentalId', params),
})
