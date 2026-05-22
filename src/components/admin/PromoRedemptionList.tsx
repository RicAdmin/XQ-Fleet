import type { AdminPromoRedemptionRow } from '#/lib/promo-functions'

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`
}

type PromoRedemptionListProps = {
  redemptions: ReadonlyArray<AdminPromoRedemptionRow>
}

export function PromoRedemptionList({ redemptions }: PromoRedemptionListProps) {
  if (redemptions.length === 0) {
    return <p className="text-sm text-[var(--sea-ink-soft)]">No redemptions yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="cars-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Customer</th>
            <th>Rental</th>
            <th className="text-right">Discount</th>
          </tr>
        </thead>
        <tbody>
          {redemptions.map((r) => (
            <tr key={r.id}>
              <td className="text-xs">{new Date(r.redeemedAt).toLocaleString('en-MY')}</td>
              <td className="text-sm">
                <div>{r.customerFullName ?? r.customerEmail ?? '—'}</div>
                <div className="text-xs text-[var(--sea-ink-soft)]">
                  {r.customerEmail ?? ''}
                </div>
              </td>
              <td className="text-xs font-mono break-all">{r.rentalId}</td>
              <td className="text-right font-semibold">{formatMYR(r.amountDiscountedSen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
