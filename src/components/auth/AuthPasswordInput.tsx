import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type AuthPasswordInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: 'new-password' | 'current-password'
  placeholder?: string
  minLength?: number
  required?: boolean
  disabled?: boolean
  showLabel: string
  hideLabel: string
}

export function AuthPasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete = 'new-password',
  placeholder,
  minLength,
  required = true,
  disabled = false,
  showLabel,
  hideLabel,
}: AuthPasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={minLength}
          required={required}
          disabled={disabled}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
    </div>
  )
}
