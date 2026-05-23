import { createFileRoute, redirect } from '@tanstack/react-router'

import { defaultLocalePath } from '#/i18n/link'

export const Route = createFileRoute('/reset-password')({
  beforeLoad: () => {
    throw redirect({ to: defaultLocalePath('/reset-password') as never })
  },
})
