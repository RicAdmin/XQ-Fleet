import { useEffect, useState } from 'react'

import { createFileRoute, getRouteApi, useRouter } from '@tanstack/react-router'
import { Check, Shield } from 'lucide-react'

import CustomerAccountChrome from '#/components/portal/CustomerAccountChrome'
import { authClient } from '#/lib/auth-client'
import { updatePortalCustomerProfile } from '#/lib/portal-booking-functions'

const accountRouteApi = getRouteApi('/account')

const dobStorageKey = (userId: string) => `cxq-portal-dob-${userId}`

export const Route = createFileRoute('/account/profile')({
  component: AccountProfilePage,
})

function AccountProfilePage() {
  const router = useRouter()
  const { session } = Route.useRouteContext()
  const { bookings, portalCustomer } = accountRouteApi.useLoaderData()

  const [name, setName] = useState(session.user.name)
  const [email] = useState(session.user.email)
  const [phone, setPhone] = useState(portalCustomer?.phone ?? '')
  const [dob, setDob] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setName(session.user.name)
    setPhone(portalCustomer?.phone ?? '')
  }, [session.user.name, session.user.id, portalCustomer?.phone])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(dobStorageKey(session.user.id))
      setDob(raw ?? '')
    } catch {
      setDob('')
    }
  }, [session.user.id])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await authClient.updateUser({ name: name.trim() })
      await updatePortalCustomerProfile({
        data: { fullName: name.trim(), phone: phone.trim() },
      })
      try {
        localStorage.setItem(dobStorageKey(session.user.id), dob.trim())
      } catch {
        /* ignore */
      }
      await router.invalidate()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save changes.')
    } finally {
      setPending(false)
    }
  }

  const displayPhone = phone.trim() || (portalCustomer?.phone ?? '')

  return (
    <CustomerAccountChrome
      session={session}
      bookingsCount={bookings.length}
      displayPhone={displayPhone}
    >
      <main className="cxq-profile-body">
        <form className="cxq-profile-form" onSubmit={(e) => void handleSubmit(e)}>
          <section className="cxq-profile-card">
            <div className="cxq-profile-card-head">
              <div>
                <span className="cxq-profile-eyebrow">Personal</span>
                <h3>Your details</h3>
                <p>Used on every booking and on your driver&apos;s-license check at pickup.</p>
              </div>
              {saved ? (
                <span className="cxq-profile-saved-pill">
                  <Check size={13} strokeWidth={2.5} aria-hidden />
                  Saved
                </span>
              ) : null}
            </div>

            <div className="cxq-profile-form-grid">
              <label className="cxq-profile-field">
                <span>Full name (as on license)</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="cxq-profile-field">
                <span>Date of birth</span>
                <input
                  value={dob}
                  onChange={(event) => setDob(event.target.value)}
                  placeholder="DD / MM / YYYY"
                  autoComplete="bday"
                />
              </label>
              <label className="cxq-profile-field">
                <span>Email</span>
                <input value={email} readOnly className="cxq-profile-input-readonly" />
              </label>
              <label className="cxq-profile-field">
                <span>Mobile</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+60 12 345 6789"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </label>
            </div>
          </section>

          {error ? <p className="cxq-profile-inline-error">{error}</p> : null}

          <div className="cxq-profile-form-foot">
            <span className="cxq-profile-form-foot-note">
              <Shield size={13} strokeWidth={2} aria-hidden />
              Your info is encrypted at rest and never sold.
            </span>
            <button type="submit" className="button-primary cxq-profile-save-btn" disabled={pending}>
              {pending ? 'Saving…' : 'Save changes'}
              {!pending ? <Check size={14} strokeWidth={2.25} aria-hidden /> : null}
            </button>
          </div>
        </form>
      </main>
    </CustomerAccountChrome>
  )
}
