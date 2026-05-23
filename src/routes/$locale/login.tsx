import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'

import { AuthPasswordInput } from '#/components/auth/AuthPasswordInput'
import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { useLocale, useT } from '#/i18n/context'
import { authReturnPath, authVerifyCallbackPath, redirectAfterAuth } from '#/lib/auth-redirect'
import { authClient } from '#/lib/auth-client'
import { appRoleFromSessionUser } from '#/lib/auth-model'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/$locale/login')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
    error: z.string().optional(),
  }),
  beforeLoad: async ({ search }) => {
    await redirectAuthenticatedUser({ returnTo: search.returnTo })
  },
  component: CustomerLoginPage,
})

function CustomerLoginPage() {
  const t = useT()
  const locale = useLocale()
  const { returnTo, error: verifyError } = Route.useSearch()
  const loginSearch = returnTo ? { returnTo } : undefined
  const verifyErrorMessage =
    verifyError === 'TOKEN_EXPIRED'
      ? t('auth.verificationLinkExpired')
      : verifyError === 'INVALID_TOKEN'
        ? t('auth.verificationLinkInvalid')
        : null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <PublicAuthShell screenLabel={t('auth.screenSignIn')} minimal>
      <div className="auth-page-card">
        <CxqAuthMarketingAside slogan={t('auth.asideSloganSignIn')} />

        <div className="auth-right">
          <span className="auth-badge">{t('auth.customerAccess')}</span>
          <h3>{t('auth.signInTitle')}</h3>
          <p className="auth-sub">
            {t('auth.newToCarXq')}{' '}
            <LocaleLink to="/register" search={loginSearch}>
              {t('auth.createAccount')}
            </LocaleLink>
          </p>

          {verifyErrorMessage ? (
            <div className="auth-error-banner" role="alert">
              {verifyErrorMessage}
            </div>
          ) : null}

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)
              setIsSubmitting(true)

              try {
                const destination = authReturnPath(locale, returnTo ?? '/account')
                const signInResult = await authClient.signIn.email({
                  email: email.trim(),
                  password,
                  callbackURL: authVerifyCallbackPath(locale, returnTo ?? '/account'),
                })

                if (signInResult.error) {
                  if (signInResult.error.code === 'EMAIL_NOT_VERIFIED') {
                    setError(t('auth.emailNotVerified'))
                    return
                  }
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

                redirectAfterAuth(destination)
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

              <AuthPasswordInput
                id="customer-password"
                label={t('auth.password')}
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                placeholder={t('auth.passwordPlaceholder')}
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
              />

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
          </form>
        </div>
      </div>
    </PublicAuthShell>
  )
}
