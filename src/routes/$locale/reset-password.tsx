import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'

import { AuthPasswordInput } from '#/components/auth/AuthPasswordInput'
import CxqAuthMarketingAside from '#/components/auth/CxqAuthMarketingAside'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicAuthShell from '#/components/shells/PublicAuthShell'
import { useT } from '#/i18n/context'
import { authClient } from '#/lib/auth-client'
import { redirectAuthenticatedUser } from '#/lib/route-guards'

export const Route = createFileRoute('/$locale/reset-password')({
  validateSearch: z.object({
    token: z.string().optional(),
    error: z.string().optional(),
  }),
  beforeLoad: async () => {
    await redirectAuthenticatedUser()
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const t = useT()
  const { token, error: tokenError } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const invalidToken = tokenError === 'INVALID_TOKEN' || tokenError === 'TOKEN_EXPIRED'
  const missingToken = !token && !tokenError

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

          {invalidToken && !success ? (
            <div className="auth-error-banner" role="alert">
              {tokenError === 'TOKEN_EXPIRED'
                ? t('auth.verificationLinkExpired')
                : t('auth.passwordResetInvalid')}
            </div>
          ) : null}

          {missingToken && !success ? (
            <p className="auth-forgot-copy">{t('auth.forgotPasswordSubtitle')}</p>
          ) : null}

          {!invalidToken && !missingToken && !success ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault()
                setError(null)

                if (password !== confirmPassword) {
                  setError(t('auth.passwordMismatch'))
                  return
                }

                setIsSubmitting(true)

                try {
                  const result = await authClient.resetPassword({
                    newPassword: password,
                    token: token!,
                  })

                  if (result.error) {
                    throw new Error(result.error.message ?? t('auth.passwordResetInvalid'))
                  }

                  setSuccess(true)
                } catch (submissionError) {
                  setError(
                    submissionError instanceof Error
                      ? submissionError.message
                      : t('auth.passwordResetInvalid'),
                  )
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              <div className="auth-fields">
                <AuthPasswordInput
                  id="reset-password"
                  label={t('auth.newPassword')}
                  value={password}
                  onChange={setPassword}
                  placeholder={t('checkout.passwordMinPlaceholder')}
                  minLength={8}
                  showLabel={t('auth.showPassword')}
                  hideLabel={t('auth.hidePassword')}
                />

                <AuthPasswordInput
                  id="reset-confirm-password"
                  label={t('auth.confirmNewPassword')}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder={t('checkout.passwordMinPlaceholder')}
                  minLength={8}
                  showLabel={t('auth.showPassword')}
                  hideLabel={t('auth.hidePassword')}
                />
              </div>

              {error ? <p className="auth-error-banner">{error}</p> : null}

              <button
                type="submit"
                className="btn btn-leaf btn-lg auth-form-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('auth.resettingPassword') : t('auth.resetPasswordBtn')}
                {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
              </button>
            </form>
          ) : null}

          {success ? (
            <div className="auth-verify-banner" role="status">
              <strong>{t('auth.passwordResetSuccess')}</strong>
            </div>
          ) : null}

          {invalidToken || missingToken || success ? (
            <LocaleLink
              to={invalidToken || missingToken ? '/forgot-password' : '/login'}
              className="btn btn-leaf btn-lg auth-form-submit"
            >
              {invalidToken ? t('auth.sendResetLink') : missingToken ? t('auth.sendResetLink') : t('auth.backToSignIn')}
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </LocaleLink>
          ) : null}
        </div>
      </div>
    </PublicAuthShell>
  )
}
