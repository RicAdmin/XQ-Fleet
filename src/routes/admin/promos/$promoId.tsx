import { useState } from 'react'

import { createFileRoute, notFound } from '@tanstack/react-router'

import { PromoRedemptionList } from '#/components/admin/PromoRedemptionList'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { requireFullAdminAccess } from '#/lib/route-guards'
import { deactivatePromo, getPromoDetail } from '#/lib/promo-functions'
import type { AdminPromoDetail } from '#/lib/promo-functions'
import type { Promo } from '#/db/schema'

export const Route = createFileRoute('/admin/promos/$promoId')({
  beforeLoad: async ({ params, cause }) => {
    const { session } = await requireFullAdminAccess({ cause })
    if (!session) return
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
  const { redemptions } = detail

  const [promo, setPromo] = useState<Promo>(detail.promo)
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  async function handleDeactivateConfirm() {
    setDeactivateError(null)
    setIsDeactivating(true)
    try {
      await deactivatePromo({ data: { id: promo.id } })
      setPromo((prev) => ({ ...prev, isActive: false }))
      setConfirmingDeactivate(false)
    } catch (err) {
      setDeactivateError(err instanceof Error ? err.message : 'Unable to deactivate promo.')
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <AdminSidebarShell user={session.user} pageTitle={`Promo · ${promo.code}`}>
      <PageHeader
        variant="detail"
        backLink={{ to: '/admin/promos', label: 'All promos' }}
        title={promo.code}
        description={
          <>
            <span>
              {promo.discountType === 'percent'
                ? `${promo.discountValueSen}% off`
                : `${formatMYR(promo.discountValueSen)} off`}
            </span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <span className={promo.isActive ? 'text-emerald-700' : 'text-[var(--sea-ink-soft)]'}>
              {promo.isActive ? 'Active' : 'Inactive'}
            </span>
          </>
        }
        actions={
          promo.isActive && (
            <button
              type="button"
              className="button-danger"
              onClick={() => setConfirmingDeactivate(true)}
            >
              Deactivate
            </button>
          )
        }
      />

      <Card className="mb-5">
        <CardHeader>
          <CardDescription className="island-kicker">Configuration</CardDescription>
          <CardTitle className="sr-only">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
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
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription className="island-kicker">
            Redemptions ({redemptions.length})
          </CardDescription>
          <CardTitle className="sr-only">Redemptions</CardTitle>
        </CardHeader>
        <CardContent>
          <PromoRedemptionList redemptions={redemptions} />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={confirmingDeactivate}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingDeactivate(false)
            setDeactivateError(null)
          }
        }}
        title={`Deactivate ${promo.code}?`}
        description={
          <>
            It can no longer be used to redeem discounts. Existing redemptions are
            preserved.
            {deactivateError ? (
              <span className="mt-2 block text-[var(--error)]">{deactivateError}</span>
            ) : null}
          </>
        }
        confirmLabel="Confirm deactivate"
        variant="destructive"
        confirming={isDeactivating}
        onConfirm={handleDeactivateConfirm}
      />
    </AdminSidebarShell>
  )
}
