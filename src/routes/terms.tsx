import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirect } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/terms')({
  beforeLoad: () => legacyLocaleRedirect('/terms'),
})
