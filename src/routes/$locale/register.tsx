import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'

import CxqAuthLegalFooter from '#/components/auth/CxqAuthLegalFooter'
import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { useT } from '#/i18n/context'
import { cxqAuthSignUpAside } from '#/lib/cxq-auth-marketing'
import { authClient } from '#/lib/auth-client'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/$locale/register')({
  validateSearch: z.object({ returnTo: z.string().optional() }),
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: CustomerRegisterPage,
})

function CustomerRegisterPage() {
  const t = useT()
  const navigate = Route.useNavigate()
  const { returnTo } = Route.useSearch()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <PublicAuthShell screenLabel={t('auth.screenSignUp')} minimal>
      <div className="auth-page-card">
        <CxqAuthMarketingAside {...cxqAuthSignUpAside} />

        <div className="auth-right">
          <span className="auth-badge">{t('checkout.newAccount')}</span>
          <h3>{t('checkout.createYourAccount')}</h3>
          <p className="auth-sub">
            {t('auth.haveAccount')} <LocaleLink to="/login">{t('auth.signInLink')}</LocaleLink>
          </p>

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)

              if (!agreedToTerms) {
                setError(t('checkout.agreeTermsRequired'))
                return
              }

              setIsSubmitting(true)

              try {
                await authClient.signUp.email({ name, email, password })
                await navigate({ to: (returnTo as never) ?? '/account' })
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : t('checkout.unableCreateAccount'),
                )
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <div className="auth-fields">
              <div className="auth-field">
                <label htmlFor="customer-name">{t('auth.fullName')}</label>
                <input
                  id="customer-name"
                  type="text"
                  autoComplete="name"
                  placeholder={t('checkout.namePlaceholder')}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">{t('auth.email')}</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-password">{t('auth.password')}</label>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('checkout.passwordMinPlaceholder')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                />
                {t('auth.agreePrefix')}{' '}
                <LocaleLink to="/rental-agreement" className="auth-link">
                  {t('footer.rentalContract')}
                </LocaleLink>{' '}
                {t('common.and')}{' '}
                <LocaleLink to="/privacy" className="auth-link">
                  {t('footer.privacy')}
                </LocaleLink>
              </label>
            </div>

            {error ? <p className="auth-error-banner">{error}</p> : null}

            <button
              type="submit"
              className="btn btn-leaf btn-lg auth-form-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
              {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
            </button>

            <CxqAuthLegalFooter />
          </form>
        </div>
      </div>
    </PublicAuthShell>
  )
}
