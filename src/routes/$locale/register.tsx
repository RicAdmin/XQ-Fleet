import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'

import { AuthPasswordInput } from '#/components/auth/AuthPasswordInput'
import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { useLocale, useT } from '#/i18n/context'
import { authReturnPath } from '#/lib/auth-redirect'
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
  const locale = useLocale()
  const { returnTo } = Route.useSearch()
  const authSearch = returnTo ? { returnTo } : undefined
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  const [resendNotice, setResendNotice] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const formLocked = Boolean(pendingVerificationEmail)

  return (
    <PublicAuthShell screenLabel={t('auth.screenSignUp')} minimal>
      <div className="auth-page-card">
        <CxqAuthMarketingAside slogan={t('auth.asideSloganSignUp')} />

        <div className="auth-right">
          <span className="auth-badge">{t('checkout.newAccount')}</span>
          <h3>{t('checkout.createYourAccount')}</h3>
          <p className="auth-sub">
            {t('auth.haveAccount')} <LocaleLink to="/login" search={authSearch}>{t('auth.signInLink')}</LocaleLink>
          </p>

          {pendingVerificationEmail ? (
            <div className="auth-verify-banner" role="status">
              <strong>{t('auth.verifyEmailTitle')}</strong>
              {t('auth.verifyEmailBody', { email: pendingVerificationEmail })}
              {resendNotice ? <p style={{ margin: '10px 0 0' }}>{resendNotice}</p> : null}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 12 }}
                disabled={isResending}
                onClick={async () => {
                  if (!pendingVerificationEmail) return
                  setIsResending(true)
                  setResendNotice(null)
                  try {
                    const result = await authClient.sendVerificationEmail({
                      email: pendingVerificationEmail,
                      callbackURL: authReturnPath(locale, returnTo ?? '/account'),
                    })
                    if (result.error) {
                      throw new Error(result.error.message ?? t('checkout.unableCreateAccount'))
                    }
                    setResendNotice(t('auth.resendVerificationSent'))
                  } catch (resendError) {
                    setResendNotice(
                      resendError instanceof Error
                        ? resendError.message
                        : t('checkout.unableCreateAccount'),
                    )
                  } finally {
                    setIsResending(false)
                  }
                }}
              >
                {isResending ? t('auth.creatingAccount') : t('auth.resendVerification')}
              </button>
            </div>
          ) : null}

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)

              if (!agreedToTerms) {
                setError(t('checkout.agreeTermsRequired'))
                return
              }

              if (password !== confirmPassword) {
                setError(t('auth.passwordMismatch'))
                return
              }

              setIsSubmitting(true)

              try {
                const signUpResult = await authClient.signUp.email({
                  name: name.trim(),
                  email: email.trim(),
                  password,
                  callbackURL: authReturnPath(locale, returnTo ?? '/account'),
                })

                if (signUpResult.error) {
                  throw new Error(signUpResult.error.message ?? t('checkout.unableCreateAccount'))
                }

                await authClient.signOut()
                setPendingVerificationEmail(email.trim())
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
                <label htmlFor="customer-name">{t('auth.name')}</label>
                <input
                  id="customer-name"
                  type="text"
                  autoComplete="name"
                  placeholder={t('auth.namePlaceholder')}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  disabled={formLocked}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">{t('auth.email')}</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={formLocked}
                />
              </div>

              <AuthPasswordInput
                id="register-password"
                label={t('auth.password')}
                value={password}
                onChange={setPassword}
                placeholder={t('checkout.passwordMinPlaceholder')}
                minLength={8}
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
                required={!formLocked}
                disabled={formLocked}
              />

              <AuthPasswordInput
                id="register-confirm-password"
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder={t('checkout.passwordMinPlaceholder')}
                minLength={8}
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
                required={!formLocked}
                disabled={formLocked}
              />

              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                  disabled={formLocked}
                />
                {t('auth.agreePrefix')}{' '}
                <LocaleLink to="/terms" className="auth-link">
                  {t('footer.terms')}
                </LocaleLink>{' '}
                {t('common.and')}{' '}
                <LocaleLink to="/privacy" className="auth-link">
                  {t('footer.privacy')}
                </LocaleLink>
              </label>
            </div>

            {error ? <p className="auth-error-banner">{error}</p> : null}

            {pendingVerificationEmail ? (
              <LocaleLink to="/login" search={authSearch} className="btn btn-leaf btn-lg auth-form-submit">
                {t('auth.signInLink')} <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
              </LocaleLink>
            ) : (
              <button
                type="submit"
                className="btn btn-leaf btn-lg auth-form-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
                {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
              </button>
            )}

          </form>
        </div>
      </div>
    </PublicAuthShell>
  )
}
