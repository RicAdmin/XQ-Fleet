import { useState } from 'react'

import { ArrowRight } from 'lucide-react'

import { AuthPasswordInput } from '#/components/auth/AuthPasswordInput'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import { usePublicI18n } from '#/i18n/usePublicI18n'
import type { Locale } from '#/i18n/locales'
import { authVerifyCallbackPath } from '#/lib/auth-redirect'
import { authClient } from '#/lib/auth-client'
import { appRoleFromSessionUser } from '#/lib/auth-model'

type CheckoutInlineAuthProps = {
  mode: 'sign-in' | 'register'
  locale: Locale
  returnTo: string
  defaultEmail?: string
  onSuccess: () => void
  onSwitchMode: (mode: 'sign-in' | 'register') => void
  onCancel: () => void
}

export function CheckoutInlineAuth({
  mode,
  locale,
  returnTo,
  defaultEmail = '',
  onSuccess,
  onSwitchMode,
  onCancel,
}: CheckoutInlineAuthProps) {
  const { t } = usePublicI18n()
  const verifyCallback = authVerifyCallbackPath(locale, returnTo)

  if (mode === 'sign-in') {
    return (
      <CheckoutSignInForm
        t={t}
        defaultEmail={defaultEmail}
        verifyCallback={verifyCallback}
        onSuccess={onSuccess}
        onSwitchMode={() => onSwitchMode('register')}
        onCancel={onCancel}
      />
    )
  }

  return (
    <CheckoutRegisterForm
      t={t}
      verifyCallback={verifyCallback}
      onSwitchMode={() => onSwitchMode('sign-in')}
      onCancel={onCancel}
    />
  )
}

function CheckoutSignInForm({
  t,
  defaultEmail,
  verifyCallback,
  onSuccess,
  onSwitchMode,
  onCancel,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string
  defaultEmail: string
  verifyCallback: string
  onSuccess: () => void
  onSwitchMode: () => void
  onCancel: () => void
}) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="checkout-inline-auth">
      <div className="checkout-inline-auth-head">
        <h4>{t('auth.signInTitle')}</h4>
        <button type="button" className="checkout-inline-auth-cancel" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
      <p className="checkout-inline-auth-sub">
        {t('auth.newToCarXq')}{' '}
        <button type="button" className="checkout-inline-auth-link" onClick={onSwitchMode}>
          {t('auth.createAccount')}
        </button>
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          setError(null)
          setIsSubmitting(true)

          try {
            const signInResult = await authClient.signIn.email({
              email: email.trim(),
              password,
              callbackURL: verifyCallback,
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

            onSuccess()
          } catch (submissionError) {
            setError(
              submissionError instanceof Error ? submissionError.message : t('auth.unableSignIn'),
            )
          } finally {
            setIsSubmitting(false)
          }
        }}
      >
        <div className="auth-fields">
          <div className="auth-field">
            <label htmlFor="checkout-signin-email">{t('auth.email')}</label>
            <input
              id="checkout-signin-email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <AuthPasswordInput
            id="checkout-signin-password"
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

        {error ? (
          <p className="auth-error-banner" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-leaf btn-lg auth-form-submit" disabled={isSubmitting}>
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
          {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
        </button>
      </form>
    </div>
  )
}

function CheckoutRegisterForm({
  t,
  verifyCallback,
  onSwitchMode,
  onCancel,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string
  verifyCallback: string
  onSwitchMode: () => void
  onCancel: () => void
}) {
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
    <div className="checkout-inline-auth">
      <div className="checkout-inline-auth-head">
        <h4>{t('checkout.createYourAccount')}</h4>
        <button type="button" className="checkout-inline-auth-cancel" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
      <p className="checkout-inline-auth-sub">
        {t('auth.haveAccount')}{' '}
        <button type="button" className="checkout-inline-auth-link" onClick={onSwitchMode}>
          {t('auth.signInLink')}
        </button>
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
                  callbackURL: verifyCallback,
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
          <button
            type="button"
            className="btn btn-leaf btn-lg auth-form-submit"
            style={{ marginTop: 12 }}
            onClick={onSwitchMode}
          >
            {t('auth.signInLink')} <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      ) : (
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
                callbackURL: verifyCallback,
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
              <label htmlFor="checkout-register-name">{t('auth.name')}</label>
              <input
                id="checkout-register-name"
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
              <label htmlFor="checkout-register-email">{t('auth.email')}</label>
              <input
                id="checkout-register-email"
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
              id="checkout-register-password"
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
              id="checkout-register-confirm-password"
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

          {error ? (
            <p className="auth-error-banner" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-leaf btn-lg auth-form-submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
            {!isSubmitting ? <ArrowRight size={14} strokeWidth={2.5} aria-hidden /> : null}
          </button>
        </form>
      )}
    </div>
  )
}
