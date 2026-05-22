import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'

import CxqAuthLegalFooter from '#/components/auth/CxqAuthLegalFooter'
import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { useT } from '#/i18n/context'
import { cxqAuthSignInAside } from '#/lib/cxq-auth-marketing'
import { authClient } from '#/lib/auth-client'
import { appRoleFromSessionUser } from '#/lib/auth-model'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/$locale/login')({
  validateSearch: z.object({ returnTo: z.string().optional() }),
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: CustomerLoginPage,
})

function CustomerLoginPage() {
  const t = useT()
  const navigate = Route.useNavigate()
  const { returnTo } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <PublicAuthShell screenLabel={t('auth.screenSignIn')} minimal>
      <div className="auth-page-card">
        <CxqAuthMarketingAside {...cxqAuthSignInAside} />

        <div className="auth-right">
          <span className="auth-badge">{t('auth.customerAccess')}</span>
          <h3>{t('auth.signInTitle')}</h3>
          <p className="auth-sub">
            {t('auth.newToCarXq')}{' '}
            <LocaleLink to="/register">{t('auth.createAccount')}</LocaleLink>
          </p>

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)
              setIsSubmitting(true)

              try {
                const signInResult = await authClient.signIn.email({ email, password })

                if (signInResult.error) {
                  throw new Error(signInResult.error.message ?? t('auth.signInFailed'))
                }

                let role = appRoleFromSessionUser(signInResult.data?.user)
                if (!role) {
                  const { data: session } = await authClient.getSession()
                  role = appRoleFromSessionUser(session?.user)
                }

                if (role !== 'customer') {
                  await authClient.signOut()
                  setError(t('auth.staffMustUseInternal'))
                  return
                }

                await navigate({ to: (returnTo as never) ?? '/account' })
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : t('auth.unableSignIn'),
                )
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <div className="auth-fields">
              <div className="auth-field">
                <label htmlFor="customer-email">{t('auth.email')}</label>
                <input
                  id="customer-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="customer-password">{t('auth.password')}</label>
                <input
                  id="customer-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="auth-row-between">
                <LocaleLink to="/forgot-password" className="auth-link">
                  {t('auth.forgotPassword')}
                </LocaleLink>
              </div>
            </div>

            {error ? <p className="auth-error-banner">{error}</p> : null}

            <button
              type="submit"
              className="btn btn-leaf btn-lg auth-form-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
              {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
            </button>

            <CxqAuthLegalFooter />
          </form>
        </div>
      </div>
    </PublicAuthShell>
  )
}
