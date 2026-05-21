import './cxq-landing-scoped.css'
import './cxq-landing-overrides.css'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Globe,
  Heart,
  Luggage,
  MapPin,
  Phone,
  Plane,
  Plus,
  Search,
  Shield,
  Sparkles,
  Star,
  Sun,
  Users,
  X,
} from 'lucide-react'

import BrandLogo from '#/components/BrandLogo'
import {
  CarDetailDialog,
  cloneBooking,
  defaultBooking,
  hasTripDates,
  nightsBetween,
  sanitizeBookingDates,
  type BookingState,
} from '#/components/landing/CarDetailDialog'

import { LuggageFitModal } from '#/components/LuggageFitModal'
import { authClient } from '#/lib/auth-client'
import { addCalendarDays, earliestPickupDate, formatTripDuration, isAllowedReturnDate, startOfLocalDay, toLocalYmd } from '#/lib/booking-datetime'
import { checkoutSearchFromBooking } from '#/lib/checkout-trip'
import { loadTripSearch, saveTripSearch } from '#/lib/trip-search-storage'
import { heuristicLuggageFit } from '#/lib/fleet-luggage-fit'
import { isHondaNBox } from '#/lib/fleet-oku'
import { filterPublicCars } from '#/lib/portal-functions'
import type { PublicCarRow } from '#/lib/portal-functions'

import {
  ATTRACTIONS,
  ATTR_CATS,
  BLOG_TIPS,
  CITIES,
  FAQS,
  FAQ_CATS,
  HERO_BG,
  HOTELS,
  PICK_TIMES,
  REELS,
  REVIEWS,
} from './cxq-landing-data'

const LOC_AIRPORT = 'Langkawi Intl Airport · Door 3'
const LOC_JETTY = 'Langkawi Ferry Jetty (Kuah)'

function formatMYR(sen: number) {
  return `RM ${Math.round(sen / 100).toLocaleString()}`
}

function fmtDate(d: Date | null) {
  return d
    ? d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    : 'Select date'
}

function scrollToAnchor(id: string) {
  document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type CarCategoryKey = 'economy' | 'mpv' | 'suv' | 'other'

const TOP_TAGS = ['All', 'Economy', 'MPV', 'SUV', 'Other'] as const

function tagToCategory(tag: (typeof TOP_TAGS)[number]): CarCategoryKey | 'all' {
  if (tag === 'All') return 'all'
  return tag.toLowerCase() as CarCategoryKey
}

function pickCar(cars: PublicCarRow[], cat: CarCategoryKey): PublicCarRow | null {
  return cars.find((c) => c.category === cat) ?? cars[0] ?? null
}

export function CxqLandingPage({
  initialCars,
  initialModelQuery = '',
}: {
  initialCars: PublicCarRow[]
  initialModelQuery?: string
}) {
  const navigate = useNavigate()
  const [cars, setCars] = useState<PublicCarRow[]>(initialCars)
  const [modelQuery, setModelQuery] = useState(initialModelQuery)
  const [booking, setBooking] = useState<BookingState>(() => ({
    ...defaultBooking(),
    pickDate: null,
    retDate: null,
    pickTime: '',
    retTime: '',
  }))
  const [searchCriteria, setSearchCriteria] = useState<BookingState | null>(null)
  const [tripSearchReady, setTripSearchReady] = useState(false)
  const [openCar, setOpenCar] = useState<PublicCarRow | null>(null)
  const [activeReel, setActiveReel] = useState<(typeof REELS)[number] | null>(null)
  const [searching, setSearching] = useState(false)
  const [bookingPrompt, setBookingPrompt] = useState<string | null>(null)
  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)

  const { data: session, isPending: sessionPending } = authClient.useSession()
  const user = session?.user

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) setNavMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const stored = loadTripSearch()
    if (stored) {
      setBooking(stored.booking)
      const criteria =
        stored.searchCriteria && hasTripDates(stored.searchCriteria) ? stored.searchCriteria : null
      setSearchCriteria(criteria)
      if (criteria) {
        const start = toLocalYmd(criteria.pickDate)
        const end = toLocalYmd(criteria.retDate)
        if (start && end) {
          void filterPublicCars({ data: { startDate: start, endDate: end } })
            .then(setCars)
            .catch(() => {})
        }
      }
    }
    setTripSearchReady(true)
  }, [])

  useEffect(() => {
    if (!tripSearchReady) return
    saveTripSearch(booking, searchCriteria)
  }, [booking, searchCriteria, tripSearchReady])

  useEffect(() => {
    if (!tripSearchReady) return
    setBooking((b) => {
      const sanitized = sanitizeBookingDates(b)
      if (
        sanitized.pickDate?.getTime() === b.pickDate?.getTime() &&
        sanitized.retDate?.getTime() === b.retDate?.getTime()
      ) {
        return b
      }
      return sanitized
    })
    setSearchCriteria((criteria) => {
      if (!criteria) return criteria
      const sanitized = sanitizeBookingDates(criteria)
      return hasTripDates(sanitized) ? sanitized : null
    })
  }, [tripSearchReady])

  const clearModelQuery = useCallback(() => {
    setModelQuery('')
    void navigate({ to: '/', search: {}, replace: true })
  }, [navigate])

  const focusBookingDates = useCallback(() => {
    scrollToAnchor('booking-dock')
  }, [])

  const requireBookingSearch = useCallback(() => {
    let message = 'Tap Search cars to check what’s available for your trip.'
    if (!isAllowedReturnDate(booking.pickDate, booking.retDate)) {
      message = 'Choose pickup and return dates above, then tap Search cars to view vehicles and book.'
    } else if (!booking.pickTime.trim() || !booking.retTime.trim()) {
      message = 'Choose pickup and return times — both are required before you can search.'
    }
    setBookingPrompt(message)
    scrollToAnchor('booking-dock')
  }, [booking])

  const runSearch = useCallback(async () => {
    if (!hasTripDates(booking)) {
      requireBookingSearch()
      return
    }
    setBookingPrompt(null)
    const committed = cloneBooking(booking)
    setSearchCriteria(committed)
    saveTripSearch(booking, committed)
    setSearching(true)
    try {
      const start = toLocalYmd(booking.pickDate)
      const end = toLocalYmd(booking.retDate)
      const results = await filterPublicCars({
        data: {
          startDate: start,
          endDate: end,
        },
      })
      setCars(results)
      requestAnimationFrame(() => scrollToAnchor('top-picks'))
    } finally {
      setSearching(false)
    }
  }, [booking, requireBookingSearch])

  const canBrowseFleet = Boolean(searchCriteria && hasTripDates(searchCriteria))

  const tryOpenCar = useCallback(
    (car: PublicCarRow) => {
      if (!canBrowseFleet) {
        requireBookingSearch()
        return
      }
      setOpenCar(car)
    },
    [canBrowseFleet, requireBookingSearch],
  )

  useEffect(() => {
    if (!searchCriteria) return
    const samePick =
      searchCriteria.pickDate?.getTime() === booking.pickDate?.getTime()
    const sameRet =
      searchCriteria.retDate?.getTime() === booking.retDate?.getTime()
    const samePickTime = searchCriteria.pickTime === booking.pickTime
    const sameRetTime = searchCriteria.retTime === booking.retTime
    if (!samePick || !sameRet || !samePickTime || !sameRetTime) {
      setSearchCriteria(null)
    }
  }, [booking.pickDate, booking.retDate, booking.pickTime, booking.retTime, searchCriteria])

  const trip = searchCriteria ?? booking
  const startYmd = toLocalYmd(trip.pickDate)
  const endYmd = toLocalYmd(trip.retDate)

  const goToCheckout = useCallback(
    (car: PublicCarRow) => {
      if (!searchCriteria || !hasTripDates(searchCriteria)) {
        requireBookingSearch()
        return
      }
      const checkoutTrip = searchCriteria
      saveTripSearch(checkoutTrip, checkoutTrip)
      setOpenCar(null)
      void navigate({
        to: '/checkout/$carId',
        params: { carId: car.id },
        search: checkoutSearchFromBooking(checkoutTrip),
      })
    },
    [navigate, searchCriteria, requireBookingSearch],
  )

  return (
    <div className="cxq-landing-page">
      <div className="page" data-screen-label="Car XQ Landing">
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }}>
            <LandingNav
              sessionPending={sessionPending}
              user={user}
              navMenuOpen={navMenuOpen}
              setNavMenuOpen={setNavMenuOpen}
              navMenuRef={navMenuRef}
              cars={cars}
              modelQuery={modelQuery}
              onModelQueryChange={setModelQuery}
              onClearModelQuery={clearModelQuery}
              onModelSelect={(car) => {
                setModelQuery(carModelLabel(car))
                scrollToAnchor('top-picks')
                tryOpenCar(car)
              }}
              onScrollFleet={() => scrollToAnchor('top-picks')}
              onScrollCategories={() => scrollToAnchor('categories')}
              onScrollLocations={() => scrollToAnchor('locations')}
              onScrollHelp={() => scrollToAnchor('faq')}
            />
          </div>
          <Hero />
        </div>

        <BookingDock
          booking={booking}
          setBooking={setBooking}
          onSearch={runSearch}
          searching={searching}
          datesReady={hasTripDates(booking)}
          prompt={bookingPrompt}
          onClearPrompt={() => setBookingPrompt(null)}
          onPrompt={setBookingPrompt}
        />

        <TopPicksSection
          cars={cars}
          modelQuery={modelQuery}
          onClearModelQuery={clearModelQuery}
          matchedSearch={canBrowseFleet}
          fleetLocked={!canBrowseFleet}
          onRequireTrip={requireBookingSearch}
          onOpenCar={tryOpenCar}
        />
        <CarCategoriesSection
          cars={cars}
          fleetLocked={!canBrowseFleet}
          onRequireTrip={requireBookingSearch}
          onOpenCar={tryOpenCar}
        />
        <CitiesSection onPickCity={(c) => setBooking((b) => ({ ...b, from: `Car rental in ${c}` }))} />
        <PromosSection />
        <WhyChooseUs />
        <StepByStep />
        <TipsSection />
        <AttractionsSection />
        <EssentialLocations />
        <FAQSection />
        <ReelsSection onOpenReel={setActiveReel} />
        <TestimonialsSection />
        <CruiseBanner />
        <FooterCta onPlan={() => scrollToAnchor('booking-dock')} />
        <SiteFooter
          onScrollBooking={() => scrollToAnchor('booking-dock')}
          onScrollFleet={() => scrollToAnchor('top-picks')}
        />

        {openCar && (
          <CarDetailDialog
            car={openCar}
            fleet={cars}
            booking={trip}
            nights={nightsBetween(trip.pickDate, trip.retDate)}
            checkoutReady={canBrowseFleet}
            onClose={() => setOpenCar(null)}
            onBeginCheckout={goToCheckout}
            onSelectCar={setOpenCar}
          />
        )}
        {activeReel && <ReelLightbox reel={activeReel} onClose={() => setActiveReel(null)} />}
      </div>
    </div>
  )
}

