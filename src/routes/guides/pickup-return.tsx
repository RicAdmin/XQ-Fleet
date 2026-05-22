import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirect } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/guides/pickup-return')({
  beforeLoad: () => legacyLocaleRedirect('/guides/pickup-return'),
})
