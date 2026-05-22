import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirectWithParams } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/pay/$rentalId')({
  beforeLoad: ({ params }) => legacyLocaleRedirectWithParams('/pay/$rentalId', params),
})