function carModelLabel(car: PublicCarRow) {
  return `${car.make} ${car.model}`.trim()
}

function matchCarModel(car: PublicCarRow, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const label = carModelLabel(car).toLowerCase()
  return (
    label.includes(q) ||
    car.make.toLowerCase().includes(q) ||
    car.model.toLowerCase().includes(q)
  )
}

function NavModelSearch({
  cars,
  query,
  onQueryChange,
  onClear,
  onSelect,
  onScrollFleet,
}: {
  cars?: PublicCarRow[]
  query: string
  onQueryChange: (value: string) => void
  onClear?: () => void
  onSelect?: (car: PublicCarRow) => void
  onScrollFleet?: () => void
}) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const fleet = useMemo(() => uniquePublicCars(cars ?? []), [cars])

  const clearSearch = () => {
    if (onClear) {
      onClear()
    } else {
      onQueryChange('')
    }
    setOpen(false)
    inputRef.current?.focus()
  }

  const matches = useMemo(() => {
    if (!query.trim()) return []
    return fleet.filter((car) => matchCarModel(car, query)).slice(0, 6)
  }, [fleet, query])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const commitSearch = () => {
    const trimmed = query.trim()
    if (!trimmed) return

    if (fleet.length > 0) {
      const hit = fleet.find((car) => matchCarModel(car, trimmed))
      if (hit && onSelect) {
        onSelect(hit)
        setOpen(false)
        return
      }
      onScrollFleet?.()
      setOpen(false)
      return
    }

    void navigate({ to: '/', hash: 'top-picks', search: { model: trimmed } })
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className="nav-search"
    >
      <Search size={15} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder="Search car model…"
        aria-label="Search car model"
        aria-expanded={open && matches.length > 0}
        aria-controls={matches.length > 0 ? 'nav-model-search-list' : undefined}
        autoComplete="off"
        onChange={(e) => {
          onQueryChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commitSearch()
          }
          if (e.key === 'Escape') {
            if (query.trim()) {
              e.preventDefault()
              clearSearch()
            } else {
              setOpen(false)
            }
          }
        }}
      />
      {query.trim() ? (
        <button
          type="button"
          className="nav-search-clear"
          aria-label="Clear search"
          onClick={clearSearch}
        >
          <X size={14} aria-hidden />
        </button>
      ) : null}
      {open && matches.length > 0 ? (
        <ul id="nav-model-search-list" className="nav-search-menu" role="listbox">
          {matches.map((car) => (
            <li key={car.id} role="presentation">
              <button
                type="button"
                role="option"
                className="nav-search-option"
                onClick={() => {
                  onQueryChange(carModelLabel(car))
                  onSelect?.(car)
                  setOpen(false)
                }}
              >
                <span className="nav-search-option-name">{carModelLabel(car)}</span>
                <span className="nav-search-option-meta">{car.category}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function LandingNav({
  sessionPending,
  user,
  navMenuOpen,
  setNavMenuOpen,
  navMenuRef,
  sectionLinks = 'in-page',
  appearance = 'on-hero',
  onScrollFleet,
  onScrollCategories,
  onScrollLocations,
  onScrollHelp,
  cars,
  modelQuery,
  onModelQueryChange,
  onClearModelQuery,
  onModelSelect,
}: {
  sessionPending: boolean
  user: { name?: string | null; email: string } | undefined
  navMenuOpen: boolean
  setNavMenuOpen: (v: boolean | ((b: boolean) => boolean)) => void
  navMenuRef: React.RefObject<HTMLDivElement | null>
  /** `home`: same destinations as the landing page, via `/#…` (for routes outside the long homepage). */
  sectionLinks?: 'in-page' | 'home'
  /** `solid-light`: white bar + dark text (e.g. checkout). Default matches hero overlay. */
  appearance?: 'on-hero' | 'solid-light'
  onScrollFleet?: () => void
  onScrollCategories?: () => void
  onScrollLocations?: () => void
  onScrollHelp?: () => void
  cars?: PublicCarRow[]
  modelQuery?: string
  onModelQueryChange?: (query: string) => void
  onClearModelQuery?: () => void
  onModelSelect?: (car: PublicCarRow) => void
}) {
  const [localModelQuery, setLocalModelQuery] = useState('')
  const resolvedModelQuery = modelQuery ?? localModelQuery
  const resolvedOnModelQueryChange = onModelQueryChange ?? setLocalModelQuery
  const resolvedOnClearModelQuery =
    onClearModelQuery ??
    (() => {
      resolvedOnModelQueryChange('')
    })
  const initials = user?.name ? initialsFromName(user.name) : ''
  const onHero = appearance === 'on-hero'

  return (
    <nav className={'nav' + (onHero ? '' : ' nav--solid-light')}>
      <Link to="/">
        <div className="brand" style={{ color: onHero ? '#fff' : 'var(--ink)' }}>
          <BrandLogo size={36} />
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '-.01em' }}>
            Car<span style={{ color: 'var(--brand-leaf)' }}>XQ</span>
          </span>
        </div>
      </Link>
      <div className="nav-links">
        {sectionLinks === 'home' ? (
          <>
            <Link to="/" hash="booking-dock" className="nav-ghost-link active">
              Find a car
            </Link>
            <Link to="/" hash="top-picks" className="nav-ghost-link">
              Our fleet
            </Link>
            <Link to="/" hash="categories" className="nav-ghost-link">
              Categories
            </Link>
            <Link to="/" hash="locations" className="nav-ghost-link">
              Locations
            </Link>
            <Link to="/" hash="faq" className="nav-ghost-link">
              Help
            </Link>
          </>
        ) : (
          <>
            <button type="button" className="active" onClick={() => scrollToAnchor('booking-dock')}>
              Find a car
            </button>
            <button type="button" onClick={onScrollFleet}>
              Our fleet
            </button>
            <button type="button" onClick={onScrollCategories}>
              Categories
            </button>
            <button type="button" onClick={onScrollLocations}>
              Locations
            </button>
            <button type="button" onClick={onScrollHelp}>
              Help
            </button>
          </>
        )}
      </div>
      <NavModelSearch
        cars={cars}
        query={resolvedModelQuery}
        onQueryChange={resolvedOnModelQueryChange}
        onClear={resolvedOnClearModelQuery}
        onSelect={onModelSelect}
        onScrollFleet={onScrollFleet}
      />
      <div className="nav-right">
        <span className="flex items-center gap-2" style={{ opacity: 0.9 }}>
          <Globe size={14} /> EN · MYR
        </span>
        {sessionPending ? (
          <span
            className="nav-session-pending"
            style={{ width: 80, height: 32, display: 'inline-block', borderRadius: 999, background: 'rgba(255,255,255,.12)' }}
          />
        ) : !user ? (
          <>
            <Link to="/login">Log In</Link>
            <Link to="/register" className="signup">
              Sign Up
            </Link>
          </>
        ) : (
          <div className="nav-user" ref={navMenuRef}>
            <button type="button" className="nav-avatar" onClick={() => setNavMenuOpen((o) => !o)}>
              <span>{initials}</span>
              <ChevronDown size={12} />
            </button>
            {navMenuOpen && (
              <div className="nav-user-menu">
                <div className="nav-user-head">
                  <div>{initials}</div>
                  <div>
                    <div className="nav-user-name">{user.name ?? 'Account'}</div>
                    <div className="nav-user-email">{user.email}</div>
                  </div>
                </div>
                <Link to="/account/profile" onClick={() => setNavMenuOpen(false)}>
                  <Users size={14} /> Profile &amp; details
                </Link>
                <Link to="/account/rentals" onClick={() => setNavMenuOpen(false)}>
                  <Calendar size={14} /> My rentals
                </Link>
                <Link to="/account/notifications" onClick={() => setNavMenuOpen(false)}>
                  <Bell size={14} /> Notifications
                </Link>
                <div className="nav-user-divider" />
                <button
                  type="button"
                  className="w-full cursor-pointer border-0 bg-transparent p-0 text-left font-inherit"
                  style={{ color: 'var(--brand-coral)' }}
                  onClick={async () => {
                    setNavMenuOpen(false)
                    await authClient.signOut()
                    window.location.href = '/'
                  }}
                >
                  <ArrowRight size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="hero layout-bleed" data-screen-label="Hero">
      <div className="stage" style={{ backgroundImage: `url(${HERO_BG})` }}>
        <div className="hero-title-block">
          <span className="eyebrow">Car XQ · est. 2015 in Langkawi</span>
          <h1 className="h-display">
            Rent a Car for
            <br />
            Every Journey.
          </h1>
          <p>
            Safe, friendly, fairly priced wheels — booked in 90&nbsp;seconds and delivered to your terminal, jetty, or
            hotel.
          </p>
        </div>
      </div>
    </section>
  )
}

function BookingField({
  active,
  onToggle,
  label,
  value,
  menu,
}: {
  active: boolean
  onToggle: () => void
  label: ReactNode
  value: ReactNode
  menu: ReactNode | null
}) {
  return (
    <div className={'bk-field' + (active ? ' active' : '')} style={{ position: 'relative' }}>
      <button type="button" className="bk-field-trigger" onClick={onToggle}>
        <span className="lbl">{label}</span>
        <span className="val">{value}</span>
      </button>
      {menu}
    </div>
  )
}

function fmtTime(time: string) {
  return time.trim() || 'Select time'
}

function BookingDock({
  booking,
  setBooking,
  onSearch,
  searching,
  datesReady,
  prompt,
  onClearPrompt,
  onPrompt,
}: {
  booking: BookingState
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>
  onSearch: () => void
  searching: boolean
  datesReady: boolean
  prompt?: string | null
  onClearPrompt?: () => void
  onPrompt?: (message: string) => void
}) {
  const [open, setOpen] = useState<'from' | 'to' | 'pick' | 'ret' | 'pax' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        window.requestAnimationFrame(() => setOpen(null))
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!prompt) return
    if (!datesReady) {
      if (!booking.pickDate || !booking.pickTime.trim()) setOpen('pick')
      else if (!booking.retDate || !booking.retTime.trim()) setOpen('ret')
      else setOpen('pick')
      return
    }
    rootRef.current?.querySelector<HTMLButtonElement>('.bk-search-btn')?.focus()
  }, [prompt, datesReady, booking.pickDate, booking.pickTime, booking.retDate, booking.retTime])

  const openField = (field: typeof open) => {
    onClearPrompt?.()
    setOpen(field)
  }

  const tripDuration = formatTripDuration(
    booking.pickDate,
    booking.pickTime,
    booking.retDate,
    booking.retTime,
  )
  const totalPax = booking.adults + booking.children

  return (
    <div id="booking-dock" className="booking-dock" ref={rootRef}>
      {prompt ? (
        <p className="bk-prompt" role="status">
          {prompt}
        </p>
      ) : null}
      <div className="bk-top">
        <div className="bk-trip-tabs">
          <button
            type="button"
            className={booking.tripType === 'round' ? 'on' : ''}
            onClick={() => setBooking((b) => ({ ...b, tripType: 'round', retLoc: b.from }))}
          >
            <ArrowRight size={12} style={{ transform: 'rotate(-90deg)' }} /> Round-trip
          </button>
          <button
            type="button"
            className={booking.tripType === 'oneway' ? 'on' : ''}
            onClick={() => setBooking((b) => ({ ...b, tripType: 'oneway' }))}
          >
            <ArrowRight size={12} /> Different return
          </button>
        </div>
        {tripDuration !== '—' && (
          <span className="bk-nights">
            <Clock size={12} />
            <span>{tripDuration}</span>
          </span>
        )}
      </div>

      <div className={'booking-row ' + (booking.tripType === 'oneway' ? 'with-return' : 'simple')}>
        <BookingField
          active={open === 'from'}
          onToggle={() => openField(open === 'from' ? null : 'from')}
          label="Pickup location"
          value={
            <>
              <MapPin size={14} className="icon" />
              {booking.from || 'Airport, jetty or hotel'}
            </>
          }
          menu={
            open === 'from' ? (
              <LocationMenu
                onPick={(l) => {
                  const updates: Partial<BookingState> = { from: l }
                  if (booking.tripType === 'round') updates.retLoc = l
                  setBooking((b) => ({ ...b, ...updates }))
                  window.requestAnimationFrame(() => setOpen('pick'))
                }}
              />
            ) : null
          }
        />

        {booking.tripType === 'oneway' && (
          <BookingField
            active={open === 'to'}
            onToggle={() => openField(open === 'to' ? null : 'to')}
            label="Return location"
            value={
              <>
                <MapPin size={14} className="icon" />
                {booking.retLoc || 'Airport or jetty'}
              </>
            }
            menu={
              open === 'to' ? (
                <LocationMenu
                  onPick={(l) => {
                    setBooking((b) => ({ ...b, retLoc: l }))
                    window.requestAnimationFrame(() => setOpen('pick'))
                  }}
                />
              ) : null
            }
          />
        )}

        <BookingField
          active={open === 'pick'}
          onToggle={() => openField(open === 'pick' ? null : 'pick')}
          label="Pickup"
          value={
            <>
              <Calendar size={14} className="icon" />
              <span className="bk-date">{fmtDate(booking.pickDate)}</span>
              <span className="bk-sep">·</span>
              <span className={'bk-time' + (booking.pickTime.trim() ? '' : ' bk-time--empty')}>
                {fmtTime(booking.pickTime)}
              </span>
            </>
          }
          menu={
            open === 'pick' ? (
              <DateTimeMenu
                date={booking.pickDate}
                time={booking.pickTime}
                minDate={earliestPickupDate()}
                onPick={(d, t) => {
                  setBooking((b) => {
                    const u: Partial<BookingState> = {}
                    if (d !== undefined) {
                      u.pickDate = d
                      u.pickTime = ''
                    }
                    if (t !== undefined) u.pickTime = t
                    if (u.pickDate && b.retDate) {
                      const earliestReturn = addCalendarDays(u.pickDate, 1)
                      if (b.retDate < earliestReturn) {
                        u.retDate = null
                        u.retTime = ''
                      }
                    }
                    return { ...b, ...u }
                  })
                }}
                onDone={() => window.requestAnimationFrame(() => setOpen('ret'))}
              />
            ) : null
          }
        />

        <BookingField
          active={open === 'ret'}
          onToggle={() => {
            if (open !== 'ret') {
              if (!booking.pickDate || !booking.pickTime.trim()) {
                onPrompt?.('Select a pickup date and time before choosing return.')
                setOpen('pick')
                return
              }
            }
            openField(open === 'ret' ? null : 'ret')
          }}
          label="Return"
          value={
            <>
              <Calendar size={14} className="icon" />
              <span className="bk-date">{fmtDate(booking.retDate)}</span>
              <span className="bk-sep">·</span>
              <span className={'bk-time' + (booking.retTime.trim() ? '' : ' bk-time--empty')}>
                {fmtTime(booking.retTime)}
              </span>
            </>
          }
          menu={
            open === 'ret' ? (
              <DateTimeMenu
                date={booking.retDate}
                time={booking.retTime}
                minDate={
                  booking.pickDate
                    ? addCalendarDays(booking.pickDate, 1)
                    : addCalendarDays(earliestPickupDate(), 1)
                }
                onPick={(d, t) => {
                  setBooking((b) => {
                    const u: Partial<BookingState> = {}
                    if (d !== undefined) {
                      u.retDate = d
                      u.retTime = ''
                    }
                    if (t !== undefined) u.retTime = t
                    return { ...b, ...u }
                  })
                }}
                onDone={() => window.requestAnimationFrame(() => setOpen(null))}
              />
            ) : null
          }
        />

        <BookingField
          active={open === 'pax'}
          onToggle={() => openField(open === 'pax' ? null : 'pax')}
          label={
            <>
              Passengers <span className="bk-optional">· optional</span>
            </>
          }
          value={
            <>
              <Users size={14} className="icon" />
              {totalPax > 0 ? (
                <>
                  <span>
                    {totalPax} passenger{totalPax > 1 ? 's' : ''}
                  </span>
                  <span className="bk-sep">·</span>
                  <span className="bk-time">
                    {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                    {booking.children > 0 ? `, ${booking.children} child` : ''}
                  </span>
                </>
              ) : (
                <span>Any group size</span>
              )}
            </>
          }
          menu={
            open === 'pax' ? (
              <PaxMenu
                adults={booking.adults}
                children={booking.children}
                onChange={(a, c) => setBooking((b) => ({ ...b, adults: a, children: c }))}
                onDone={() => window.requestAnimationFrame(() => setOpen(null))}
              />
            ) : null
          }
        />

        <button
          type="button"
          className="bk-search-btn"
          onClick={() => {
            onClearPrompt?.()
            onSearch()
          }}
          disabled={searching || !datesReady}
          title={
            datesReady ? undefined : 'Choose pickup and return dates and times first'
          }
        >
          <Search size={15} /> {searching ? 'Searching…' : 'Search cars'}
        </button>
      </div>
    </div>
  )
}

function LocationMenu({ onPick }: { onPick: (loc: string) => void }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!query.trim()) return []
    return HOTELS.filter((h) => h.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
  }, [query])

  return (
    <div className="bk-menu loc-menu" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <div className="loc-group-label">Pickup points</div>
      <button type="button" className="loc-item" onClick={() => onPick(LOC_AIRPORT)}>
        <span className="loc-icon">
          <Plane size={14} />
        </span>
        <span className="loc-body">
          <strong>Langkawi Intl Airport</strong>
          <span>Door 3 · Padang Matsirat · 24/7</span>
        </span>
        <span className="loc-pill">Free</span>
      </button>
      <button type="button" className="loc-item" onClick={() => onPick(LOC_JETTY)}>
        <span className="loc-icon">
          <MapPin size={14} />
        </span>
        <span className="loc-body">
          <strong>Langkawi Ferry Jetty</strong>
          <span>Kuah Terminal · 06:00 – 22:00</span>
        </span>
        <span className="loc-pill">Free</span>
      </button>

      <div className="loc-group-label" style={{ marginTop: 6 }}>
        Or pick up at your hotel <span style={{ color: 'var(--muted-2)', fontWeight: 400 }}>· RM 25 delivery</span>
      </div>
      <div className="loc-search">
        <Search size={13} />
        <input
          placeholder="Type your hotel name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {query && filtered.length > 0 && (
        <ul className="loc-hotel-list">
          {filtered.map((h) => (
            <li key={h} onClick={() => onPick(`${h} · hotel delivery`)} onKeyDown={() => {}} role="presentation">
              <MapPin size={12} />
              {h}
            </li>
          ))}
        </ul>
      )}
      {query && filtered.length === 0 && (
        <div className="loc-empty">
          No match — type the hotel name and we&apos;ll arrange delivery for &quot;{query}&quot;.
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onPick(`${query} (hotel)`)}>
            Use this name <ArrowRight size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

function DateTimeMenu({
  date,
  time,
  minDate,
  onPick,
  onDone,
}: {
  date: Date | null
  time: string
  minDate: Date | null
  onPick: (d?: Date, t?: string) => void
  onDone: () => void
}) {
  const today = useMemo(() => startOfLocalDay(), [])
  const earliest = minDate ?? addCalendarDays(today, 1)
  const initialView = date || earliest
  const [view, setView] = useState(() => new Date(initialView.getFullYear(), initialView.getMonth(), 1))

  const month = view.getMonth()
  const year = view.getFullYear()
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))

  const sameDay = (a: Date | null, b: Date | null) => a && b && a.toDateString() === b.toDateString()

  return (
    <div className="bk-menu dt-menu" onClick={(e) => e.stopPropagation()}>
      <div className="dt-cal">
        <div className="cal-head">
          <button type="button" className="cal-iconbtn" onClick={() => setView(new Date(year, month - 1, 1))}>
            <ChevronLeft size={14} />
          </button>
          <h4>{view.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</h4>
          <button type="button" className="cal-iconbtn" onClick={() => setView(new Date(year, month + 1, 1))}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="cal-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="dow">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const disabled = d < earliest
            const cls = ['cal-day']
            if (disabled) cls.push('disabled')
            if (sameDay(d, date)) cls.push('start')
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                className={cls.join(' ')}
                onClick={() => {
                  if (!disabled) onPick(d, undefined)
                }}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
      </div>
      {date ? (
        <div className="dt-time">
          <h5>Pick a time</h5>
          {!time.trim() ? <p className="dt-time-hint">Required — choose a time to continue</p> : null}
          <div className="dt-time-grid">
            {PICK_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                className={time === t ? 'on' : ''}
                onClick={() => {
                  onPick(undefined, t)
                  onDone()
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PaxMenu({
  adults,
  children,
  onChange,
  onDone,
}: {
  adults: number
  children: number
  onChange: (a: number, c: number) => void
  onDone: () => void
}) {
  return (
    <div className="bk-menu pax-menu" onClick={(e) => e.stopPropagation()}>
      <div className="pax-row">
        <div>
          <strong>Adults</strong>
          <span>Age 13+</span>
        </div>
        <div className="pax-stepper">
          <button type="button" onClick={() => onChange(Math.max(0, adults - 1), children)} disabled={adults <= 0}>
            −
          </button>
          <span>{adults}</span>
          <button type="button" onClick={() => onChange(adults + 1, children)} disabled={adults + children >= 14}>
            +
          </button>
        </div>
      </div>
      <div className="pax-row">
        <div>
          <strong>Children</strong>
          <span>Age 0–12 · child seat free</span>
        </div>
        <div className="pax-stepper">
          <button type="button" onClick={() => onChange(adults, Math.max(0, children - 1))} disabled={children <= 0}>
            −
          </button>
          <span>{children}</span>
          <button type="button" onClick={() => onChange(adults, children + 1)} disabled={adults + children >= 14}>
            +
          </button>
        </div>
      </div>
      <button type="button" className="btn btn-leaf btn-sm dt-done" style={{ marginLeft: 'auto' }} onClick={onDone}>
        Confirm <Check size={12} />
      </button>
    </div>
  )
}

const TOP_PICKS_INITIAL_COUNT = 8

function uniquePublicCars(cars: PublicCarRow[]) {
  const seen = new Set<string>()
  return cars.filter((car) => {
    if (seen.has(car.id)) return false
    seen.add(car.id)
    return true
  })
}

function TopPicksSection({
  cars,
  modelQuery,
  onClearModelQuery,
  matchedSearch,
  fleetLocked,
  onRequireTrip,
  onOpenCar,
}: {
  cars: PublicCarRow[]
  modelQuery: string
  onClearModelQuery: () => void
  matchedSearch: boolean
  fleetLocked: boolean
  onRequireTrip: () => void
  onOpenCar: (c: PublicCarRow) => void
}) {
  const [filter, setFilter] = useState<(typeof TOP_TAGS)[number]>('All')
  const [showAll, setShowAll] = useState(false)
  const fleet = useMemo(() => uniquePublicCars(cars), [cars])
  const list = useMemo(() => {
    const t = tagToCategory(filter)
    let next = t === 'all' ? fleet : fleet.filter((c) => c.category === t)
    if (modelQuery.trim()) {
      next = next.filter((car) => matchCarModel(car, modelQuery))
    }
    return next
  }, [fleet, filter, modelQuery])

  const visibleCars = showAll ? list : list.slice(0, TOP_PICKS_INITIAL_COUNT)
  const hiddenCount = Math.max(0, list.length - visibleCars.length)
  const canToggle = hiddenCount > 0

  return (
    <section id="top-picks" className="section" data-screen-label="Top picks">
      <div className="section-head">
        <div className="lead">
          <h2 className="h-section">
            {modelQuery.trim()
              ? `Models matching “${modelQuery.trim()}”`
              : matchedSearch
                ? 'Top picks matched your search'
                : 'Top picks this month'}
          </h2>
          <p className="h-sub">
            {modelQuery.trim()
              ? list.length > 0
                ? `${list.length} vehicle${list.length === 1 ? '' : 's'} in our fleet — tap for details.`
                : 'No models match that name. Try another make or model.'
              : matchedSearch
                ? 'Available for your pickup and return dates — tap a vehicle for details and checkout.'
                : 'Choose pickup and return dates above, then search to see what’s available for your trip.'}
          </p>
          {modelQuery.trim() ? (
            <div className="model-search-bar">
              <span className="model-search-chip">
                <Search size={13} aria-hidden />
                {modelQuery.trim()}
              </span>
              <button type="button" className="model-search-clear" onClick={onClearModelQuery}>
                <X size={14} aria-hidden />
                Clear search
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {TOP_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className={'chip' + (filter === t ? ' active' : '')}
              onClick={() => {
                setFilter(t)
                setShowAll(false)
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="car-grid">
        {visibleCars.map((c) => (
          <FleetCarCard
            key={c.id}
            car={c}
            needsSearch={fleetLocked}
            onRequireTrip={onRequireTrip}
            onOpen={() => onOpenCar(c)}
          />
        ))}
      </div>
      {canToggle ? (
        <div className="row-center">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setShowAll((expanded) => {
                const next = !expanded
                if (!expanded) {
                  requestAnimationFrame(() => {
                    document.getElementById('top-picks')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  })
                }
                return next
              })
            }}
          >
            {showAll ? 'Show fewer vehicles' : `See all vehicles (+${hiddenCount} more)`}
            <ArrowRight size={13} style={showAll ? { transform: 'rotate(-90deg)' } : undefined} />
          </button>
        </div>
      ) : null}
    </section>
  )
}

function FleetCarCard({
  car,
  needsSearch,
  onRequireTrip,
  onOpen,
}: {
  car: PublicCarRow
  needsSearch?: boolean
  onRequireTrip?: () => void
  onOpen: () => void
}) {
  const [fav, setFav] = useState(false)
  const [showLuggage, setShowLuggage] = useState(false)
  const fit = heuristicLuggageFit(car.category)
  const totalBags = fit.lg + fit.sm

  const handleOpen = () => {
    if (needsSearch) {
      onRequireTrip?.()
      return
    }
    onOpen()
  }

  return (
    <>
      <article
        className="car-card"
        onClick={handleOpen}
        onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
        role="button"
        tabIndex={0}
      >
        <div className="car-photo">
          {isHondaNBox(car) ? <span className="tag-oku">OKU friendly</span> : null}
          <span className="tag">{car.category}</span>
          <span
            className={'heart' + (fav ? ' on' : '')}
            onClick={(e) => {
              e.stopPropagation()
              setFav((f) => !f)
            }}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <Heart size={14} fill={fav ? 'currentColor' : 'none'} />
          </span>
          {car.coverPhotoUrl ? (
            <img src={car.coverPhotoUrl} alt={`${car.make} ${car.model}`} loading="lazy" />
          ) : (
            <div style={{ color: 'var(--muted)' }}>No photo</div>
          )}
        </div>
        <div className="car-info">
          <div className="flex between items-center">
            <div className="name">
              {car.make} {car.model}
            </div>
            <span className="rate" title="Fleet vehicle">
              <Star size={12} style={{ color: 'var(--brand-sun)' }} />
              4.8
            </span>
          </div>
          <div className="specs">
            <span>
              <Users size={12} />
              {fit.seats} seats
            </span>
            <span>
              <DoorOpen size={12} />
              {fit.doors} doors
            </span>
            <button
              type="button"
              className="spec-luggage"
              title="Check luggage fit"
              onClick={(e) => {
                e.stopPropagation()
                setShowLuggage(true)
              }}
            >
              <Luggage size={12} />
              {totalBags}
            </button>
          </div>
          <div className="row">
            <div>
              <div className="price-bit">Start from</div>
              <div className="price">
                {formatMYR(car.dailyRateSen)}
                <span className="per"> / day</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={(e) => {
                e.stopPropagation()
                handleOpen()
              }}
            >
              Rent <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </article>
      {showLuggage && <LuggageFitModal car={car} onClose={() => setShowLuggage(false)} />}
    </>
  )
}

function CarCategoriesSection({
  cars,
  fleetLocked,
  onRequireTrip,
  onOpenCar,
}: {
  cars: PublicCarRow[]
  fleetLocked: boolean
  onRequireTrip: () => void
  onOpenCar: (c: PublicCarRow) => void
}) {
  const openCar = (car: PublicCarRow | null) => {
    if (!car) return
    if (fleetLocked) {
      onRequireTrip()
      return
    }
    onOpenCar(car)
  }
  const cats = [
    {
      n: '01',
      key: 'small',
      title: 'Small',
      kicker: 'City-light, wallet-light',
      body: 'Compact rentals for solo days, couples, and quick errands. Easy to park, kind on fuel, perfect for weaving through Pantai Cenang traffic.',
      sample: pickCar(cars, 'economy'),
      bg: '#FFFFFF',
      fleetKeys: ['economy'] as const,
      seats: '1–5 seats',
      bags: '1–2 luggage',
      from: 70,
      dark: false,
      orange: false,
    },
    {
      n: '02',
      key: 'comfort',
      title: 'Comfort',
      kicker: 'Room for the crew',
      body: 'Cooled cabins everyone can stretch into. Perfect for beach days, scenic drives, and family trips — MPVs and spacious rides.',
      sample: pickCar(cars, 'mpv') ?? pickCar(cars, 'economy'),
      bg: '#1A1F22',
      fleetKeys: ['mpv', 'economy'] as const,
      seats: '5–8 seats',
      bags: '3–8 luggage',
      from: 100,
      dark: true,
      orange: false,
    },
    {
      n: '03',
      key: 'adventure',
      title: 'Adventure',
      kicker: 'Hidden beaches & back roads',
      body: 'SUVs and versatile rides for trails, viewpoints, and gear-heavy days — plenty of room for the unexpected.',
      sample: pickCar(cars, 'suv') ?? pickCar(cars, 'other'),
      bg: '#FF6600',
      fleetKeys: ['suv', 'other'] as const,
      seats: '2–7 seats',
      bags: '1–4 luggage',
      from: 200,
      dark: false,
      orange: true,
    },
  ]

  return (
    <section id="categories" className="section cats-v3" data-screen-label="Categories">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">Three clear shapes for three kinds of trip</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Find your perfect ride.
          </h2>
          <p className="h-sub">Small for solo days. Comfort for the whole crew. Adventure for everything off the beaten path.</p>
        </div>
      </div>

      <div className="cat3-list">
        {cats.map((c, i) => {
          const fleetCars = cars.filter((x) => (c.fleetKeys as readonly string[]).includes(x.category))
          const flip = i % 2 === 1
          const cls = ['cat3', flip ? 'flip' : '', c.dark ? 'dark' : '', c.orange ? 'orange' : ''].filter(Boolean).join(' ')
          const sample = c.sample
          return (
            <article key={c.key} className={cls}>
              <div className="cat3-text">
                <div className="cat3-text-top">
                  <span className="cat3-num">{c.n}</span>
                  <span className="cat3-kicker">{c.kicker}</span>
                </div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <div className="cat3-facts">
                  <span>
                    <Users size={14} />
                    <span>{c.seats}</span>
                  </span>
                  <span>
                    <MapPin size={14} />
                    <span>{c.bags}</span>
                  </span>
                  <span>
                    <Sparkles size={14} />
                    <span>from RM {c.from}/day</span>
                  </span>
                </div>
                <div className="cat3-foot">
                  <button type="button" className="btn cat3-cta" onClick={() => openCar(sample)} disabled={!sample}>
                    See {c.title} cars <ArrowRight size={14} />
                  </button>
                  <div className="cat3-mini">
                    {fleetCars.slice(0, 5).map((fc) => (
                      <button key={fc.id} type="button" className="cat3-mini-chip" onClick={() => openCar(fc)} title={`${fc.make} ${fc.model}`}>
                        {fc.coverPhotoUrl ? <img src={fc.coverPhotoUrl} alt={`${fc.make} ${fc.model}`} /> : <span className="text-xs">{fc.model}</span>}
                      </button>
                    ))}
                    {fleetCars.length > 5 && <span className="cat3-mini-more">+{fleetCars.length - 5}</span>}
                  </div>
                </div>
              </div>
              <div className="cat3-art" role="presentation" onClick={() => openCar(sample)}>
                {sample?.coverPhotoUrl ? (
                  <img src={sample.coverPhotoUrl} alt={`${sample.make} ${sample.model}`} />
                ) : (
                  <div style={{ padding: 40, color: '#fff' }}>Browse fleet</div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function CitiesSection({ onPickCity }: { onPickCity: (city: string) => void }) {
  return (
    <section id="locations" className="section" data-screen-label="Locations">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">Pickup & drop-off zones</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Wherever the road takes you on the island.
          </h2>
          <p className="h-sub">
            From the white sand of Pantai Cenang to the quiet of Tanjung Rhu — we deliver across Langkawi, with clear
            meet points.
          </p>
        </div>
        <button type="button" className="btn btn-ghost">
          View on map <MapPin size={13} />
        </button>
      </div>
      <div className="cities">
        {CITIES.map((c) => (
          <button key={c} type="button" className="chip" onClick={() => onPickCity(c)}>
            <MapPin size={12} />
            Car Rental in {c}
          </button>
        ))}
        <button type="button" className="chip" style={{ background: 'var(--canvas-2)', borderStyle: 'dashed' }}>
          + Custom hotel / villa pickup
        </button>
      </div>
    </section>
  )
}

function PromosSection() {
  const promos = [
    {
      cls: 'p1',
      tag: 'Off-peak',
      season: '12 May – 19 Jun 2026',
      title: 'Travel off-peak',
      pct: 40,
      body: 'Monsoon-season family MPVs with stays of 3+ nights — the beaches stay quiet, your wallet stays full.',
    },
    {
      cls: 'p2',
      tag: 'Plan ahead',
      season: 'Book 14+ days out',
      title: 'Book early',
      pct: 25,
      body: 'Any vehicle, auto-applied. Pick the car you actually want — not what is left.',
    },
    {
      cls: 'p3',
      tag: 'Longer stays',
      season: 'Rent 7+ days',
      title: 'Stay longer',
      pct: 30,
      body: 'The per-day rate drops the moment your stay crosses 7 nights. Any car, weekly only.',
    },
  ]
  return (
    <section className="section" data-screen-label="Promotions">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">Smart booking · real value</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Book early. Book off-peak. Pay less.
          </h2>
          <p className="h-sub">
            Three small habits that quietly shave hundreds of ringgit off your rental — auto-applied at checkout, no
            codes to memorize.
          </p>
        </div>
        <button type="button" className="btn btn-ghost">
          See all savings <ArrowRight size={13} />
        </button>
      </div>
      <div className="promo-grid">
        {promos.map((p) => (
          <article key={p.cls} className={'promo ' + p.cls}>
            <div className="promo-body">
              <span className="promo-tag">{p.tag}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <span className="promo-season">{p.season}</span>
            </div>
            <div className="promo-discount">
              <span className="promo-discount-num">
                {p.pct}
                <em>%</em>
              </span>
              <span className="promo-discount-label">off</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function WhyChooseUs() {
  const main = {
    big: '11 yrs',
    bigSub: 'on Langkawi roads',
    title: 'A family-run rental — quietly excellent since 2015.',
    body: 'Same humans answer the phone. Same team meets you at the door. Same fairness in every quote.',
    bullets: ['Freshly serviced at authorized dealers', 'Detailed between every rental', 'Upfront quotes — no hidden fees', 'OKU-friendly vehicles available'],
  }
  const perks = [
    { i: <Sparkles size={18} />, t: 'Comfortable prices', d: 'Upfront pricing, fits any wallet. Even better when you book weekly or monthly.', stat: '0', statLabel: 'hidden fees' },
    { i: <Calendar size={18} />, t: 'Easy 90-second booking', d: 'Reserve online. Free delivery to the airport, jetty, or hotel.', stat: '<2 min', statLabel: 'WhatsApp reply' },
    { i: <Shield size={18} />, t: 'Drive with confidence', d: 'Local team on WhatsApp for pickup help and island tips.', stat: '24/7', statLabel: 'WhatsApp line' },
    { i: <MapPin size={18} />, t: 'A car for every adventure', d: 'Compact city cars to family MPVs — all clean and ready.', stat: 'Fleet', statLabel: 'live availability' },
  ]
  return (
    <section className="section why-section" data-screen-label="Why us">
      <div className="why-hero">
        <div className="why-hero-left">
          <span className="eyebrow">Why Car XQ</span>
          <h2 className="h-section">Planning a trip? Here&apos;s why we&apos;re the top choice.</h2>
          <p className="h-sub">
            Eleven years on the island, thousands of happy guests, one promise — safe, friendly, fairly priced rentals,
            every time.
          </p>
        </div>
        <div className="why-feature">
          <div className="why-feature-big">
            <span className="why-feature-num">{main.big}</span>
            <span className="why-feature-sub">{main.bigSub}</span>
          </div>
          <h3>{main.title}</h3>
          <p>{main.body}</p>
          <ul className="why-bullets">
            {main.bullets.map((b) => (
              <li key={b}>
                <Check size={12} /> {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="why-grid">
        {perks.map((p, i) => (
          <article className="why-card" key={i}>
            <div className="why-card-head">
              <span className="why-icon">{p.i}</span>
              <span className="why-stat">
                <strong>{p.stat}</strong>
                <em>{p.statLabel}</em>
              </span>
            </div>
            <div className="why-card-body">
              <h4>{p.t}</h4>
              <p>{p.d}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function StepByStep() {
  const steps = [
    { n: '01', t: 'Choose your car', d: 'Filter by passengers, vibe, or accessibility — from compacts to MPVs and SUVs.' },
    { n: '02', t: 'Book online', d: 'Enter your details, pick dates, and pay securely. Confirmation lands in your inbox instantly.' },
    { n: '03', t: 'Pick up the car', d: 'We meet you at the airport door, jetty, or hotel for a quick handover, inspection, and key exchange.' },
    { n: '04', t: 'Enjoy the drive', d: 'Explore Langkawi at your own pace. Our local team is one WhatsApp away for tips or roadside help.' },
    { n: '05', t: 'Return the car', d: 'Drop off at the agreed spot. We do a quick final check together — your rental is complete.' },
  ]
  return (
    <section className="section" data-screen-label="Step by step">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">Step by step</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Renting with Car XQ is simple and smooth.
          </h2>
          <p className="h-sub">Five clear steps, dedicated humans behind every one. From booking to return, we&apos;ve got the wheel.</p>
        </div>
      </div>
      <div className="steps-5">
        {steps.map((s) => (
          <div className="step5" key={s.n}>
            <div className="step5-head">
              <span className="step5-num">{s.n}</span>
            </div>
            <div className="step5-body">
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TipsSection() {
  return (
    <section className="section" data-screen-label="Tips">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">Explore like a local</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Tips, guides &amp; news from our island.
          </h2>
          <p className="h-sub">Hidden gems, driving advice, and updates from the Langkawi calendar — written by people who actually live here.</p>
        </div>
        <Link to="/about" className="btn btn-ghost">
          Visit the blog <ArrowRight size={13} />
        </Link>
      </div>
      <div className="tip-grid">
        {BLOG_TIPS.map((p) => (
          <article key={p.id} className="tip-card" role="button" tabIndex={0} onClick={() => scrollToAnchor('booking-dock')} onKeyDown={(e) => e.key === 'Enter' && scrollToAnchor('booking-dock')}>
            <div className="tip-img" style={{ backgroundImage: `url(${p.img})` }}>
              <span className="tip-tag">{p.tag}</span>
            </div>
            <div className="tip-body">
              <h4>{p.title}</h4>
              <p>{p.excerpt}</p>
              <span className="tip-read">
                Read article <ArrowRight size={12} />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AttractionsSection() {
  const [cat, setCat] = useState<(typeof ATTR_CATS)[number]>('All')
  const [activeIdx, setActiveIdx] = useState(0)
  const list = useMemo(
    () => ATTRACTIONS.map((a, i) => ({ ...a, i })).filter((a) => (cat === 'All' ? true : a.c === cat)),
    [cat],
  )
  const hero = list.find((a) => a.i === activeIdx) || list[0]

  return (
    <section className="section attract-section" data-screen-label="Attractions">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">A local&apos;s top 10</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Discover Langkawi at your own pace.
          </h2>
          <p className="h-sub">Curated drives, beach stops, and viewpoints — chase sunsets, not waypoints.</p>
        </div>
        <button type="button" className="btn btn-ghost">
          Open all in Google Maps <MapPin size={13} />
        </button>
      </div>

      <div className="faq2-tabs" role="tablist" style={{ marginBottom: 18 }}>
        {ATTR_CATS.map((c) => {
          const n = c === 'All' ? ATTRACTIONS.length : ATTRACTIONS.filter((a) => a.c === c).length
          return (
            <button
              key={c}
              type="button"
              role="tab"
              className={'faq2-tab' + (cat === c ? ' on' : '')}
              onClick={() => {
                setCat(c)
                const first = ATTRACTIONS.findIndex((a) => (c === 'All' ? true : a.c === c))
                if (first >= 0) setActiveIdx(first)
              }}
            >
              {c}
              <span className="faq2-tab-count">{n}</span>
            </button>
          )
        })}
      </div>

      {hero && (
        <div className="attract-stage">
          <article
            className="attract-hero"
            key={hero.n}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.78) 100%), url(${hero.img})`,
            }}
          >
            <span className="attract-hero-num">{hero.n}</span>
            <div className="attract-hero-foot">
              <span className="attract-hero-kicker">{hero.c}</span>
              <h3>{hero.t}</h3>
              <p>{hero.d}</p>
              <div className="attract-hero-meta">
                <span>
                  <Plane size={12} />
                  <span>{hero.airport} from airport</span>
                </span>
                <span>
                  <MapPin size={12} />
                  <span>{hero.jetty} from jetty</span>
                </span>
                <span>
                  <Clock size={12} />
                  <span>{hero.time}</span>
                </span>
              </div>
              <div className="flex gap-2" style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-leaf btn-sm">
                  <MapPin size={12} /> Open in Maps
                </button>
                <button type="button" className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,.92)' }}>
                  Pin to my trip <Plus size={12} />
                </button>
              </div>
            </div>
          </article>

          <ol className="attract-list">
            {list.map((a) => (
              <li key={a.n} className={'attract-row' + (a.i === activeIdx ? ' on' : '')} onClick={() => setActiveIdx(a.i)} role="presentation">
                <span className="attract-row-num">{a.n}</span>
                <div className="attract-row-body">
                  <h4>{a.t}</h4>
                  <div className="attract-row-meta">
                    <span>{a.c}</span>
                    <span>
                      <Plane size={10} /> {a.airport}
                    </span>
                    <span>
                      <MapPin size={10} /> {a.jetty}
                    </span>
                  </div>
                </div>
                <span className="attract-row-cta">
                  <ArrowRight size={14} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function EssentialLocations() {
  const locs = [
    { t: 'Langkawi Intl Airport', sub: 'Door 3 · LGK', meet: 'Outside Arrivals', hours: '24/7 counter', tag: 'Pickup', accent: 'var(--brand-leaf)', bg: 'rgba(255,102,0,.08)' },
    { t: 'Langkawi Ferry Jetty', sub: 'Kuah Terminal', meet: 'Ferry exit, taxi stand', hours: '06:00 – 22:00', tag: 'Pickup', accent: '#2563EB', bg: '#EAF1FF' },
    { t: 'Sultanah Maliha Hospital', sub: 'Primary hospital', meet: 'Jalan Kuah–Padang Matsirat', hours: '24/7 ER', tag: 'Good to know', accent: '#DC2626', bg: '#FFEAEA', phone: '+60 4 966 3333' },
    { t: 'Langkawi Police HQ', sub: 'IPD Langkawi', meet: 'Persiaran Mutiara, Kuah', hours: '24/7', tag: 'Good to know', accent: '#0F766E', bg: '#E0F2EC', phone: '+60 4 966 6222' },
  ]
  return (
    <section className="section essential-v4" data-screen-label="Essentials">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">Good to know</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Essential locations in Langkawi.
          </h2>
          <p className="h-sub">Two pickup points where we meet you, plus the two numbers worth saving.</p>
        </div>
        <button type="button" className="btn btn-ghost">
          Save all to phone <ArrowRight size={13} />
        </button>
      </div>
      <div className="ess4-grid">
        {locs.map((l, i) => (
          <article className="ess4-card" key={i}>
            <header>
              <span className="ess4-icon" style={{ background: l.bg, color: l.accent }}>
                {i < 2 ? <Plane size={18} /> : <Shield size={18} />}
              </span>
              <span className="ess4-tag">{l.tag}</span>
            </header>
            <h4>{l.t}</h4>
            <span className="ess4-sub">{l.sub}</span>
            <div className="ess4-meta">
              <span>
                <MapPin size={11} /> {l.meet}
              </span>
              <span>
                <Clock size={11} /> {l.hours}
              </span>
              {'phone' in l && l.phone && (
                <span style={{ color: l.accent, fontWeight: 600 }}>
                  <Phone size={11} /> {l.phone}
                </span>
              )}
            </div>
            <footer>
              <button type="button" className="ess4-link">
                <MapPin size={12} /> Maps
              </button>
              <button type="button" className="ess4-link">
                <ArrowRight size={12} /> Copy
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}

function FAQSection() {
  const [cat, setCat] = useState<(typeof FAQ_CATS)[number]['id']>('All')
  const [openId, setOpenId] = useState(0)
  const list = useMemo(() => FAQS.map((f, i) => ({ ...f, i })).filter((f) => (cat === 'All' ? true : f.c === cat)), [cat])
  const active = list.find((f) => f.i === openId) || list[0]

  return (
    <section id="faq" className="section faq-v2" data-screen-label="FAQ">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">All you need to know</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Car XQ rentals · FAQ.
          </h2>
          <p className="h-sub">From age requirements to booking policies — clear, honest answers so you can start your island adventure with confidence.</p>
        </div>
      </div>

      <div className="faq2-tabs" role="tablist">
        {FAQ_CATS.map((c) => {
          const n = c.id === 'All' ? FAQS.length : FAQS.filter((f) => f.c === c.id).length
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              className={'faq2-tab' + (cat === c.id ? ' on' : '')}
              onClick={() => {
                setCat(c.id)
                const first = FAQS.findIndex((f) => (c.id === 'All' ? true : f.c === c.id))
                setOpenId(first >= 0 ? first : 0)
              }}
            >
              {c.label}
              <span className="faq2-tab-count">{n}</span>
            </button>
          )
        })}
      </div>

      {active && (
        <div className="faq2-stage">
          <article className="faq2-detail" key={active.i}>
            <span className="faq2-cat">{active.c}</span>
            <h3>{active.q}</h3>
            <p>{active.a}</p>
            <div className="faq2-divider" />
            <div className="faq2-related">
              <span className="faq2-related-label">Related</span>
              <div className="faq2-related-list">
                {list
                  .filter((f) => f.i !== active.i)
                  .slice(0, 3)
                  .map((r) => (
                    <button key={r.i} type="button" className="faq2-related-item" onClick={() => setOpenId(r.i)}>
                      {r.q}
                      <ArrowRight size={12} />
                    </button>
                  ))}
              </div>
            </div>
            <div className="faq2-contact">
              <div>
                <span className="faq2-contact-eyebrow">Still stuck? Real humans, fast replies.</span>
                <div className="faq2-contact-row">
                  <a className="faq2-contact-pill" href="tel:+601135215576">
                    <Phone size={12} /> +60 11 3521 5576
                  </a>
                  <span className="faq2-contact-pill">
                    <Phone size={12} /> WhatsApp · usually replies in 4 min
                  </span>
                </div>
              </div>
            </div>
          </article>

          <aside className="faq2-side">
            <div className="faq2-side-head">
              <span>
                {list.length} question{list.length === 1 ? '' : 's'}
              </span>
              <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>Tap to read</span>
            </div>
            <ol className="faq2-side-list">
              {list.map((f) => (
                <li key={f.i} className={'faq2-side-item' + (f.i === active.i ? ' on' : '')} onClick={() => setOpenId(f.i)} role="presentation">
                  <span className="faq2-side-num">{String(f.i + 1).padStart(2, '0')}</span>
                  <span className="faq2-side-q">{f.q}</span>
                  <span className="faq2-side-arrow">
                    <ArrowRight size={13} />
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </section>
  )
}

function ReelsSection({ onOpenReel }: { onOpenReel: (r: (typeof REELS)[number]) => void }) {
  const railRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' })
  }
  return (
    <section className="section reels-section" data-screen-label="Reels">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">From our guests · #CarXQTrips</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Real trips, real wheels.
          </h2>
          <p className="h-sub">
            Clips and stories travelers share with us each week — tag <b style={{ color: 'var(--brand-leaf)' }}>#CarXQTrips</b> on Instagram or WhatsApp and we&apos;ll feature you.
          </p>
        </div>
        <div className="reels-nav">
          <button type="button" className="cal-iconbtn" aria-label="Scroll back" onClick={() => scroll(-1)}>
            <ChevronLeft size={14} />
          </button>
          <button type="button" className="cal-iconbtn" aria-label="Scroll forward" onClick={() => scroll(1)}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="reels-rail" ref={railRef}>
        {REELS.map((r) => (
          <article key={r.id} className="reel" role="button" tabIndex={0} onClick={() => onOpenReel(r)} onKeyDown={(e) => e.key === 'Enter' && onOpenReel(r)}>
            <video
              className="reel-vid"
              src={r.clip}
              poster={r.thumb}
              muted
              loop
              playsInline
              preload="metadata"
              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => {
                e.currentTarget.pause()
                e.currentTarget.currentTime = 0
              }}
            />
            <div className="reel-overlay">
              <span className="reel-play">
                <ArrowRight size={18} style={{ transform: 'translateX(1px)' }} />
              </span>
              <div className="reel-meta">
                <div className="reel-meta-top">
                  <span className="reel-avatar">{r.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                  <div>
                    <strong>{r.name}</strong>
                    <em>
                      @{r.name.toLowerCase().replace(/\s/g, '')} · {r.city}
                    </em>
                  </div>
                </div>
                <p className="reel-caption">{r.caption}</p>
                <div className="reel-stats">
                  <span>
                    <Heart size={12} /> {r.likes}
                  </span>
                  <span>
                    <Sparkles size={12} /> {r.views}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const featured = REVIEWS[featuredIdx]
  const others = REVIEWS.map((r, i) => ({ ...r, i })).filter((r) => r.i !== featuredIdx).slice(0, 4)

  return (
    <section className="section testimonials-v2" data-screen-label="Reviews">
      <div className="testi-head">
        <div className="testi-lead">
          <span className="eyebrow">Trusted by travelers since 2015</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            What our customers say.
          </h2>
          <p className="h-sub">Thousands of guests, one consistent story: a clean car, a clear price, and friendly local hands when you need them.</p>
        </div>
        <div className="testi-rating">
          <div className="testi-score">4.9</div>
          <div className="testi-score-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} style={{ color: 'var(--brand-leaf)' }} fill="var(--brand-leaf)" />
            ))}
            <div className="testi-score-label">
              from <b>1,420</b> verified rentals
            </div>
          </div>
        </div>
      </div>

      <div className="testi-stage">
        <article className="testi-feature">
          <div className="testi-stars">
            {Array.from({ length: featured.r }).map((_, j) => (
              <Star key={j} size={16} style={{ color: 'var(--brand-leaf)' }} fill="var(--brand-leaf)" />
            ))}
          </div>
          <div className="testi-quote-mark">&ldquo;</div>
          <p className="testi-quote">{featured.body}</p>
          <div className="testi-feature-foot">
            <div className="testi-avatar" style={{ background: '#1A1F22' }}>
              {featured.n
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="testi-name">{featured.n}</div>
              <div className="testi-meta">{featured.role}</div>
            </div>
            <div className="testi-trip">
              <Check size={11} /> {featured.trip}
              <span>{featured.date}</span>
            </div>
          </div>
        </article>

        <div className="testi-side">
          <div className="testi-side-head">
            <span>More guest stories</span>
            <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>Tap to read</span>
          </div>
          {others.map((r) => (
            <button key={r.i} type="button" className="testi-mini" onClick={() => setFeaturedIdx(r.i)}>
              <div className="testi-avatar sm" style={{ background: '#1A1F22' }}>
                {r.n
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="testi-mini-body">
                <div className="testi-mini-top">
                  <span className="testi-name">{r.n}</span>
                  <span className="testi-mini-stars">
                    {Array.from({ length: r.r }).map((_, j) => (
                      <Star key={j} size={10} style={{ color: 'var(--brand-leaf)' }} fill="var(--brand-leaf)" />
                    ))}
                  </span>
                </div>
                <p>{r.body.length > 96 ? `${r.body.slice(0, 96)}…` : r.body}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="testi-footstrip">
        <div className="testi-source">
          <span className="testi-source-logo">G</span>
          <div>
            <b>4.9 ★</b> Google reviews <span style={{ color: 'var(--muted-2)' }}>· 980 ratings</span>
          </div>
        </div>
        <div className="testi-source">
          <span className="testi-source-logo">T</span>
          <div>
            <b>4.8 ★</b> Tripadvisor <span style={{ color: 'var(--muted-2)' }}>· 312 ratings</span>
          </div>
        </div>
        <div className="testi-source">
          <span className="testi-source-logo">B</span>
          <div>
            <b>9.2 / 10</b> Booking.com <span style={{ color: 'var(--muted-2)' }}>· 128 ratings</span>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
          Read all reviews <ArrowRight size={12} />
        </button>
      </div>
    </section>
  )
}

function CruiseBanner() {
  return (
    <section className="section cruise-section" data-screen-label="Cruise">
      <article className="cruise-banner">
        <div className="cruise-banner-art">
          <div className="cruise-sun" />
          <svg className="cruise-water" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 120 Q 150 100 300 120 T 600 120 T 900 120 T 1200 120 V 200 H 0 Z" fill="rgba(255,255,255,.18)" />
            <path d="M0 150 Q 150 130 300 150 T 600 150 T 900 150 T 1200 150 V 200 H 0 Z" fill="rgba(255,255,255,.28)" />
            <path d="M0 180 Q 150 160 300 180 T 600 180 T 900 180 T 1200 180 V 200 H 0 Z" fill="rgba(255,255,255,.42)" />
          </svg>
          <svg className="cruise-boat" viewBox="0 0 200 90" aria-hidden="true">
            <path d="M30 70 L170 70 L150 80 L50 80 Z" fill="#1A1F22" />
            <rect x="60" y="50" width="80" height="20" fill="#fff" />
            <path d="M100 10 L100 50 L140 50 Z" fill="#fff" />
            <path d="M100 20 L100 50 L70 50 Z" fill="rgba(255,255,255,.85)" />
          </svg>
          <span className="cruise-bird" style={{ top: '18%', left: '62%' }}>
            ~
          </span>
          <span className="cruise-bird" style={{ top: '12%', left: '70%', fontSize: 14 }}>
            ~
          </span>
          <span className="cruise-bird" style={{ top: '22%', left: '80%', fontSize: 18 }}>
            ~
          </span>
        </div>

        <div className="cruise-banner-body">
          <span className="cruise-eyebrow">
            <Sparkles size={11} /> New from Car XQ Holidays
          </span>
          <h2>The XQ Sunset Cruise.</h2>
          <p>Two hours of golden hour off Pantai Kok — fresh seafood plate, free-flow drinks, and a Langkawi sunset you&apos;ll be looking at for years.</p>
          <div className="cruise-bullets">
            <span>
              <Check size={12} /> Departs daily · 5:30 PM
            </span>
            <span>
              <Check size={12} /> Up to 12 guests · private option
            </span>
            <span>
              <Check size={12} /> Free hotel transfer for renters
            </span>
          </div>
          <div className="cruise-actions">
            <div className="cruise-price">
              <span className="cruise-price-from">From</span>
              <strong>
                RM 220<em>/pax</em>
              </strong>
              <span className="cruise-price-strike">RM 280</span>
            </div>
            <button type="button" className="btn btn-leaf btn-lg">
              Book the cruise <ArrowRight size={14} />
            </button>
            <button type="button" className="btn btn-ghost btn-lg" style={{ background: 'rgba(255,255,255,.92)' }}>
              See full menu
            </button>
          </div>
          <span className="cruise-foot">
            Ask our team about cruise inclusions when you book
          </span>
        </div>
      </article>
    </section>
  )
}

function FooterCta({ onPlan }: { onPlan: () => void }) {
  return (
    <div className="footer-cta">
      <div className="card-left">
        <div className="top">
          <div className="icon-box">
            <Sun size={18} />
          </div>
          <div>
            <h3>
              Beyond the keys —
              <br />
              memories of a lifetime.
            </h3>
            <p>Bundle a car with a ferry, an island hop, or a kelong dinner. We help you stitch a perfect day, you just drive.</p>
          </div>
          <button type="button" className="btn btn-sm" onClick={onPlan}>
            Plan a trip <ArrowRight size={12} />
          </button>
        </div>
        <div className="bottom">
          <div>
            <h4>Cars on this site</h4>
            <div className="big">Live</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,.7)', textAlign: 'right' }}>
            refreshed on load
            <br />
            Langkawi fleet
          </div>
        </div>
      </div>
      <div className="right-img">
        <h3>
          Comfortable prices,
          <br />
          from coastline to highland.
        </h3>
      </div>
    </div>
  )
}

export function SiteFooter({
  onScrollBooking,
  onScrollFleet,
}: {
  onScrollBooking?: () => void
  onScrollFleet?: () => void
}) {
  return (
    <footer className="site-footer">
      <div className="cols">
        <div>
          <div className="brand" style={{ color: '#fff' }}>
            <BrandLogo size={36} />
            <span style={{ fontWeight: 700 }}>
              Car<span style={{ color: 'var(--brand-leaf)' }}>XQ</span>
            </span>
          </div>
          <p className="tag">Affordable, safe car rentals in Langkawi. Family-owned since 2015 — friendly humans on WhatsApp, always.</p>
          <div className="socials">
            <a href="https://instagram.com" aria-label="Instagram">
              <Sparkles size={14} />
            </a>
            <a href="https://twitter.com" aria-label="Twitter">
              <ArrowRight size={14} />
            </a>
            <a href="https://facebook.com" aria-label="Facebook">
              <Users size={14} />
            </a>
          </div>
        </div>
        <div>
          <h5>Plan your trip</h5>
          <ul>
            <li>
              <Link to="/guides/pick-car">Pick the right car</Link>
            </li>
            <li>
              <Link to="/guides/pickup-return">Pickup &amp; return guide</Link>
            </li>
            <li>
              <Link to="/guides/plan-drive">Plan my drive</Link>
            </li>
            <li>
              <Link to="/guides/know-how">Know-how (fines, fuel, parking)</Link>
            </li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li>
              <Link to="/about">About Car XQ</Link>
            </li>
            <li>
              {onScrollFleet ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-left font-inherit text-inherit"
                  onClick={onScrollFleet}
                >
                  Our fleet
                </button>
              ) : (
                <Link to="/" hash="top-picks">
                  Our fleet
                </Link>
              )}
            </li>
            <li>
              <Link to="/about">Journal &amp; news</Link>
            </li>
            <li>
              <Link to="/login">Customer login</Link>
            </li>
          </ul>
        </div>
        <div>
          <h5>Get the deals</h5>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', margin: '0 0 10px', lineHeight: 1.55 }}>
            One short email a month, no spam. Surprise upgrades for subscribers.
          </p>
          <div className="subscribe">
            <input placeholder="you@example.com" readOnly aria-label="Email" />
            <button type="button">Subscribe</button>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', margin: '12px 0 0' }}>
            <Phone size={11} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            24/7 roadside · +60 11 3521 5576
          </p>
        </div>
      </div>
      <div className="bottom">
        <span>© {new Date().getFullYear()} Car XQ Holidays · XQ Car Fleet platform</span>
        <span>
          <Link to="/about" style={{ marginRight: 18 }}>
            Privacy
          </Link>
          <Link to="/about">Terms of service</Link>
        </span>
      </div>
    </footer>
  )
}

function ReelLightbox({ reel, onClose }: { reel: (typeof REELS)[number]; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    ref.current?.play().catch(() => {})
  }, [])
  return (
    <div className="reel-lightbox" role="presentation" onClick={onClose}>
      <button type="button" className="close-btn" aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, zIndex: 5 }}>
        <X size={16} />
      </button>
      <div className="reel-lightbox-inner" role="presentation" onClick={(e) => e.stopPropagation()}>
        <video ref={ref} src={reel.clip} poster={reel.thumb} controls loop playsInline className="reel-lightbox-video" />
        <div className="reel-lightbox-side">
          <div className="reel-meta-top" style={{ marginBottom: 12 }}>
            <span className="reel-avatar" style={{ background: 'var(--brand-leaf)' }}>
              {reel.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <strong style={{ color: '#fff' }}>{reel.name}</strong>
              <em style={{ color: 'rgba(255,255,255,.6)' }}>
                @{reel.name.toLowerCase().replace(/\s/g, '')} · {reel.city}
              </em>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,.86)', fontSize: 15, lineHeight: 1.55, margin: 0 }}>{reel.caption}</p>
          <div className="reel-lightbox-stats">
            <span>
              <Heart size={13} /> {reel.likes}
            </span>
            <span>
              <Sparkles size={13} /> {reel.views}
            </span>
          </div>
          <div className="reel-lightbox-actions">
            <button type="button" className="btn btn-leaf btn-sm">
              <Heart size={13} /> Like
            </button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>
              <ArrowRight size={13} /> Share
            </button>
          </div>
          <div className="reel-lightbox-cta">
            <strong>Want to drive this?</strong>
            <span>Browse live availability and book in minutes.</span>
            <button type="button" className="btn btn-leaf btn-sm" onClick={() => scrollToAnchor('booking-dock')}>
              Browse cars <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
