import { Link, createFileRoute } from '@tanstack/react-router'

import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { useT } from '#/i18n/context'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/$locale/forgot-password')({
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const t = useT()

  return (
    <PublicAuthShell screenLabel={t('auth.resetPassword')}>
      <div className="auth-page-card">
        <div className="auth-left">
          <div className="auth-left-inner">
            <span className="eyebrow">Car XQ · Account help</span>
            <h2>{t('auth.resetPassword')}</h2>
            <p>
              Self-serve email reset is not wired here yet. Contact the team on WhatsApp and we will verify you
              quickly.
            </p>
          </div>
        </div>

        <div className="auth-right">
          <span className="auth-badge">{t('auth.customerAccess')}</span>
          <h3>{t('auth.resetPassword')}</h3>
          <p className="auth-sub">
            {t('auth.haveAccount')}{' '}
            <LocaleLink to="/login">{t('auth.signInLink')}</LocaleLink>
          </p>

          <p className="auth-forgot-copy">
            For security, password resets are handled by Car XQ support. Message us with the email on your account.
          </p>

          <a
            className="btn btn-leaf btn-lg auth-form-submit"
            href="https://wa.me/601135215576"
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </PublicAuthShell>
  )
}
