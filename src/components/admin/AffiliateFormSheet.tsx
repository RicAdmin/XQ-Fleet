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
import {
  createAffiliate,
  updateAffiliate,
} from '#/lib/affiliate-functions'
import type { AdminAffiliateListRow } from '#/lib/affiliate-functions'

type AffiliateFormSheetProps = {
  open: boolean
  onClose: () => void
  initial?: AdminAffiliateListRow | null
  onSaved?: () => void
}

export function AffiliateFormSheet({
  open,
  onClose,
  initial,
  onSaved,
}: AffiliateFormSheetProps) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<'individual' | 'company'>(
    initial?.type ?? 'individual',
  )
  const [email, setEmail] = useState(initial?.email ?? '')
  const [code, setCode] = useState(initial?.code ?? '')
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>(
    initial?.commissionType ?? 'percent',
  )
  // The form takes %/RM for percent/fixed but the API expects whole percent
  // for percent or sen for fixed — same convention as promos.
  const [commissionValueDisplay, setCommissionValueDisplay] = useState(
    initial
      ? initial.commissionType === 'fixed'
        ? String(initial.commissionValueSen / 100)
        : String(initial.commissionValueSen)
      : '10',
  )
  const [status, setStatus] = useState<'active' | 'paused' | 'archived'>(
    initial?.status ?? 'active',
  )
  const [payoutMethod, setPayoutMethod] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function liveValidate(): string | null {
    if (!name.trim()) return 'Name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'A valid email is required.'
    }
    if (!/^[a-z0-9_-]{3,32}$/.test(code.trim())) {
      return 'Code must be 3–32 chars; a–z, 0–9, -, _ only.'
    }
    const v = Number(commissionValueDisplay)
    if (!Number.isFinite(v) || v < 0) {
      return 'Commission value must be ≥ 0.'
    }
    if (commissionType === 'percent') {
      if (!Number.isInteger(v) || v < 1 || v > 100) {
        return 'Commission % must be an integer 1–100.'
      }
    } else {
      if (v <= 0) return 'Fixed commission must be > RM 0.'
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
      const numeric = Number(commissionValueDisplay)
      const commissionValueSen =
        commissionType === 'fixed' ? Math.round(numeric * 100) : Math.round(numeric)

      const payload = {
        name: name.trim(),
        type,
        email: email.trim().toLowerCase(),
        code: code.trim().toLowerCase(),
        commissionType,
        commissionValueSen,
        status,
        payoutMethod: payoutMethod.trim() || undefined,
      }

      if (isEdit && initial) {
        await updateAffiliate({ data: { id: initial.id, patch: payload } })
      } else {
        await createAffiliate({ data: payload })
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save affiliate.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit affiliate' : 'New affiliate'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update programme member details. Code changes apply to new clicks only.'
              : 'Add a new affiliate. They will receive a shareable /r/code link after save.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="field-label" htmlFor="aff-name">
              Name
            </label>
            <input
              id="aff-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="field-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="aff-type">
                Type
              </label>
              <select
                id="aff-type"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as 'individual' | 'company')
                }
                className="field-input"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="aff-status">
                Status
              </label>
              <select
                id="aff-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'active' | 'paused' | 'archived')
                }
                className="field-input"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="aff-email">
              Email
            </label>
            <input
              id="aff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field-input"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="aff-code">
              Code (used in /r/code links)
            </label>
            <input
              id="aff-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              required
              placeholder="e.g. jane-doe"
              className="field-input font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="aff-comm-type">
                Commission type
              </label>
              <select
                id="aff-comm-type"
                value={commissionType}
                onChange={(e) =>
                  setCommissionType(e.target.value as 'percent' | 'fixed')
                }
                className="field-input"
              >
                <option value="percent">Percent of paid total</option>
                <option value="fixed">Fixed RM per booking</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="aff-comm-value">
                {commissionType === 'percent' ? 'Percent (1-100)' : 'RM per booking'}
              </label>
              <input
                id="aff-comm-value"
                type="number"
                min="0"
                step={commissionType === 'percent' ? '1' : '0.01'}
                value={commissionValueDisplay}
                onChange={(e) => setCommissionValueDisplay(e.target.value)}
                required
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="aff-payout">
              Payout method (optional)
            </label>
            <input
              id="aff-payout"
              type="text"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              placeholder="e.g. Maybank 1234567890"
              className="field-input"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <SheetFooter>
            <button
              type="button"
              className="button-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary inline-flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoadingSpinner size={14} aria-hidden />
                  Saving…
                </>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Create affiliate'
              )}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
