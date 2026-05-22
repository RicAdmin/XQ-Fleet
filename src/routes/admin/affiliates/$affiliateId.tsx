import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ChevronLeft, Copy } from 'lucide-react'

import { MiniTimeSeriesChart } from '#/components/admin/MiniTimeSeriesChart'
import type { MiniTimeSeriesPoint } from '#/components/admin/MiniTimeSeriesChart'
import { StatusBadge } from '#/components/ui/StatusBadge'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { CsvDownloadButton } from '#/components/ui/CsvDownloadButton'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { csvFilename } from '#/lib/csv-export'
import { requireFullAdminAccess } from '#/lib/route-guards'
import {
  getAffiliateDetail,
  type AdminAffiliateDetail,
} from '#/lib/affiliate-functions'

export const Route = createFileRoute('/admin/affiliates/$affiliateId')({
  beforeLoad: async ({ params }) => {
    await requireFullAdminAccess()
    const detail = await getAffiliateDetail({ data: { id: params.affiliateId } })
    if (!detail) throw notFound()
    return { detail }
  },
  component: AdminAffiliateDetailPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load affiliate"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

function formatRM(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { maximumFractionDigits: 2 })}`
}

function AdminAffiliateDetailPage() {
  const { session, detail } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    detail: AdminAffiliateDetail
  }
  const { affiliate, monthly, attributions, payouts, totals } = detail

  const chartData: MiniTimeSeriesPoint[] = monthly.map((m) => {
    const [year, month] = m.monthYmd.split('-')
    const monthIdx = parseInt(month, 10) - 1
    const monthName = new Date(Number(year), monthIdx, 1).toLocaleString('en-MY', {
      month: 'short',
    })
    return {
      label: monthName,
      value: m.commissionSen / 100,
    }
  })

  const shareLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${affiliate.code}`

  return (
    <AdminSidebarShell user={session.user} pageTitle={`Affiliate · ${affiliate.name}`}>
      <Link to="/admin/affiliates" className="ui-back-link">
        <ChevronLeft size={14} /> All affiliates
      </Link>

      <div className="ui-page-head mb-5">
        <div>
          <h2 className="ui-page-title">{affiliate.name}</h2>
          <p className="ui-page-desc">
            {affiliate.email} · <StatusBadge status={affiliate.status} size="sm" />
          </p>
        </div>
      </div>

      <div className="kpi-grid mb-5">
        <div className="kpi-card">
          <p className="kpi-card-label">Clicks (all-time)</p>
          <p className="kpi-card-value">{totals.clicks.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card-label">Attributed bookings</p>
          <p className="kpi-card-value">{totals.bookings.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card-label">Pending</p>
          <p className="kpi-card-value">{formatRM(totals.pendingSen)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card-label">Earned</p>
          <p className="kpi-card-value">{formatRM(totals.earnedSen)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card-label">Paid</p>
          <p className="kpi-card-value">{formatRM(totals.paidSen)}</p>
        </div>
      </div>

      <section className="workspace-panel island-shell mb-5 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="island-kicker">Share link</p>
        </div>
        <div className="flex items-center gap-2">
          <code className="ui-code-block">{shareLink}</code>
          <button
            type="button"
            className="button-secondary inline-flex items-center gap-1.5"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                void navigator.clipboard.writeText(shareLink)
              }
            }}
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      </section>

      <section className="workspace-panel island-shell mb-5 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="island-kicker">Monthly commission (last 12 months)</p>
        </div>
        <MiniTimeSeriesChart
          data={chartData}
          barLabel="Commission per month (RM)"
          lineLabel="Cumulative (RM)"
          title="Monthly affiliate commission and cumulative trend"
          formatY={(n) => `RM ${n.toFixed(0)}`}
        />
      </section>

      <section className="workspace-panel island-shell mb-5 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="island-kicker">Attributions ({attributions.length})</p>
          <CsvDownloadButton
            filename={csvFilename(`affiliate-${affiliate.code}-attributions`)}
            rows={attributions.map((a) => ({
              attribution_id: a.id,
              rental_id: a.rentalId,
              status: a.status,
              booked_at: a.bookedAt.toISOString(),
              paid_at: a.paidAt ? a.paidAt.toISOString() : '',
              commission_rm: (a.commissionSen / 100).toFixed(2),
              customer_name: a.customerName ?? '',
            }))}
            label="Export CSV"
          />
        </div>
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Booked</th>
                <th>Customer</th>
                <th>Status</th>
                <th className="text-right">Commission</th>
                <th>Paid at</th>
              </tr>
            </thead>
            <tbody>
              {attributions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-sm text-[var(--sea-ink-soft)] py-6">
                    No attributions yet.
                  </td>
                </tr>
              ) : (
                attributions.map((a) => (
                  <tr key={a.id}>
                    <td className="text-sm">
                      {new Date(a.bookedAt).toLocaleString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-sm">{a.customerName ?? '—'}</td>
                    <td>
                      <StatusBadge status={a.status} size="sm" />
                    </td>
                    <td className="text-sm text-right">{formatRM(a.commissionSen)}</td>
                    <td className="text-sm">
                      {a.paidAt
                        ? new Date(a.paidAt).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workspace-panel island-shell p-4">
        <p className="island-kicker mb-3">Payouts ({payouts.length})</p>
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Paid at</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Attributions</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-sm text-[var(--sea-ink-soft)] py-6">
                    No payouts recorded.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="text-sm">
                      {new Date(p.paidAt).toLocaleString('en-MY')}
                    </td>
                    <td className="text-sm text-right">{formatRM(p.amountSen)}</td>
                    <td className="text-sm text-right">{p.attributionCount}</td>
                    <td className="text-sm font-mono">{p.reference ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminSidebarShell>
  )
}
