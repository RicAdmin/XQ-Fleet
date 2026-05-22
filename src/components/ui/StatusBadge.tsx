const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  'payment-pending': 'Pmt. Pending',
  rented: 'Rented',
  maintenance: 'Maintenance',
  damaged: 'Damaged',
  retired: 'Retired',
  pending: 'Pending',
  active: 'Active',
  closed: 'Closed',
  cancelled: 'Cancelled',
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
  successful: 'Successful',
  failed: 'Failed',
  voided: 'Voided',
  earned: 'Earned',
  paused: 'Paused',
  archived: 'Archived',
  inactive: 'Inactive',
  expired: 'Expired',
  exhausted: 'Exhausted',
  'walk-in': 'Walk-in',
  booking: 'Booking',
}

type StatusBadgeProps = {
  status: string
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const cls = [
    'status-badge',
    `status-badge--${status}`,
    size === 'sm' ? 'status-badge--sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={cls}>{STATUS_LABELS[status] ?? status}</span>
}
