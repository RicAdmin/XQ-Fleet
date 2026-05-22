import { redirect } from '@tanstack/react-router'

import { defaultLocalePath } from '#/i18n/link'

export function legacyLocaleRedirect(path: string): never {
  throw redirect({ to: defaultLocalePath(path) as never })
}

export function legacyLocaleRedirectWithParams(
  pathTemplate: string,
  params: Record<string, string>,
): never {
  let target = defaultLocalePath(pathTemplate)
  for (const [key, value] of Object.entries(params)) {
    target = target.replace(`$${key}`, value)
  }
  throw redirect({ to: target as never })
}
