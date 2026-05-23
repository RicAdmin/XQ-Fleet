type BrandNameProps = {
  className?: string
  accentClassName?: string
}

/** Wordmark: XQCar with accent on “XQ”. */
export function BrandName({ className = '', accentClassName = '' }: BrandNameProps) {
  return (
    <span
      className={`brand-name ${className}`.trim()}
      style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '-0.01em' }}
    >
      <span className={`brand-name-accent ${accentClassName}`.trim()} style={{ color: 'var(--brand-leaf)' }}>
        XQ
      </span>
      <span className="brand-name-rest">Car</span>
    </span>
  )
}
