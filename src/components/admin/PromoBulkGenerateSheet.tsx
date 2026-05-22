import { useState } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { LoadingSpinner } from '#/components/ui/LoadingSpinner'
import { bulkGeneratePromos } from '#/lib/promo-functions'
import { downloadCsv } from '#/lib/csv-export'

type PromoBulkGenerateSheetProps = {
  open: boolean
  onClose: () => void
  onGenerated?: () => void
}

export function PromoBulkGenerateSheet({
  open,
  onClose,
  onGenerated,
}: PromoBulkGenerateSheetProps) {
  const [prefix, setPrefix] = useState('PROMO')
  const [count, setCount] = useState('10')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValueSen, setDiscountValueSen] = useState('10')
  const [maxRedemptions, setMaxRedemptions] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await bulkGeneratePromos({
        data: {
          prefix: prefix.toUpperCase(),
          count: Number(count),
          template: {
            discountType,
            discountValueSen: Number(discountValueSen),
            maxRedemptions: Number(maxRedemptions) || null,
            perUserLimit: 1,
            minBookingAmountSen: 0,
            applicableCarCategories: [],
            isActive: true,
            stackableWithAffiliate: false,
          },
        },
      })
      downloadCsv(
        `promos-bulk-${prefix}-${new Date().toISOString().split('T')[0]}.csv`,
        result.generated.map((g) => ({ code: g.code, id: g.id })),
      )
      onGenerated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk generate failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Bulk generate promo codes</SheetTitle>
          <SheetDescription>
            Codes are saved immediately and exported as a CSV to share.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="admin-form-sheet">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Prefix</label>
              <input
                className="field-input font-mono uppercase"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div>
              <label className="field-label">Count</label>
              <input
                type="number"
                className="field-input"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min={1}
                max={500}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Type</label>
              <select
                className="field-input"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed (sen)</option>
              </select>
            </div>
            <div>
              <label className="field-label">Value</label>
              <input
                type="number"
                className="field-input"
                value={discountValueSen}
                onChange={(e) => setDiscountValueSen(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label">Max redemptions per code (blank = unlimited)</label>
            <input
              type="number"
              className="field-input"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <SheetFooter className="-mx-4">
            <div className="flex items-center justify-end gap-2 px-4">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button-primary inline-flex items-center gap-1.5" disabled={submitting}>
                {submitting && <LoadingSpinner size={12} />}
                Generate
              </button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
