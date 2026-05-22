import { useEffect } from 'react'

import { useI18n } from '#/i18n/context'

/** Syncs `<html lang>` with the active locale route. */
export function LocaleHtmlLang() {
  const { htmlLang } = useI18n()

  useEffect(() => {
    document.documentElement.lang = htmlLang
  }, [htmlLang])

  return null
}
