import { LocaleLink } from '#/components/i18n/LocaleLink'
import { useT } from '#/i18n/context'

export default function CxqAuthLegalFooter() {
  const t = useT()
  return (
    <p className="auth-legal">
      <LocaleLink to="/terms" className="auth-link">
        {t('footer.terms')}
      </LocaleLink>
      {' · '}
      <LocaleLink to="/privacy" className="auth-link">
        {t('footer.privacy')}
      </LocaleLink>
    </p>
  )
}
