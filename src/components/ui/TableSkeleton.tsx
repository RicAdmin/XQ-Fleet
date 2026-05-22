type TableSkeletonProps = {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={['table-skeleton w-full', className].filter(Boolean).join(' ')}
      role="status"
      aria-label="Loading table"
    >
      <div className="table-skeleton-head">
        {Array.from({ length: columns }).map((_, i) => (
          <span key={i} className="table-skeleton-head-cell" />
        ))}
      </div>
      <div className="table-skeleton-body">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="table-skeleton-row">
            {Array.from({ length: columns }).map((_, c) => (
              <span key={c} className="table-skeleton-cell" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
