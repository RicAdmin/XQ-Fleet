import { useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { PageHeader } from '#/components/ui/PageHeader'
import { CsvDownloadButton } from '#/components/ui/CsvDownloadButton'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { LoadingSpinner } from '#/components/ui/LoadingSpinner'
import { csvFilename } from '#/lib/csv-export'
import { requireFullAdminAccess } from '#/lib/route-guards'
import {
  getEarnedReadyForPayout,
  markPayoutBatchPaid,
  type AdminEarnedGroup,
} from '#/lib/affiliate-functions'

export const Route = createFileRoute('/admin/affiliates/payouts')({
  beforeLoad: async () => {
    const { session } = await requireFullAdminAccess()
    const groups = await getEarnedReadyForPayout({ data: {} })
    return { session, groups }
  },
  component: AdminAffiliatePayoutsPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load payouts"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

function formatRM(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { maximumFractionDigits: 2 })}`
}

function AdminAffiliatePayoutsPage() {
  const ctx = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    groups: AdminEarnedGroup[]
  }
  const [groups, setGroups] = useState(ctx.groups)
  const [working, setWorking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleMarkPaid(group: AdminEarnedGroup) {
    const reference = window.prompt(
      `Pay out RM ${(group.pendingPayoutSen / 100).toFixed(2)} across ${group.attributionCount} attribution(s) to ${group.affiliateName}?\n\nOptionally include a payment reference (e.g. bank transaction ID).`,
      '',
    )
    if (reference === null) return // cancelled
    setWorking(group.affiliateId)
    setError(null)
    try {
      await markPayoutBatchPaid({
        data: {
          affiliateId: group.affiliateId,
          attributionIds: group.attributions.map((a) => a.id),
          reference: reference.trim() || undefined,
        },
      })
      setGroups((prev) => prev.filter((g) => g.affiliateId !== group.affiliateId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payout.')
    } finally {
      setWorking(null)
    }
  }

  const totalDueSen = groups.reduce((acc, g) => acc + g.pendingPayoutSen, 0)
  const totalAttributions = groups.reduce((acc, g) => acc + g.attributionCount, 0)

  return (
    <AdminSidebarShell user={ctx.session.user} pageTitle="Affiliate payouts">
      <Link to="/admin/affiliates" className="ui-back-link">
        <ChevronLeft size={14} /> All affiliates
      </Link>

      <PageHeader
        title="Payouts ready"
        description={
          <>
            {totalAttributions.toLocaleString()} earned attribution(s) ·{' '}
            <strong>{formatRM(totalDueSen)}</strong> outstanding.
          </>
        }
        actions={
          <CsvDownloadButton
            filename={csvFilename('affiliate-payouts-ready')}
            rows={groups.flatMap((g) =>
              g.attributions.map((a) => ({
                affiliate_id: g.affiliateId,
                affiliate_name: g.affiliateName,
                affiliate_code: g.affiliateCode,
                attribution_id: a.id,
                rental_id: a.rentalId,
                commission_rm: (a.commissionSen / 100).toFixed(2),
                booked_at: a.bookedAt.toISOString(),
              })),
            )}
            label="Export full breakdown"
          />
        }
      />

      {error && (
        <ErrorPanel
          title="Failed to record payout"
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {groups.length === 0 ? (
        <div className="ui-empty py-12">
          Nothing to pay out — all earned attributions have been settled.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.affiliateId} className="workspace-panel island-shell p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="ui-page-title text-base">
                    <Link
                      to="/admin/affiliates/$affiliateId"
                      params={{ affiliateId: g.affiliateId }}
                      className="plate-link"
                    >
                      {g.affiliateName}
                    </Link>{' '}
                    <span className="font-mono text-xs text-[var(--sea-ink-soft)]">
                      /r/{g.affiliateCode}
                    </span>
                  </h3>
                  <p className="text-sm text-[var(--sea-ink-soft)]">
                    {g.attributionCount} attribution(s) ·{' '}
                    <strong>{formatRM(g.pendingPayoutSen)}</strong> to pay
                  </p>
                </div>
                <button
                  type="button"
                  className="button-primary inline-flex items-center gap-1.5"
                  onClick={() => void handleMarkPaid(g)}
                  disabled={working === g.affiliateId}
                >
                  {working === g.affiliateId ? (
                    <>
                      <LoadingSpinner size={14} aria-hidden />
                      Recording…
                    </>
                  ) : (
                    'Mark as paid'
                  )}
                </button>
              </div>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>Booked</th>
                      <th>Rental</th>
                      <th className="text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.attributions.map((a) => (
                      <tr key={a.id}>
                        <td className="text-sm">
                          {new Date(a.bookedAt).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="text-xs font-mono">
                          {a.rentalId.slice(0, 8)}…
                        </td>
                        <td className="text-sm text-right">
                          {formatRM(a.commissionSen)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminSidebarShell>
  )
}
