export const PAYMENT_METHODS = [
  { id: 'visa', label: 'Visa', src: '/images/payments/visalogo.png' },
  { id: 'mastercard', label: 'Mastercard', src: '/images/payments/masterlogo.jpeg' },
  { id: 'unionpay', label: 'UnionPay', src: '/images/payments/union.png' },
  { id: 'fpx', label: 'FPX Online Banking', src: '/images/payments/FPX-Logo.jpg' },
  { id: 'duitnow', label: 'DuitNow', src: '/images/payments/duitnow.png', chipClass: 'pay-chip--duitnow' },
  { id: 'tng', label: "Touch 'n Go eWallet", src: '/images/payments/TngGO.jpg' },
] as const

export function PaymentMethodIcons({
  className = 'payment-method-icons',
  chipClassName = 'payment-method-chip',
}: {
  className?: string
  chipClassName?: string
}) {
  return (
    <div className={className} aria-label="Accepted payment methods via iPay88">
      {PAYMENT_METHODS.map(({ id, label, src, chipClass }) => (
        <div
          key={id}
          className={[chipClassName, chipClass].filter(Boolean).join(' ')}
          title={label}
        >
          <img src={src} alt={label} loading="lazy" decoding="async" />
        </div>
      ))}
    </div>
  )
}
