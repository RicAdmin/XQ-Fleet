import { Link, type LinkProps } from '@tanstack/react-router'

import { useLocaleHref } from '#/i18n/context'

type LocaleLinkProps = Omit<LinkProps, 'to'> & {
  to: string
}

/** Internal link that preserves the active locale prefix. */
export function LocaleLink({ to, ...props }: LocaleLinkProps) {
  const localeHref = useLocaleHref()
  return <Link {...props} to={localeHref(to) as LinkProps['to']} />
}
