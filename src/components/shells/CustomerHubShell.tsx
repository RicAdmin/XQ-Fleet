import { Car, ChevronRight, Clock, History, LogOut, User } from 'lucide-react'

import BrandLogo from '#/components/BrandLogo'
import { authClient } from '#/lib/auth-client'

type CustomerHubShellProps = {
  user: { name: string }
}

const BROWSE_CARS = [
  { id: '#7', name: 'Tesla Model 3', rate: '$65 / day', available: true },
  { id: '#12', name: 'Honda Civic', rate: '$38 / day', available: true },
  { id: '#21', name: 'Toyota Corolla', rate: '$35 / day', available: false },
]

const ACCOUNT_LINKS = [
  { id: 'profile', icon: <User size={16} />, label: 'Profile & documents' },
  { id: 'active', icon: <Clock size={16} />, label: 'Active rental' },
  { id: 'history', icon: <History size={16} />, label: 'Rental history' },
  { id: 'browse', icon: <Car size={16} />, label: 'Browse cars' },
]

export default function CustomerHubShell({ user }: CustomerHubShellProps) {
  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <div className="hub-layout">
      <header className="hub-topbar">
        <div className="hub-brand">
          <BrandLogo size={28} />
          <span>XQ Fleet</span>
        </div>
        <div className="hub-topbar-end">
          <span className="role-pill">Customer</span>
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
          <p className="hub-greeting-text">
            Welcome back, <strong>{user.name}</strong>
          </p>
          <p className="hub-greeting-sub">Manage your rentals and browse available cars.</p>
        </div>

        {/* Active rental */}
        <section className="hub-section">
          <p className="hub-section-title">Active rental</p>
          <div className="hub-rental-empty island-shell">
            <Clock size={22} className="hub-rental-icon" />
            <p className="hub-rental-headline">No active rental</p>
            <p className="hub-rental-sub">Browse available cars to book your next trip.</p>
            <button type="button" className="button-primary">
              Browse cars
            </button>
          </div>
        </section>

        {/* Browse cars */}
        <section className="hub-section">
          <div className="hub-section-header">
            <p className="hub-section-title">Available cars</p>
            <button type="button" className="hub-see-all">
              See all <ChevronRight size={12} />
            </button>
          </div>
          <div className="hub-browse-list">
            {BROWSE_CARS.map((car) => (
              <div
                key={car.id}
                className={`hub-car-card island-shell${!car.available ? ' is-unavailable' : ''}`}
              >
                <div className="hub-car-thumb">
                  <Car size={20} />
                </div>
                <div className="hub-car-info">
                  <p className="hub-car-name">{car.name}</p>
                  <p className="hub-car-rate">{car.rate}</p>
                </div>
                <button
                  type="button"
                  className={car.available ? 'button-primary' : 'button-secondary'}
                  disabled={!car.available}
                >
                  {car.available ? 'Book' : 'Taken'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Account */}
        <section className="hub-section">
          <p className="hub-section-title">My account</p>
          <div className="hub-account-links">
            {ACCOUNT_LINKS.map((link) => (
              <button key={link.id} type="button" className="hub-account-link">
                {link.icon}
                <span>{link.label}</span>
                <ChevronRight size={14} className="ml-auto" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
