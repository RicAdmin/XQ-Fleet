import { useEffect, useState } from 'react'

import { Link, createFileRoute, getRouteApi } from '@tanstack/react-router'

import CustomerAccountChrome from '#/components/portal/CustomerAccountChrome'

const accountRouteApi = getRouteApi('/account')

const NOTIF_DEFS = [
  {
    id: 'booking_updates',
    title: 'Booking updates',
    desc: 'Confirmations, pickup reminders, gentle ETA nudges.',
    defaultOn: true,
  },
  {
    id: 'deals',
    title: 'Deals & promotions',
    desc: '1–2 emails per month, surprise upgrades for subscribers.',
    defaultOn: true,
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp messages',
    desc: 'Faster, friendlier — for pickup-day coordination.',
    defaultOn: true,
  },
  {
    id: 'travel_tips',
    title: 'Travel tips',
    desc: 'Island guides and seasonal driving advice.',
    defaultOn: false,
  },
  {
    id: 'rerent',
    title: 'Re-rent reminder',
    desc: 'Light nudge when your favourite car is free again.',
    defaultOn: false,
  },
] as const

type NotifId = (typeof NOTIF_DEFS)[number]['id']

type NotifState = Record<NotifId, boolean>

function storageKey(userId: string) {
  return `cxq-portal-notifs-${userId}`
}

function loadState(userId: string): NotifState {
  const base: NotifState = Object.fromEntries(NOTIF_DEFS.map((n) => [n.id, n.defaultOn])) as NotifState
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<NotifState>
    return { ...base, ...parsed }
  } catch {
    return base
  }
}

function saveState(userId: string, state: NotifState) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute('/account/notifications')({
  component: AccountNotificationsPage,
})

function AccountNotificationsPage() {
  const { session } = Route.useRouteContext()
  const { bookings, portalCustomer } = accountRouteApi.useLoaderData()
  const [state, setState] = useState<NotifState>(() => loadState(session.user.id))

  useEffect(() => {
    setState(loadState(session.user.id))
  }, [session.user.id])

  function toggle(id: NotifId) {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      saveState(session.user.id, next)
      return next
    })
  }

  const displayPhone = portalCustomer?.phone ?? ''

  return (
    <CustomerAccountChrome
      session={session}
      bookingsCount={bookings.length}
      displayPhone={displayPhone}
    >
      <main className="cxq-profile-body">
        <section className="cxq-profile-card">
          <div className="cxq-profile-card-head">
            <div>
              <span className="cxq-profile-eyebrow">Notifications</span>
              <h3>Choose what you&apos;d like to hear from us</h3>
              <p>Update any time. We don&apos;t sell your details — ever.</p>
            </div>
          </div>

          {NOTIF_DEFS.map((n) => (
            <div key={n.id} className="cxq-notif-row">
              <div>
                <strong>{n.title}</strong>
                <p>{n.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state[n.id]}
                className={'cxq-switch' + (state[n.id] ? ' cxq-switch--on' : '')}
                onClick={() => toggle(n.id)}
              />
            </div>
          ))}
        </section>

        <p className="cxq-profile-tos">
          By continuing you agree to our terms and acknowledge our{' '}
          <Link to="/about" className="cxq-profile-tos-link">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </CustomerAccountChrome>
  )
}
