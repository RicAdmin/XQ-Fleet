import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import { PromoRedemptionList } from '#/components/admin/PromoRedemptionList'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { requireFullAdminAccess } from '#/lib/route-guards'
import { deactivatePromo, getPromoDetail } from '#/lib/promo-functions'
import type { AdminPromoDetail } from '#/lib/promo-functions'

export const Route = createFileRoute('/admin/promos/$promoId')({
  beforeLoad: async ({ params }) => {
    await requireFullAdminAccess()
    const detail = await getPromoDetail({ data: { id: params.promoId } })
    if (!detail) throw notFound()
    return { detail }
  },
  component: AdminPromoDetailPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load promo"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

function formatDate(d: Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-MY')
}

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`
}

function AdminPromoDetailPage() {
  const { session, detail } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    detail: AdminPromoDetail
  }
  const { promo, redemptions } = detail

  async function handleDeactivate() {
    if (!confirm(`Deactivate promo ${promo.code}? It can no longer be used.`)) return
    await deactivatePromo({ data: { id: promo.id } })
    window.location.reload()
  }

  return (
    <AdminSidebarShell user={session.user} pageTitle={`Promo · ${promo.code}`}>
      <Link
        to="/admin/promos"
        className="inline-flex items-center gap-1 text-sm text-[var(--lagoon-deep)] hover:underline mb-3"
      >
        <ChevronLeft size={14} /> All promos
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--sea-ink)] font-mono">{promo.code}</h2>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            {promo.discountType === 'percent'
              ? `${promo.discountValueSen}% off`
              : `${formatMYR(promo.discountValueSen)} off`}{' '}
            · {promo.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
        {promo.isActive && (
          <button
            type="button"
            className="button-secondary"
            onClick={handleDeactivate}
          >
            Deactivate
          </button>
        )}
      </div>

      <section className="workspace-panel island-shell mb-5 p-4">
        <p className="island-kicker mb-3">Configuration</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-[var(--sea-ink-soft)]">Max redemptions</dt>
            <dd>{promo.maxRedemptions ?? 'Unlimited'}</dd>
          </div>
          <div>
            <dt className="text-[var(--sea-ink-soft)]">Used</dt>
            <dd>{promo.redemptionsUsed}</dd>
          </div>
          <div>
            <dt className="text-[var(--sea-ink-soft)]">Per-user limit</dt>
            <dd>{promo.perUserLimit ?? 'Unlimited'}</dd>
          </div>
          <div>
            <dt className="text-[var(--sea-ink-soft)]">Min booking</dt>
            <dd>{formatMYR(promo.minBookingAmountSen)}</dd>
          </div>
          <div>
            <dt className="text-[var(--sea-ink-soft)]">Starts at</dt>
            <dd>{formatDate(promo.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-[var(--sea-ink-soft)]">Ends at</dt>
            <dd>{formatDate(promo.endsAt)}</dd>
          </div>
          <div>
            <dt className="text-[var(--sea-ink-soft)]">Categories</dt>
            <dd>
              {promo.applicableCarCategories.length === 0
                ? 'All'
                : promo.applicableCarCategories.join(', ')}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--sea-ink-soft)]">Stackable w/ affiliate</dt>
            <dd>{promo.stackableWithAffiliate ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </section>

      <section className="workspace-panel island-shell p-4">
        <p className="island-kicker mb-3">
          Redemptions ({redemptions.length})
        </p>
        <PromoRedemptionList redemptions={redemptions} />
      </section>
    </AdminSidebarShell>
  )
}
