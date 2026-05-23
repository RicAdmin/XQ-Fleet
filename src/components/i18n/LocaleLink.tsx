import { Link, type LinkProps } from '@tanstack/react-router'

import { useOptionalI18n } from '#/i18n/context'
import { defaultLocalePath } from '#/i18n/link'

type LocaleLinkProps = Omit<LinkProps, 'to'> & {
  to: string
}

/** Internal link that preserves the active locale prefix when inside locale layout. */
export function LocaleLink({ to, ...props }: LocaleLinkProps) {
  const ctx = useOptionalI18n()
  const href = ctx ? ctx.localeHref(to) : defaultLocalePath(to)
  return <Link {...props} to={href as LinkProps['to']} />
}
