import { useEffect, useRef, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Globe } from 'lucide-react'

import { useI18n } from '#/i18n/context'
import { stripLocalePrefix } from '#/i18n/link'
import { LOCALE_LABELS, LOCALE_STORAGE_KEY, LOCALES, type Locale } from '#/i18n/locales'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const switchLocale = (next: Locale) => {
    if (next === locale) {
      setOpen(false)
      return
    }
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }

    const onLocalePrefixedRoute = /^\/(en|ms|zh)(\/|$)/.test(pathname)
    if (!onLocalePrefixedRoute) {
      window.location.reload()
      return
    }

    const bare = stripLocalePrefix(pathname)
    const target = bare === '/' ? `/${next}` : `/${next}${bare}`
    void navigate({ to: target as never })
    setOpen(false)
  }

  return (
    <div className={`lang-switcher ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="lang-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={14} aria-hidden />
        <span>{LOCALE_LABELS[locale]}</span>
        <span className="lang-switcher-currency">· {t('nav.currency')}</span>
        <ChevronDown size={12} aria-hidden />
      </button>
      {open ? (
        <ul className="lang-switcher-menu" role="listbox" aria-label={t('nav.language')}>
          {LOCALES.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              <button
                type="button"
                className={code === locale ? 'is-active' : undefined}
                onClick={() => switchLocale(code)}
              >
                {LOCALE_LABELS[code]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
