import { createFileRoute, redirect } from '@tanstack/react-router'
import { CreditCard, Info, Save } from 'lucide-react'
import { useState } from 'react'

import type { PaymentMode } from '#/db/schema'
import type { PaymentSettingsRow } from '#/lib/settings-functions'
import { getPaymentSettings, updatePaymentSettings } from '#/lib/settings-functions'

export const Route = createFileRoute('/admin/settings/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } }
    }
    if (session.user.role !== 'owner') {
      throw redirect({ to: '/admin/cars' })
    }
    const settings = await getPaymentSettings()
    return { settings }
  },
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const { settings } = Route.useRouteContext()

  const [paymentMode, setPaymentMode] = useState<PaymentMode>(settings.paymentMode)
  const [depositAmountRM, setDepositAmountRM] = useState(
    settings.depositAmountSen > 0 ? (settings.depositAmountSen / 100).toFixed(2) : '',
  )
  const [sandboxMode, setSandboxMode] = useState(settings.sandboxMode)
  const [enabled, setEnabled] = useState(settings.enabled)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const merchantCode = typeof window === 'undefined' ? '' : '' // displayed from env — not exposed to browser
  const hasCredentials = true // credentials are in env vars, we just indicate configured status

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const depositSen = paymentMode === 'deposit' ? Math.round(parseFloat(depositAmountRM || '0') * 100) : 0
      await updatePaymentSettings({
        data: {
          paymentMode,
          depositAmountSen: depositSen,
          sandboxMode,
          enabled,
        },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="hub-layout">
      <div className="hub-content">
        <div className="hub-page-header">
          <div className="hub-page-title-row">
            <CreditCard size={22} className="hub-page-icon" />
            <h1 className="hub-page-title">Settings</h1>
          </div>
        </div>

        <form onSubmit={handleSave} className="settings-form">
          {/* Payment gateway section */}
          <div className="settings-section island-shell">
            <h2 className="settings-section-title">iPay88 Payment Gateway</h2>

            {/* Credentials info */}
            <div className="settings-info-banner">
              <Info size={15} />
              <span>
                Merchant credentials are configured via environment variables (
                <code>IPAY88_MERCHANT_CODE</code>, <code>IPAY88_MERCHANT_KEY</code>
                ).
              </span>
            </div>

            {/* Sandbox toggle */}
            <div className="settings-field-row">
              <div className="settings-field-label-group">
                <label className="settings-label" htmlFor="sandbox-mode">
                  Sandbox mode
                </label>
                <p className="settings-label-hint">
                  Use iPay88 test credentials. Disable for live payments.
                </p>
              </div>
              <button
                type="button"
                id="sandbox-mode"
                role="switch"
                aria-checked={sandboxMode}
                onClick={() => setSandboxMode((v) => !v)}
                className={`settings-toggle ${sandboxMode ? 'settings-toggle--on' : ''}`}
              >
                <span className="settings-toggle-thumb" />
              </button>
            </div>

            {/* Enable/disable online payment */}
            <div className="settings-field-row">
              <div className="settings-field-label-group">
                <label className="settings-label" htmlFor="payment-enabled">
                  Accept online payments
                </label>
                <p className="settings-label-hint">
                  When off, customers will not see a Pay Now button.
                </p>
              </div>
              <button
                type="button"
                id="payment-enabled"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((v) => !v)}
                className={`settings-toggle ${enabled ? 'settings-toggle--on' : ''}`}
              >
                <span className="settings-toggle-thumb" />
              </button>
            </div>
          </div>

          {/* Payment mode section */}
          <div className="settings-section island-shell">
            <h2 className="settings-section-title">Payment Collection</h2>

            {/* Full vs deposit */}
            <div className="settings-field-col">
              <label className="settings-label">Charge amount</label>
              <div className="settings-radio-group">
                <label className="settings-radio-label">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="full"
                    checked={paymentMode === 'full'}
                    onChange={() => setPaymentMode('full')}
                    className="settings-radio"
                  />
                  <span>Full rental amount</span>
                </label>
                <label className="settings-radio-label">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="deposit"
                    checked={paymentMode === 'deposit'}
                    onChange={() => setPaymentMode('deposit')}
                    className="settings-radio"
                  />
                  <span>Deposit only</span>
                </label>
              </div>
            </div>

            {/* Deposit amount (shown only in deposit mode) */}
            {paymentMode === 'deposit' && (
              <div className="settings-field-col">
                <label className="settings-label" htmlFor="deposit-amount">
                  Deposit amount (RM)
                </label>
                <div className="settings-input-prefix-group">
                  <span className="settings-input-prefix">RM</span>
                  <input
                    id="deposit-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={depositAmountRM}
                    onChange={(e) => setDepositAmountRM(e.target.value)}
                    placeholder="0.00"
                    className="settings-input"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          {error && <p className="settings-error">{error}</p>}
          {saved && <p className="settings-saved">Settings saved.</p>}

          <div className="settings-actions">
            <button type="submit" className="button-primary" disabled={saving}>
              <Save size={15} />
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
