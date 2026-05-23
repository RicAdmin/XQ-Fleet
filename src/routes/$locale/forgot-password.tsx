import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { useLocale, useT } from '#/i18n/context'
import { authReturnUrl } from '#/lib/auth-redirect'
import { authClient } from '#/lib/auth-client'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/$locale/forgot-password')({
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const t = useT()
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentToEmail, setSentToEmail] = useState<string | null>(null)

  return (
    <PublicAuthShell screenLabel={t('auth.resetPassword')} minimal>
      <div className="auth-page-card">
        <CxqAuthMarketingAside slogan={t('auth.asideSloganSignIn')} />

        <div className="auth-right">
          <span className="auth-badge">{t('auth.customerAccess')}</span>
          <h3>{t('auth.resetPassword')}</h3>
          <p className="auth-sub">
            {t('auth.haveAccount')} <LocaleLink to="/login">{t('auth.signInLink')}</LocaleLink>
          </p>

          {sentToEmail ? (
            <div className="auth-verify-banner" role="status">
              <strong>{t('auth.resetLinkSentTitle')}</strong>
              {t('auth.resetLinkSentBody', { email: sentToEmail })}
            </div>
          ) : (
            <p className="auth-forgot-copy">{t('auth.forgotPasswordSubtitle')}</p>
          )}

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              if (sentToEmail) return

              setError(null)
              setIsSubmitting(true)

              try {
                const result = await authClient.requestPasswordReset({
                  email: email.trim(),
                  redirectTo: authReturnUrl(locale, '/reset-password'),
                })

                if (result.error) {
                  throw new Error(result.error.message ?? t('auth.unableSendResetLink'))
                }

                setSentToEmail(email.trim())
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : t('auth.unableSendResetLink'),
                )
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <div className="auth-fields">
              <div className="auth-field">
                <label htmlFor="forgot-email">{t('auth.email')}</label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={Boolean(sentToEmail)}
                />
              </div>
            </div>

            {error ? <p className="auth-error-banner">{error}</p> : null}

            {sentToEmail ? (
              <LocaleLink to="/login" className="btn btn-leaf btn-lg auth-form-submit">
                {t('auth.backToSignIn')} <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
              </LocaleLink>
            ) : (
              <button
                type="submit"
                className="btn btn-leaf btn-lg auth-form-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
                {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
              </button>
            )}
          </form>
        </div>
      </div>
    </PublicAuthShell>
  )
}
