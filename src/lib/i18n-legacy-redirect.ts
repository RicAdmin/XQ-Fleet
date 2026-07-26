import { redirect } from '@tanstack/react-router'

import { defaultLocalePath } from '#/i18n/link'

/** Permanent locale-prefix redirects for unprefixed public URLs. */
const LEGACY_REDIRECT_STATUS = 301

export function legacyLocaleRedirect(path: string, search?: Record<string, unknown>): never {
  throw redirect({
    to: defaultLocalePath(path) as never,
    search: search as never,
    statusCode: LEGACY_REDIRECT_STATUS,
  })
}

export function legacyLocaleRedirectWithParams(
  pathTemplate: string,
  params: Record<string, string>,
  search?: Record<string, unknown>,
): never {
  let target = defaultLocalePath(pathTemplate)
  for (const [key, value] of Object.entries(params)) {
    target = target.replace(`$${key}`, value)
  }
  throw redirect({
    to: target as never,
    search: search as never,
    statusCode: LEGACY_REDIRECT_STATUS,
  })
}
