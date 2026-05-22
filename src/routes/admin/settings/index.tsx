import { createFileRoute, redirect } from '@tanstack/react-router'
import { Info, Save } from 'lucide-react'
import { useState } from 'react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import type { PaymentMode } from '#/db/schema'
import type { PaymentSettingsRow } from '#/lib/settings-functions'
import { getPaymentSettings, updatePaymentSettings } from '#/lib/settings-functions'

export const Route = createFileRoute('/admin/settings/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } }
    }
    if (session.user.role !== 'owner' && session.user.role !== 'super_admin') {
      throw redirect({ to: '/admin/cars' })
    }
    const settings = await getPaymentSettings()
    return { settings }
  },
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const { session, settings } = Route.useRouteContext() as unknown as {
    session: { user: { role: string; name: string; email: string } }
    settings: PaymentSettingsRow
  }

  const [paymentMode, setPaymentMode] = useState<PaymentMode>(settings.paymentMode)
  const [depositAmountRM, setDepositAmountRM] = useState(
    settings.depositAmountSen > 0 ? (settings.depositAmountSen / 100).toFixed(2) : '',
  )
  const [sandboxMode, setSandboxMode] = useState(settings.sandboxMode)
  const [enabled, setEnabled] = useState(settings.enabled)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const depositSen =
        paymentMode === 'deposit' ? Math.round(parseFloat(depositAmountRM || '0') * 100) : 0
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
    <AdminSidebarShell user={session.user} pageTitle="Settings">
      <div className="admin-settings-page">
        <p className="admin-settings-intro">
          Configure how online payments are collected through iPay88 during customer checkout.
        </p>

        <form onSubmit={handleSave} className="settings-form">
          <section className="settings-section island-shell">
            <h2 className="settings-section-title">iPay88 Payment Gateway</h2>

            <div className="settings-info-banner">
              <Info size={15} aria-hidden />
              <span>
                Merchant credentials are configured via environment variables (
                <code>IPAY88_MERCHANT_CODE</code>, <code>IPAY88_MERCHANT_KEY</code>).
              </span>
            </div>

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
          </section>

          <section className="settings-section island-shell">
            <h2 className="settings-section-title">Payment collection</h2>

            <div className="settings-field-col">
              <span className="settings-label">Charge amount</span>
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
          </section>

          {error ? <p className="settings-error">{error}</p> : null}
          {saved ? <p className="settings-saved">Settings saved.</p> : null}

          <div className="settings-actions">
            <button type="submit" className="button-primary" disabled={saving}>
              <Save size={15} aria-hidden />
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminSidebarShell>
  )
}
