import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'

type LoadingSpinnerProps = {
  size?: number
  className?: string
  label?: string
} & Pick<ComponentProps<'svg'>, 'strokeWidth'>

export function LoadingSpinner({
  size = 16,
  className = '',
  label,
  strokeWidth = 2,
}: LoadingSpinnerProps) {
  return (
    <Loader2
      size={size}
      strokeWidth={strokeWidth}
      className={['animate-spin', className].filter(Boolean).join(' ')}
      aria-hidden={!label}
      aria-label={label}
    />
  )
}
