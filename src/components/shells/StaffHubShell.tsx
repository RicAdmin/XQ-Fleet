import type React from 'react'

import {
  AlertTriangle,
  CalendarCheck,
  Car,
  ChevronRight,
  LogOut,
  Users,
  Wrench,
} from 'lucide-react'

import { authClient } from '#/lib/auth-client'

type StaffHubShellProps = {
  user: { name: string }
}

type AlertVariant = 'amber' | 'red'
type FleetStatus = 'available' | 'rented' | 'maintenance'

const PRIORITY_ALERTS: { id: string; icon: React.ReactNode; label: string; variant: AlertVariant }[] = [
  {
    id: 'checkins',
    icon: <CalendarCheck size={14} />,
    label: '2 check-ins due today',
    variant: 'amber',
  },
  {
    id: 'flag',
    icon: <AlertTriangle size={14} />,
    label: '1 car flagged for inspection',
    variant: 'red',
  },
]

const QUICK_ACTIONS = [
  { id: 'rental', icon: <CalendarCheck size={20} />, label: 'New rental', primary: true },
  { id: 'cars', icon: <Car size={20} />, label: 'Car status', primary: false },
  { id: 'customers', icon: <Users size={20} />, label: 'Customers', primary: false },
  { id: 'issue', icon: <Wrench size={20} />, label: 'Flag issue', primary: false },
]

const FLEET: { id: string; name: string; status: FleetStatus }[] = [
  { id: '#42', name: 'Blue Prius', status: 'available' },
  { id: '#8', name: 'Gray Civic', status: 'available' },
  { id: '#15', name: 'Red Corolla', status: 'rented' },
  { id: '#7', name: 'Tesla M3', status: 'maintenance' },
]

function getGreeting(name: string) {
  const hour = new Date().getHours()
  const salutation = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return `${salutation}, ${name}`
}

export default function StaffHubShell({ user }: StaffHubShellProps) {
  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <div className="hub-layout">
      <header className="hub-topbar">
        <div className="hub-brand">
          <Car size={15} />
          <span>XQ Fleet</span>
        </div>
        <div className="hub-topbar-end">
          <span className="role-pill">Staff</span>
          <button
            type="button"
            className="hub-signout"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <div className="hub-content">
        <div className="hub-greeting">
          <p className="hub-greeting-text">{getGreeting(user.name)}</p>
          <p className="hub-greeting-sub">Here's what needs your attention today.</p>
        </div>

        {/* Priority inbox */}
        <section className="hub-section">
          <p className="hub-section-title">Priority inbox</p>
          <div className="hub-alerts">
            {PRIORITY_ALERTS.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className={`hub-alert hub-alert--${alert.variant}`}
              >
                {alert.icon}
                <span>{alert.label}</span>
                <ChevronRight size={13} className="hub-alert-arrow" />
              </button>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="hub-section">
          <p className="hub-section-title">Quick actions</p>
          <div className="hub-quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`hub-action-btn ${action.primary ? 'hub-action-btn--primary' : 'hub-action-btn--secondary'}`}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Fleet at a glance */}
        <section className="hub-section">
          <p className="hub-section-title">Fleet at a glance</p>
          <div className="hub-fleet-grid">
            {FLEET.map((car) => (
              <button
                key={car.id}
                type="button"
                className={`hub-fleet-card hub-fleet-card--${car.status}`}
              >
                <span className="hub-fleet-status-dot" />
                <span className="hub-fleet-id">{car.id}</span>
                <span className="hub-fleet-name">{car.name}</span>
                <span className="hub-fleet-badge">{car.status}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Today's tasks */}
        <section className="hub-section">
          <p className="hub-section-title">Today's tasks</p>
          <div className="hub-empty-state">
            <CalendarCheck size={22} />
            <p>Tasks will appear here as rentals are assigned to you.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
