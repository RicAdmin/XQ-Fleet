type CxqAuthSocialButtonsProps = {
  onGoogle: () => void | Promise<void>
  disabled?: boolean
  googleLabel?: string
}

export default function CxqAuthSocialButtons({
  onGoogle,
  disabled,
  googleLabel = 'Continue with Google',
}: CxqAuthSocialButtonsProps) {
  return (
    <div className="auth-oauth">
      <button
        type="button"
        className="auth-oauth-btn"
        onClick={() => void onGoogle()}
        disabled={disabled}
      >
        <span className="oauth-logo google">G</span>
        {googleLabel}
      </button>
      <button type="button" className="auth-oauth-btn" disabled={disabled} title="Coming soon">
        <span className="oauth-logo apple" aria-hidden />
        Continue with Apple
      </button>
    </div>
  )
}

