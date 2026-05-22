import { createFileRoute, redirect } from '@tanstack/react-router'

import { defaultLocalePath } from '#/i18n/link'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: () => {
    throw redirect({ to: defaultLocalePath('/forgot-password') as never })
  },
})
