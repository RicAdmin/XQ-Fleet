interface AdminTablePaginationProps {
  page: number
  totalPages: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
}

export function AdminTablePagination({
  page,
  totalPages,
  total,
  loading = false,
  onPageChange,
}: AdminTablePaginationProps) {
  return (
    <div className="admin-pagination">
      <span>
        Page {page} of {totalPages} · {total.toLocaleString()} total
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="button-secondary"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="button-secondary"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
