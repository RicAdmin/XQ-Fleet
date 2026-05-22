type KpiSkeletonProps = {
  cards?: number
  className?: string
}

export function KpiSkeleton({ cards = 5, className }: KpiSkeletonProps) {
  return (
    <div
      className={['kpi-skeleton-grid', className].filter(Boolean).join(' ')}
      role="status"
      aria-label="Loading KPIs"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="kpi-skeleton-card">
          <span className="kpi-skeleton-label" />
          <span className="kpi-skeleton-value" />
          <span className="kpi-skeleton-delta" />
        </div>
      ))}
    </div>
  )
}
