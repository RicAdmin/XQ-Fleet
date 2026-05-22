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
import { createPromo, updatePromo } from '#/lib/promo-functions'
import type { AdminPromoListRow } from '#/lib/promo-functions'

type PromoFormSheetProps = {
  open: boolean
  onClose: () => void
  initial?: AdminPromoListRow | null
  onSaved?: () => void
}

const CAR_CATEGORIES = ['economy', 'mpv', 'suv', 'other'] as const

export function PromoFormSheet({ open, onClose, initial, onSaved }: PromoFormSheetProps) {
  const isEdit = !!initial
  const [code, setCode] = useState(initial?.code ?? '')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(
    initial?.discountType ?? 'percent',
  )
  const [discountValueSen, setDiscountValueSen] = useState(
    String(initial?.discountValueSen ?? 10),
  )
  const [maxRedemptions, setMaxRedemptions] = useState(
    initial?.maxRedemptions != null ? String(initial.maxRedemptions) : '',
  )
  const [perUserLimit, setPerUserLimit] = useState('')
  const [minBookingRm, setMinBookingRm] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [startsAt, setStartsAt] = useState(
    initial?.startsAt ? new Date(initial.startsAt).toISOString().slice(0, 16) : '',
  )
  const [endsAt, setEndsAt] = useState(
    initial?.endsAt ? new Date(initial.endsAt).toISOString().slice(0, 16) : '',
  )
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [stackableWithAffiliate, setStackableWithAffiliate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function liveValidate(): string | null {
    const trimmed = code.trim().toUpperCase()
    if (!/^[A-Z0-9_-]{3,32}$/.test(trimmed)) {
      return 'Code must be 3–32 chars; A–Z, 0–9, -, _ only.'
    }
    const v = Number(discountValueSen)
    if (discountType === 'percent') {
      if (!Number.isInteger(v) || v < 0 || v > 100)
        return 'Percent discount must be an integer 0–100.'
    } else {
      if (!Number.isInteger(v) || v <= 0) return 'Fixed discount must be a positive integer (sen).'
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      return 'End date must be after start date.'
    }
    if (maxRedemptions && Number(maxRedemptions) <= 0) {
      return 'Max redemptions must be positive.'
    }
    if (perUserLimit && Number(perUserLimit) <= 0) {
      return 'Per-user limit must be positive.'
    }
    if (minBookingRm && Number(minBookingRm) < 0) {
      return 'Minimum booking must be 0 or more.'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = liveValidate()
    if (validation) {
      setError(validation)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValueSen: Number(discountValueSen),
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        perUserLimit: perUserLimit ? Number(perUserLimit) : null,
        minBookingAmountSen: minBookingRm ? Math.round(Number(minBookingRm) * 100) : 0,
        applicableCarCategories: categories as Array<typeof CAR_CATEGORIES[number]>,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        isActive,
        stackableWithAffiliate,
      }
      if (isEdit && initial) {
        await updatePromo({ data: { id: initial.id, patch: payload } })
      } else {
        await createPromo({ data: payload })
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save promo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit promo' : 'New promo'}</SheetTitle>
          <SheetDescription>
            Use a short, memorable code (e.g. WELCOME10).
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="admin-form-sheet">
          <div>
            <label className="field-label" htmlFor="promo-code">Code *</label>
            <input
              id="promo-code"
              className="field-input font-mono uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              disabled={isEdit}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Discount type</label>
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
              <label className="field-label">
                {discountType === 'percent' ? 'Percent (0–100)' : 'Amount (sen)'}
              </label>
              <input
                type="number"
                className="field-input"
                value={discountValueSen}
                onChange={(e) => setDiscountValueSen(e.target.value)}
                min={0}
                max={discountType === 'percent' ? 100 : undefined}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Max redemptions</label>
              <input
                type="number"
                className="field-input"
                placeholder="Unlimited"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                min={1}
              />
            </div>
            <div>
              <label className="field-label">Per-user limit</label>
              <input
                type="number"
                className="field-input"
                placeholder="Unlimited"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Minimum booking (RM)</label>
            <input
              type="number"
              step="0.01"
              className="field-input"
              value={minBookingRm}
              onChange={(e) => setMinBookingRm(e.target.value)}
              min={0}
            />
          </div>

          <div>
            <label className="field-label">Applicable car categories</label>
            <div className="flex flex-wrap gap-2">
              {CAR_CATEGORIES.map((c) => (
                <label key={c} className="inline-flex items-center gap-1 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={categories.includes(c)}
                    onChange={(e) =>
                      setCategories((prev) =>
                        e.target.checked ? [...prev, c] : prev.filter((x) => x !== c),
                      )
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)] mt-1">
              Leave none selected to apply to all categories.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Starts at</label>
              <input
                type="datetime-local"
                className="field-input"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Ends at</label>
              <input
                type="datetime-local"
                className="field-input"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={stackableWithAffiliate}
                onChange={(e) => setStackableWithAffiliate(e.target.checked)}
              />
              Stackable with affiliate commissions
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <SheetFooter className="-mx-4">
            <div className="flex items-center justify-end gap-2 px-4">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button-primary inline-flex items-center gap-1.5" disabled={submitting}>
                {submitting && <LoadingSpinner size={12} />}
                {isEdit ? 'Save changes' : 'Create promo'}
              </button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
