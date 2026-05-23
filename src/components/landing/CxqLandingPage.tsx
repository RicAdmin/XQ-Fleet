import './cxq-landing-scoped.css'
import './cxq-landing-overrides.css'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Anchor,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
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
import { BrandName } from '#/components/BrandName'
import { LanguageSwitcher } from '#/components/i18n/LanguageSwitcher'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import { PaymentMethodIcons } from '#/components/landing/payment-method-icons'
import { LoadingSpinner } from '#/components/ui/LoadingSpinner'
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
  HERO_BG,
  FOOTER_CTA_FLEET_IMAGE,
  FOOTER_CTA_SCENERY_IMAGE,
  HOTELS,
  PICK_TIMES,
  RENTAL_LOCATIONS,
} from './cxq-landing-data'
import { reelsForLocale, type Reel } from '#/lib/reels-config'
import {
  TESTIMONIAL_HEADLINE_SCORE,
  TESTIMONIAL_SOURCE,
  testimonialInitials,
  testimonialsForLocale,
} from '#/lib/testimonials-config'
import { usePublicI18n } from '#/i18n/usePublicI18n'
import { useLandingContent } from '#/i18n/useLandingContent'
import type { TranslateFn } from '#/i18n/translate'

function formatMYR(sen: number) {
  return `RM ${Math.round(sen / 100).toLocaleString()}`
}

function fmtDate(d: Date | null, selectLabel: string) {
  return d
    ? d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    : selectLabel
}

function fmtTime(time: string, selectLabel: string) {
  return time.trim() || selectLabel
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

function categoryTagLabel(tag: (typeof TOP_TAGS)[number], t: TranslateFn): string {
  const keys = {
    All: 'common.all',
    Economy: 'common.economy',
    MPV: 'common.mpv',
    SUV: 'common.suv',
    Other: 'common.other',
  } as const
  return t(keys[tag])
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
  const [activeReel, setActiveReel] = useState<Reel | null>(null)
  const [searching, setSearching] = useState(false)
  const [bookingPrompt, setBookingPrompt] = useState<string | null>(null)
  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)

  const { data: session, isPending: sessionPending } = authClient.useSession()
  const user = session?.user
  const { t, locale } = usePublicI18n()
  const reels = useMemo(() => reelsForLocale(locale), [locale])
  const activeReelLocalized = useMemo(() => {
    if (!activeReel) return null
    return reels.find((r) => r.id === activeReel.id) ?? activeReel
  }, [activeReel, reels])

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
    let message = t('common.searchCarsPrompt')
    if (!isAllowedReturnDate(booking.pickDate, booking.retDate)) {
      message = t('common.chooseDatesPrompt')
    } else if (!booking.pickTime.trim() || !booking.retTime.trim()) {
      message = t('common.chooseTimesPrompt')
    }
    setBookingPrompt(message)
    scrollToAnchor('booking-dock')
  }, [booking, t])

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

  const bookMini = useCallback(() => {
    const mini =
      cars.find((c) => c.id === 'mini-convertible') ??
      cars.find((c) => c.make.toLowerCase() === 'mini')
    if (mini) {
      tryOpenCar(mini)
      return
    }
    scrollToAnchor('booking-dock')
  }, [cars, tryOpenCar])

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
      <div className="page" data-screen-label="XQ Car Landing">
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
        <CitiesSection />
        <PromosSection />
        <WhyChooseUs />
        <StepByStep />
        <TipsSection />
        <AttractionsSection />
        <EssentialLocations />
        <FAQSection />
        <ReelsSection reels={reels} onOpenReel={setActiveReel} />
        <TestimonialsSection />
        <CruiseBanner />
        <FooterCta onSearch={() => scrollToAnchor('booking-dock')} onBookMini={bookMini} />
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
        {activeReelLocalized && (
          <ReelLightbox
            reel={activeReelLocalized}
            reels={reels}
            onClose={() => setActiveReel(null)}
            onChange={setActiveReel}
          />
        )}
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
  const { t } = usePublicI18n()
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
        placeholder={t('nav.searchPlaceholder')}
        aria-label={t('nav.searchAria')}
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
          aria-label={t('nav.clearSearch')}
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
  const [authUiReady, setAuthUiReady] = useState(false)
  useEffect(() => {
    setAuthUiReady(true)
  }, [])
  const resolvedModelQuery = modelQuery ?? localModelQuery
  const resolvedOnModelQueryChange = onModelQueryChange ?? setLocalModelQuery
  const resolvedOnClearModelQuery =
    onClearModelQuery ??
    (() => {
      resolvedOnModelQueryChange('')
    })
  const initials = user?.name ? initialsFromName(user.name) : ''
  const onHero = appearance === 'on-hero'
  const { t, href, hasLocale } = usePublicI18n()
  const homePath = href('/')

  return (
    <nav className={'nav' + (onHero ? '' : ' nav--solid-light')}>
      <Link to={homePath as '/'}>
        <div className="brand" style={{ color: onHero ? '#fff' : 'var(--ink)' }}>
          <BrandLogo size={48} />
          <BrandName />
        </div>
      </Link>
      <div className="nav-links">
        {sectionLinks === 'home' ? (
          <>
            <Link to={homePath as '/'} hash="booking-dock" className="nav-ghost-link active">
              {t('nav.findCar')}
            </Link>
            <Link to={homePath as '/'} hash="top-picks" className="nav-ghost-link">
              {t('nav.ourFleet')}
            </Link>
            <Link to={homePath as '/'} hash="categories" className="nav-ghost-link">
              {t('nav.categories')}
            </Link>
            <Link to={homePath as '/'} hash="locations" className="nav-ghost-link">
              {t('nav.locations')}
            </Link>
            <Link to={homePath as '/'} hash="faq" className="nav-ghost-link">
              {t('nav.help')}
            </Link>
          </>
        ) : (
          <>
            <button type="button" className="active" onClick={() => scrollToAnchor('booking-dock')}>
              {t('nav.findCar')}
            </button>
            <button type="button" onClick={onScrollFleet}>
              {t('nav.ourFleet')}
            </button>
            <button type="button" onClick={onScrollCategories}>
              {t('nav.categories')}
            </button>
            <button type="button" onClick={onScrollLocations}>
              {t('nav.locations')}
            </button>
            <button type="button" onClick={onScrollHelp}>
              {t('nav.help')}
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
        {hasLocale ? (
          <LanguageSwitcher />
        ) : (
          <span className="flex items-center gap-2" style={{ opacity: 0.9 }}>
            <Globe size={14} /> EN · MYR
          </span>
        )}
        {!authUiReady || sessionPending ? (
          <span className="nav-session-pending" aria-label={t('nav.loadingAccount')}>
            <LoadingSpinner size={16} />
          </span>
        ) : !user ? (
          <>
            <LocaleLink to="/login">{t('nav.logIn')}</LocaleLink>
            <LocaleLink to="/register" className="signup">
              {t('nav.signUp')}
            </LocaleLink>
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
                    <div className="nav-user-name">{user.name ?? t('nav.account')}</div>
                    <div className="nav-user-email">{user.email}</div>
                  </div>
                </div>
                <Link to="/account/profile" onClick={() => setNavMenuOpen(false)}>
                  <Users size={14} /> {t('nav.profile')}
                </Link>
                <Link to="/account/rentals" onClick={() => setNavMenuOpen(false)}>
                  <Calendar size={14} /> {t('nav.myRentals')}
                </Link>
                <Link to="/account/notifications" onClick={() => setNavMenuOpen(false)}>
                  <Bell size={14} /> {t('nav.notifications')}
                </Link>
                <div className="nav-user-divider" />
                <button
                  type="button"
                  className="w-full cursor-pointer border-0 bg-transparent p-0 text-left font-inherit"
                  style={{ color: 'var(--brand-coral)' }}
                  onClick={async () => {
                    setNavMenuOpen(false)
                    await authClient.signOut()
                    window.location.href = homePath
                  }}
                >
                  <ArrowRight size={14} /> {t('nav.signOut')}
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
  const { t } = usePublicI18n()
  return (
    <section className="hero layout-bleed" data-screen-label="Hero">
      <div className="stage" style={{ backgroundImage: `url('${encodeURI(HERO_BG)}')` }}>
        <div className="hero-title-block">
          <span className="eyebrow hero-eyebrow-full">{t('hero.eyebrowFull')}</span>
          <span className="eyebrow hero-eyebrow-short">{t('hero.eyebrowShort')}</span>
          <h1 className="h-display">
            {t('hero.titleLine1')}
            <br />
            {t('hero.titleLine2')}
          </h1>
          <p>{t('hero.subtitle')}</p>
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
  required = false,
  invalid = false,
  error,
}: {
  active: boolean
  onToggle: () => void
  label: ReactNode
  value: ReactNode
  menu: ReactNode | null
  required?: boolean
  invalid?: boolean
  error?: string | null
}) {
  return (
    <div
      className={
        'bk-field' + (active ? ' active' : '') + (invalid ? ' bk-field--invalid' : '')
      }
      style={{ position: 'relative' }}
    >
      <button
        type="button"
        className="bk-field-trigger"
        onClick={onToggle}
        aria-invalid={invalid || undefined}
      >
        <span className="lbl">
          {label}
          {required ? <span className="field-required-mark" aria-hidden="true"> *</span> : null}
        </span>
        <span className="val">{value}</span>
      </button>
      {error ? (
        <span className="bk-field-error" role="alert">
          {error}
        </span>
      ) : null}
      {menu}
    </div>
  )
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
  const { t } = usePublicI18n()
  const locAirport = t('common.airport')
  const locJetty = t('common.jetty')
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
  const showFieldWarnings = Boolean(prompt)
  const missingPick = !booking.pickDate || !booking.pickTime.trim()
  const missingRet = !booking.retDate || !booking.retTime.trim()

  return (
    <div id="booking-dock" className="booking-dock" ref={rootRef}>
      {prompt ? (
        <p className="bk-prompt" role="alert">
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
            <ArrowRight size={12} style={{ transform: 'rotate(-90deg)' }} /> {t('booking.roundTrip')}
          </button>
          <button
            type="button"
            className={booking.tripType === 'oneway' ? 'on' : ''}
            onClick={() => setBooking((b) => ({ ...b, tripType: 'oneway' }))}
          >
            <ArrowRight size={12} /> {t('booking.differentReturn')}
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
          label={t('booking.pickupLocation')}
          value={
            <>
              <MapPin size={14} className="icon" />
              {booking.from || t('booking.pickupPlaceholder')}
            </>
          }
          menu={
            open === 'from' ? (
              <LocationMenu
                locAirport={locAirport}
                locJetty={locJetty}
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
            label={t('booking.returnLocation')}
            value={
              <>
                <MapPin size={14} className="icon" />
                {booking.retLoc || t('booking.returnPlaceholder')}
              </>
            }
            menu={
              open === 'to' ? (
                <LocationMenu
                  locAirport={locAirport}
                  locJetty={locJetty}
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
          label={t('booking.pickup')}
          required
          invalid={showFieldWarnings && missingPick}
          error={showFieldWarnings && missingPick ? t('booking.selectPickupError') : null}
          value={
            <>
              <Calendar size={14} className="icon" />
              <span className="bk-date">{fmtDate(booking.pickDate, t('common.selectDate'))}</span>
              <span className="bk-sep">·</span>
              <span className={'bk-time' + (booking.pickTime.trim() ? '' : ' bk-time--empty')}>
                {fmtTime(booking.pickTime, t('common.selectTime'))}
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
                onPrompt?.(t('booking.selectPickupFirst'))
                setOpen('pick')
                return
              }
            }
            openField(open === 'ret' ? null : 'ret')
          }}
          label={t('booking.return')}
          required
          invalid={showFieldWarnings && missingRet}
          error={showFieldWarnings && missingRet ? t('booking.selectReturnError') : null}
          value={
            <>
              <Calendar size={14} className="icon" />
              <span className="bk-date">{fmtDate(booking.retDate, t('common.selectDate'))}</span>
              <span className="bk-sep">·</span>
              <span className={'bk-time' + (booking.retTime.trim() ? '' : ' bk-time--empty')}>
                {fmtTime(booking.retTime, t('common.selectTime'))}
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
          label={<>{t('booking.passengersOptional')}</>}
          value={
            <>
              <Users size={14} className="icon" />
              {totalPax > 0 ? (
                <>
                  <span>
                    {totalPax}{' '}
                    {totalPax > 1 ? t('booking.passengers') : t('booking.passenger')}
                  </span>
                  <span className="bk-sep">·</span>
                  <span className="bk-time">
                    {booking.adults}{' '}
                    {booking.adults !== 1 ? t('booking.adults') : t('booking.adult')}
                    {booking.children > 0
                      ? `, ${booking.children} ${t('booking.child')}`
                      : ''}
                  </span>
                </>
              ) : (
                <span>{t('booking.anyGroupSize')}</span>
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
          title={datesReady ? undefined : t('booking.datesTimesFirst')}
        >
          {searching ? (
            <>
              <LoadingSpinner size={15} aria-hidden />
              {t('booking.searching')}
            </>
          ) : (
            <>
              <Search size={15} /> {t('common.searchCars')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function LocationMenu({
  locAirport,
  locJetty,
  onPick,
}: {
  locAirport: string
  locJetty: string
  onPick: (loc: string) => void
}) {
  const { t } = usePublicI18n()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!query.trim()) return []
    return HOTELS.filter((h) => h.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
  }, [query])

  return (
    <div className="bk-menu loc-menu" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <div className="loc-group-label">{t('booking.pickupPoints')}</div>
      <button type="button" className="loc-item" onClick={() => onPick(locAirport)}>
        <span className="loc-icon">
          <Plane size={14} />
        </span>
        <span className="loc-body">
          <strong>{t('booking.airportName')}</strong>
          <span>{t('booking.airportDetail')}</span>
        </span>
        <span className="loc-pill">{t('booking.freeLabel')}</span>
      </button>
      <button type="button" className="loc-item" onClick={() => onPick(locJetty)}>
        <span className="loc-icon">
          <MapPin size={14} />
        </span>
        <span className="loc-body">
          <strong>{t('booking.jettyName')}</strong>
          <span>{t('booking.jettyDetail')}</span>
        </span>
        <span className="loc-pill">{t('booking.freeLabel')}</span>
      </button>

      <div className="loc-group-label" style={{ marginTop: 6 }}>
        {t('booking.hotelDelivery')}
      </div>
      <div className="loc-search">
        <Search size={13} />
        <input
          placeholder={t('booking.hotelPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {query && filtered.length > 0 && (
        <ul className="loc-hotel-list">
          {filtered.map((h) => (
            <li key={h} onClick={() => onPick(`${h}${t('booking.hotelDeliverySuffix')}`)} onKeyDown={() => {}} role="presentation">
              <MapPin size={12} />
              {h}
            </li>
          ))}
        </ul>
      )}
      {query && filtered.length === 0 && (
        <div className="loc-empty">
          {t('booking.locEmptyArrange', { query })}
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onPick(`${query}${t('booking.hotelCustomSuffix')}`)}>
            {t('booking.useThisName')} <ArrowRight size={11} />
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
  const { t } = usePublicI18n()
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
          <h5>{t('booking.pickTime')}</h5>
          {!time.trim() ? <p className="dt-time-hint">{t('booking.timeRequired')}</p> : null}
          <div className="dt-time-grid">
            {PICK_TIMES.map((slot) => (
              <button
                key={slot}
                type="button"
                className={time === slot ? 'on' : ''}
                onClick={() => {
                  onPick(undefined, slot)
                  onDone()
                }}
              >
                {slot}
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
  const { t } = usePublicI18n()
  return (
    <div className="bk-menu pax-menu" onClick={(e) => e.stopPropagation()}>
      <div className="pax-row">
        <div>
          <strong>{t('booking.adultsLabel')}</strong>
          <span>{t('booking.adultsAge')}</span>
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
          <strong>{t('booking.childrenLabel')}</strong>
          <span>{t('booking.childrenAge')}</span>
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
        {t('common.confirm')} <Check size={12} />
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
  const { t } = usePublicI18n()
  const [filter, setFilter] = useState<(typeof TOP_TAGS)[number]>('All')
  const [showAll, setShowAll] = useState(false)
  const fleet = useMemo(() => uniquePublicCars(cars), [cars])
  const list = useMemo(() => {
    const cat = tagToCategory(filter)
    let next = cat === 'all' ? fleet : fleet.filter((c) => c.category === cat)
    if (modelQuery.trim()) {
      next = next.filter((car) => matchCarModel(car, modelQuery))
    }
    return next
  }, [fleet, filter, modelQuery])

  const trimmedQuery = modelQuery.trim()
  const title = trimmedQuery
    ? t('landing.topPicksModelsMatching', { query: trimmedQuery })
    : matchedSearch
      ? t('landing.topPicksMatchedSearch')
      : t('landing.topPicksDefault')
  const subtitle = trimmedQuery
    ? list.length > 0
      ? t('landing.topPicksSubCount', { count: list.length })
      : t('landing.topPicksSubNoMatch')
    : matchedSearch
      ? t('landing.topPicksSubMatched')
      : t('landing.topPicksSubDefault')

  const visibleCars = showAll ? list : list.slice(0, TOP_PICKS_INITIAL_COUNT)
  const hiddenCount = Math.max(0, list.length - visibleCars.length)
  const canToggle = hiddenCount > 0

  return (
    <section id="top-picks" className="section" data-screen-label="Top picks">
      <div className="section-head">
        <div className="lead">
          <h2 className="h-section">{title}</h2>
          <p className="h-sub">{subtitle}</p>
          {trimmedQuery ? (
            <div className="model-search-bar">
              <span className="model-search-chip">
                <Search size={13} aria-hidden />
                {trimmedQuery}
              </span>
              <button type="button" className="model-search-clear" onClick={onClearModelQuery}>
                <X size={14} aria-hidden />
                {t('nav.clearSearch')}
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {TOP_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={'chip' + (filter === tag ? ' active' : '')}
              onClick={() => {
                setFilter(tag)
                setShowAll(false)
              }}
            >
              {categoryTagLabel(tag, t)}
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
            {showAll ? t('booking.showFewer') : t('booking.seeAllMore', { count: hiddenCount })}
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
  const { t } = usePublicI18n()
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
          {isHondaNBox(car) ? <span className="tag-oku">{t('booking.okuFriendly')}</span> : null}
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
            <img src={car.coverPhotoUrl} alt={`${car.make} ${car.model} – car rental Langkawi`} loading="lazy" />
          ) : (
            <div style={{ color: 'var(--muted)' }}>{t('booking.noPhoto')}</div>
          )}
        </div>
        <div className="car-info">
          <div className="flex between items-center">
            <div className="name">
              {car.make} {car.model}
            </div>
            <span className="rate" title={t('booking.fleetVehicle')}>
              <Star size={12} style={{ color: 'var(--brand-sun)' }} />
              4.8
            </span>
          </div>
          <div className="specs">
            <span>
              <Users size={12} />
              {t('booking.seatsCount', { count: fit.seats })}
            </span>
            <span>
              <DoorOpen size={12} />
              {t('booking.doorsCount', { count: fit.doors })}
            </span>
            <button
              type="button"
              className="spec-luggage"
              title={t('booking.luggageFit')}
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
              <div className="price-bit">{t('booking.startFrom')}</div>
              <div className="price">
                {formatMYR(car.dailyRateSen)}
                <span className="per"> {t('common.perDay')}</span>
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
              {t('booking.rent')} <ArrowRight size={12} />
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
  const { content, t } = useLandingContent()
  const openCar = (car: PublicCarRow | null) => {
    if (!car) return
    if (fleetLocked) {
      onRequireTrip()
      return
    }
    onOpenCar(car)
  }

  return (
    <section id="categories" className="section cats-v3" data-screen-label="Categories">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">{t('landing.categoriesEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.categoriesTitle')}
          </h2>
          <p className="h-sub">{t('landing.categoriesSub')}</p>
        </div>
      </div>

      <div className="cat3-list">
        {content.categories.map((c, i) => {
          const fleetCars = cars.filter((x) => (c.fleetKeys as readonly string[]).includes(x.category))
          const flip = i % 2 === 1
          const cls = ['cat3', flip ? 'flip' : '', c.dark ? 'dark' : '', c.orange ? 'orange' : ''].filter(Boolean).join(' ')
          const sample = pickCar(cars, c.fleetKeys[0] as CarCategoryKey) ?? pickCar(cars, c.fleetKeys[1] as CarCategoryKey)
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
                    <span>{t('booking.fromRmDay', { amount: c.from })}</span>
                  </span>
                </div>
                <div className="cat3-foot">
                  <button type="button" className="btn cat3-cta" onClick={() => openCar(sample)} disabled={!sample}>
                    {t('booking.seeCategoryCars', { category: c.title })} <ArrowRight size={14} />
                  </button>
                  <div className="cat3-mini">
                    {fleetCars.slice(0, 5).map((fc) => (
                      <button key={fc.id} type="button" className="cat3-mini-chip" onClick={() => openCar(fc)} title={`${fc.make} ${fc.model}`}>
                        {fc.coverPhotoUrl ? <img src={fc.coverPhotoUrl} alt={`${fc.make} ${fc.model} – Langkawi`} /> : <span className="text-xs">{fc.model}</span>}
                      </button>
                    ))}
                    {fleetCars.length > 5 && <span className="cat3-mini-more">+{fleetCars.length - 5}</span>}
                  </div>
                </div>
              </div>
              <div className="cat3-art" role="presentation" onClick={() => openCar(sample)}>
                {sample?.coverPhotoUrl ? (
                  <img src={sample.coverPhotoUrl} alt={`${sample.make} ${sample.model} – rent a car Langkawi`} />
                ) : (
                  <div style={{ padding: 40, color: '#fff' }}>{t('booking.browseFleet')}</div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function CitiesSection() {
  const { t } = usePublicI18n()
  return (
    <section id="locations" className="section" data-screen-label="Locations">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">{t('landing.locationsEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.locationsTitle')}
          </h2>
          <p className="h-sub">{t('landing.locationsSub')}</p>
        </div>
      </div>
      <div className="cities">
        {RENTAL_LOCATIONS.map((loc) => (
          <a
            key={loc.name}
            href={loc.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="chip"
          >
            <MapPin size={12} />
            {t('landing.carRentalIn', { name: loc.name })}
          </a>
        ))}
      </div>
    </section>
  )
}

function PromosSection() {
  const { content, t } = useLandingContent()
  return (
    <section className="section" data-screen-label="Promotions">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">{t('landing.promosEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.promosTitle')}
          </h2>
          <p className="h-sub">{t('landing.promosSub')}</p>
        </div>
        <button type="button" className="btn btn-ghost">
          {t('booking.seeAllSavings')} <ArrowRight size={13} />
        </button>
      </div>
      <div className="promo-grid">
        {content.promos.map((p) => (
          <article
            key={p.cls}
            className={'promo ' + p.cls}
            style={{ ['--promo-bg' as string]: `url('${encodeURI(p.image)}')` }}
          >
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
              <span className="promo-discount-label">{t('booking.off')}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function WhyChooseUs() {
  const { content, t } = useLandingContent()
  const perkIcons = [<Sparkles size={18} />, <Calendar size={18} />, <Shield size={18} />, <MapPin size={18} />]
  return (
    <section className="section why-section" data-screen-label="Why us">
      <div className="why-hero">
        <div className="why-hero-left">
          <span className="eyebrow">{t('booking.whyEyebrow')}</span>
          <h2 className="h-section">{t('booking.whyTitle')}</h2>
          <p className="h-sub">{t('booking.whySub')}</p>
        </div>
        <div className="why-feature">
          <div className="why-feature-big">
            <span className="why-feature-num">{content.whyMain.big}</span>
            <span className="why-feature-sub">{content.whyMain.bigSub}</span>
          </div>
          <p className="why-feature-lead">{content.whyMain.body}</p>
          <LocaleLink to="/about" className="btn btn-sm why-feature-about">
            {t('booking.aboutUs')} <ArrowRight size={12} />
          </LocaleLink>
          <ul className="why-bullets">
            {content.whyMain.bullets.map((b) => (
              <li key={b}>
                <Check size={12} /> {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="why-grid">
        {content.whyPerks.map((p, i) => (
          <article className="why-card" key={i}>
            <div className="why-card-head">
              <span className="why-icon">{perkIcons[i]}</span>
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
  const { content, t } = useLandingContent()
  return (
    <section className="section" data-screen-label="Step by step">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">{t('landing.stepsEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.stepsTitle')}
          </h2>
          <p className="h-sub">{t('landing.stepsSub')}</p>
        </div>
      </div>
      <div className="steps-5">
        {content.steps.map((s) => (
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
  const { content, t } = useLandingContent()
  return (
    <section className="section" data-screen-label="Tips">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">{t('landing.tipsEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.tipsTitle')}
          </h2>
          <p className="h-sub">{t('landing.tipsSub')}</p>
        </div>
        <LocaleLink to="/blog" className="btn btn-ghost">
          {t('landing.visitBlog')} <ArrowRight size={13} />
        </LocaleLink>
      </div>
      <div className="tip-grid">
        {content.blogTips.map((p) => (
          <LocaleLink key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="tip-card">
            <div className="tip-img" style={{ backgroundImage: `url(${p.img})` }}>
              <span className="tip-tag">{p.tag}</span>
            </div>
            <div className="tip-body">
              <h4>{p.title}</h4>
              <p>{p.excerpt}</p>
              <span className="tip-read">
                {t('blog.readArticle')} <ArrowRight size={12} />
              </span>
            </div>
          </LocaleLink>
        ))}
      </div>
    </section>
  )
}

function AttractionsSection() {
  const { content, t } = useLandingContent()
  const [cat, setCat] = useState(content.attrCats[0] ?? 'All')
  const [activeIdx, setActiveIdx] = useState(0)
  const list = useMemo(
    () => content.attractions.map((a, i) => ({ ...a, i })).filter((a) => (cat === content.attrCats[0] ? true : a.c === cat)),
    [cat, content.attractions, content.attrCats],
  )
  const hero = list.find((a) => a.i === activeIdx) || list[0]

  return (
    <section className="section attract-section" data-screen-label="Attractions">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">{t('landing.attractionsEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.attractionsTitle')}
          </h2>
          <p className="h-sub">{t('landing.attractionsSub')}</p>
        </div>
        <button type="button" className="btn btn-ghost">
          {t('booking.openGoogleMaps')} <MapPin size={13} />
        </button>
      </div>

      <div className="faq2-tabs" role="tablist" style={{ marginBottom: 18 }}>
        {content.attrCats.map((c) => {
          const n = c === content.attrCats[0] ? content.attractions.length : content.attractions.filter((a) => a.c === c).length
          return (
            <button
              key={c}
              type="button"
              role="tab"
              className={'faq2-tab' + (cat === c ? ' on' : '')}
              onClick={() => {
                setCat(c)
                const first = content.attractions.findIndex((a) => (c === content.attrCats[0] ? true : a.c === c))
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
                <span title={t('booking.fromAirport')}>
                  <Plane size={12} />
                  <span>{hero.airport} · {t('booking.airportShort')}</span>
                </span>
                <span title={t('booking.fromJetty')}>
                  <Anchor size={12} />
                  <span>{hero.jetty} · {t('booking.jettyShort')}</span>
                </span>
                <span title={t('booking.fromCenang')}>
                  <Sun size={12} />
                  <span>{hero.cenang} · {t('booking.cenangShort')}</span>
                </span>
                <span title={t('booking.here')}>
                  <MapPin size={12} />
                  <span>{hero.kuah} · {t('booking.kuahShort')}</span>
                </span>
                <span title={t('booking.minDrive', { time: hero.time })}>
                  <Clock size={12} />
                  <span>{hero.time}</span>
                </span>
              </div>
              <div className="flex gap-2" style={{ marginTop: 14 }}>
                <a
                  href={hero.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-leaf btn-sm"
                >
                  <MapPin size={12} /> {t('booking.openMaps')}
                </a>
                <button type="button" className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,.92)' }}>
                  {t('booking.pinTrip')} <Plus size={12} />
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
                    <span title={t('booking.fromAirport')}>
                      <Plane size={10} /> {a.airport}
                    </span>
                    <span title={t('booking.fromJetty')}>
                      <Anchor size={10} /> {a.jetty}
                    </span>
                    <span title={t('booking.fromCenang')}>
                      <Sun size={10} /> {a.cenang}
                    </span>
                    <span title={t('booking.here')}>
                      <MapPin size={10} /> {a.kuah}
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
  const { content, t } = useLandingContent()
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  async function copyMapsLink(idx: number, url: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(url)
      setCopiedIdx(idx)
      window.setTimeout(() => setCopiedIdx((current) => (current === idx ? null : current)), 2000)
    } catch {
      /* clipboard denied — no-op */
    }
  }

  return (
    <section className="section essential-v4" data-screen-label="Essentials">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">{t('landing.essentialEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.essentialTitle')}
          </h2>
          <p className="h-sub">{t('landing.essentialSub')}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            const all = content.essentialLocations.map((loc) => `${loc.t}: ${loc.mapsUrl}`).join('\n')
            void copyMapsLink(-1, all)
          }}
        >
          {copiedIdx === -1 ? t('booking.copiedAll') : t('booking.saveAllPhone')} <ArrowRight size={13} />
        </button>
      </div>
      <div className="ess4-grid">
        {content.essentialLocations.map((l, i) => (
          <article className="ess4-card" key={l.t}>
            <header>
              <span className="ess4-icon">
                {l.icon === 'airport' ? (
                  <Plane size={18} />
                ) : l.icon === 'jetty' ? (
                  <Anchor size={18} />
                ) : (
                  <Shield size={18} />
                )}
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
              {'phone' in l && l.phone ? (
                <span className="ess4-phone">
                  <Phone size={11} /> {l.phone}
                </span>
              ) : null}
            </div>
            <footer>
              <a
                href={l.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ess4-link"
                aria-label={`Open ${l.t} in Google Maps`}
              >
                <MapPin size={12} /> {t('booking.maps')}
              </a>
              <button
                type="button"
                className="ess4-link"
                aria-label={`Copy Google Maps link for ${l.t}`}
                onClick={() => void copyMapsLink(i, l.mapsUrl)}
              >
                {copiedIdx === i ? <Check size={12} /> : <Copy size={12} />}
                {copiedIdx === i ? t('booking.copied') : t('booking.copy')}
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}

function FAQSection() {
  const { content, t } = useLandingContent()
  const allCatId = content.faqCats[0]?.id ?? 'All'
  const [cat, setCat] = useState(allCatId)
  const [openId, setOpenId] = useState(0)
  const faqCatLabel = (id: string) => content.faqCats.find((c) => c.id === id)?.label ?? id
  const list = useMemo(
    () => content.faqs.map((f, i) => ({ ...f, i })).filter((f) => (cat === allCatId ? true : f.c === cat)),
    [cat, content.faqs, allCatId],
  )
  const active = list.find((f) => f.i === openId) || list[0]

  return (
    <section id="faq" className="section faq-v2" data-screen-label="FAQ">
      <div className="section-head">
        <div className="lead">
          <span className="eyebrow">{t('landing.faqSectionEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.faqSectionTitle')}
          </h2>
          <p className="h-sub">{t('landing.faqSub')}</p>
        </div>
      </div>

      <div className="faq2-tabs" role="tablist">
        {content.faqCats.map((c) => {
          const n = c.id === allCatId ? content.faqs.length : content.faqs.filter((f) => f.c === c.id).length
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              className={'faq2-tab' + (cat === c.id ? ' on' : '')}
              onClick={() => {
                setCat(c.id)
                const first = content.faqs.findIndex((f) => (c.id === allCatId ? true : f.c === c.id))
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
            <span className="faq2-cat">{faqCatLabel(active.c)}</span>
            <h3>{active.q}</h3>
            <p>{active.a}</p>
            <div className="faq2-divider" />
            <div className="faq2-related">
              <span className="faq2-related-label">{t('booking.faqRelated')}</span>
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
                <span className="faq2-contact-eyebrow">{t('booking.faqStillStuck')}</span>
                <div className="faq2-contact-row">
                  <a className="faq2-contact-pill" href="tel:+601135215576">
                    <Phone size={12} /> +60 11 3521 5576
                  </a>
                  <span className="faq2-contact-pill">
                    <Phone size={12} /> {t('booking.faqWhatsappReply')}
                  </span>
                </div>
              </div>
            </div>
          </article>

          <aside className="faq2-side">
            <div className="faq2-side-head">
              <span>{t('booking.faqQuestions', { count: list.length })}</span>
              <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>{t('common.tapToRead')}</span>
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

function ReelCard({ reel, onOpenReel }: { reel: Reel; onOpenReel: (r: Reel) => void }) {
  const { t } = usePublicI18n()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [previewing, setPreviewing] = useState(false)

  const startPreview = () => {
    const video = videoRef.current
    if (!video) return
    setPreviewing(true)
    void video.play().catch(() => setPreviewing(false))
  }

  const stopPreview = () => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
    setPreviewing(false)
  }

  return (
    <article
      className={`reel${previewing ? ' reel--previewing' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpenReel(reel)}
      onKeyDown={(e) => e.key === 'Enter' && onOpenReel(reel)}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
    >
      <video
        ref={videoRef}
        className="reel-vid"
        src={reel.clip}
        poster={reel.thumb}
        muted
        loop
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="reel-overlay">
        <span className="reel-play">
          <ArrowRight size={18} style={{ transform: 'translateX(1px)' }} />
        </span>
        <div className="reel-meta">
          <div className="reel-meta-top">
            <span className="reel-avatar reel-avatar-car">
              <img src={reel.car.image} alt="" loading="lazy" />
            </span>
            <div>
              <strong>
                {reel.car.make} {reel.car.model}
              </strong>
              <em>
                {reel.car.category} · {t('common.from')} RM {reel.car.priceLowSeason}{t('common.perDay')}
              </em>
            </div>
          </div>
          <p className="reel-caption">{reel.taglineShort}</p>
          <div className="reel-stats">
            <span>
              <Users size={12} /> {t('booking.seatsCount', { count: reel.car.seats })}
            </span>
            <span>
              <DoorOpen size={12} /> {reel.car.transmission}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

function ReelsSection({ reels, onOpenReel }: { reels: Reel[]; onOpenReel: (r: Reel) => void }) {
  const { t } = usePublicI18n()
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
          <span className="eyebrow">{t('landing.reelsEyebrow')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.reelsTitle')}
          </h2>
          <p className="h-sub">{t('landing.reelsSub')}</p>
        </div>
        <div className="reels-nav">
          <button type="button" className="cal-iconbtn" aria-label={t('booking.scrollBack')} onClick={() => scroll(-1)}>
            <ChevronLeft size={14} />
          </button>
          <button type="button" className="cal-iconbtn" aria-label={t('booking.scrollForward')} onClick={() => scroll(1)}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="reels-rail" ref={railRef}>
        {reels.map((r) => (
          <ReelCard key={r.id} reel={r} onOpenReel={onOpenReel} />
        ))}
      </div>
    </section>
  )
}

function TestimonialStars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="testi-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.min(1, Math.max(0, rating - index))
        return (
          <span key={index} className="testi-star-slot" style={{ width: size, height: size }}>
            <Star size={size} className="testi-star-base" aria-hidden />
            <span className="testi-star-fill" style={{ width: `${fill * 100}%` }} aria-hidden>
              <Star size={size} fill="var(--brand-leaf)" color="var(--brand-leaf)" />
            </span>
          </span>
        )
      })}
    </span>
  )
}

function TestimonialsSection() {
  const { t, locale } = usePublicI18n()
  const reviews = useMemo(() => testimonialsForLocale(locale), [locale])
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const sideListRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const autoScrollPausedRef = useRef(false)
  const sectionInViewRef = useRef(false)

  useEffect(() => {
    setFeaturedIdx(0)
  }, [locale])

  const featured = reviews[featuredIdx] ?? reviews[0]
  if (!featured) return null

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionInViewRef.current = entry.isIntersecting
      },
      { threshold: 0.2, rootMargin: '-40px 0px -40px 0px' },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!sectionInViewRef.current) return
    const card = cardRefs.current.get(featured.id)
    card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [featured.id])

  useEffect(() => {
    if (reviews.length <= 1) return

    const intervalId = window.setInterval(() => {
      if (autoScrollPausedRef.current || !sectionInViewRef.current) return
      setFeaturedIdx((current) => (current + 1) % reviews.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [reviews.length])

  const pauseAutoScroll = () => {
    autoScrollPausedRef.current = true
  }

  const resumeAutoScroll = () => {
    autoScrollPausedRef.current = false
  }

  return (
    <section ref={sectionRef} className="section testimonials-v2" data-screen-label="Reviews">
      <div className="testi-head">
        <div className="testi-lead">
          <span className="eyebrow">{t('landing.trustedSince')}</span>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            {t('landing.testimonialsTitle')}
          </h2>
          <p className="h-sub">{t('landing.testimonialsSub')}</p>
        </div>
        <div className="testi-rating">
          <div className="testi-score">{TESTIMONIAL_HEADLINE_SCORE.toFixed(1)}</div>
          <div className="testi-score-stars">
            <TestimonialStars rating={TESTIMONIAL_HEADLINE_SCORE} size={14} />
            <div className="testi-score-label">
              {t('landing.reviewsFrom')} <b>{TESTIMONIAL_SOURCE.totalReviews.toLocaleString('en-MY')}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="testi-stage">
        <article className="testi-feature">
          <TestimonialStars rating={featured.stars} size={16} />
          <div className="testi-quote-mark">&ldquo;</div>
          <p className="testi-quote">{featured.text}</p>
          <div className="testi-feature-foot">
            <div className="testi-avatar" style={{ background: '#1A1F22' }}>
              {testimonialInitials(featured.name)}
            </div>
            <div>
              <div className="testi-name">{featured.name}</div>
              <div className="testi-meta">{featured.serviceLabel}</div>
            </div>
            <div className="testi-trip">
              <span>{featured.date}</span>
            </div>
          </div>
        </article>

        <div className="testi-side">
          <div className="testi-side-head">
            <span>{t('landing.moreStories')}</span>
            <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>{t('common.tapToRead')}</span>
          </div>
          <div
            className="testi-side-list"
            ref={sideListRef}
            onMouseEnter={pauseAutoScroll}
            onMouseLeave={resumeAutoScroll}
          >
            {reviews.map((review, index) => (
              <button
                key={review.id}
                type="button"
                ref={(element) => {
                  if (element) cardRefs.current.set(review.id, element)
                  else cardRefs.current.delete(review.id)
                }}
                className={`testi-mini${index === featuredIdx ? ' testi-mini--active' : ''}`}
                onClick={() => setFeaturedIdx(index)}
              >
                <div className="testi-avatar sm" style={{ background: '#1A1F22' }}>
                  {testimonialInitials(review.name)}
                </div>
                <div className="testi-mini-body">
                  <div className="testi-mini-top">
                    <span className="testi-name">{review.name}</span>
                    <span className="testi-mini-stars">
                      <TestimonialStars rating={review.stars} size={10} />
                    </span>
                  </div>
                  <p>{review.text.length > 96 ? `${review.text.slice(0, 96)}…` : review.text}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="testi-footstrip">
        <div className="testi-source">
          <span className="testi-source-logo">f</span>
          <div>
            <b>{TESTIMONIAL_SOURCE.recommendationRate} {t('landing.recommend')}</b> {TESTIMONIAL_SOURCE.pageName}{' '}
            <span style={{ color: 'var(--muted-2)' }}>· {TESTIMONIAL_SOURCE.totalReviews.toLocaleString('en-MY')} {t('landing.reviews')}</span>
          </div>
        </div>
        <div className="testi-source">
          <span className="testi-source-logo">XQ</span>
          <div>
            <b>{TESTIMONIAL_SOURCE.tradingAs}</b>{' '}
            <span style={{ color: 'var(--muted-2)' }}>· {TESTIMONIAL_SOURCE.tourismLicense}</span>
          </div>
        </div>
        <div className="testi-source">
          <span className="testi-source-logo">M</span>
          <div>
            <b>MATTA {TESTIMONIAL_SOURCE.mattaMember}</b>{' '}
            <span style={{ color: 'var(--muted-2)' }}>· {t('landing.licensedOperator')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function CruiseBanner() {
  const { t } = usePublicI18n()
  return (
    <section className="section cruise-section" data-screen-label="Cruise">
      <article className="cruise-banner">
        <div className="cruise-banner-art">
          <img
            src="/image/Sunset%20Cruise.png"
            alt={t('booking.cruiseAlt')}
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="cruise-banner-body">
          <span className="cruise-eyebrow">
            <Sparkles size={11} /> {t('booking.cruiseEyebrow')}
          </span>
          <h2>{t('booking.cruiseTitle')}</h2>
          <p>{t('booking.cruiseBody')}</p>
          <div className="cruise-bullets">
            <span>
              <Check size={12} /> {t('booking.cruiseBullet1')}
            </span>
            <span>
              <Check size={12} /> {t('booking.cruiseBullet2')}
            </span>
            <span>
              <Check size={12} /> {t('booking.cruiseBullet3')}
            </span>
          </div>
          <div className="cruise-actions">
            <div className="cruise-price">
              <span className="cruise-price-from">{t('booking.cruiseFrom')}</span>
              <strong>
                RM 180<em>{t('booking.cruisePerPax')}</em>
              </strong>
            </div>
            <a
              href="https://cruise.xqholidays.com.my/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-leaf btn-lg"
            >
              {t('booking.cruiseCta')} <ArrowRight size={14} />
            </a>
          </div>
          <span className="cruise-foot">{t('booking.cruiseFoot')}</span>
        </div>
      </article>
    </section>
  )
}

function FooterCta({ onSearch, onBookMini }: { onSearch: () => void; onBookMini: () => void }) {
  const { t } = usePublicI18n()
  return (
    <div className="footer-cta">
      <div className="card-left">
        <div className="top">
          <div className="icon-box">
            <MapPin size={18} />
          </div>
          <div>
            <h3>{t('checkout.safetyTitle')}</h3>
            <p>{t('checkout.safetyBody')}</p>
          </div>
          <button type="button" className="btn btn-sm" onClick={onSearch}>
            {t('checkout.searchAvailable')} <ArrowRight size={12} />
          </button>
        </div>
        <div
          className="bottom"
          style={{ backgroundImage: `url('${encodeURI(FOOTER_CTA_FLEET_IMAGE)}')` }}
        >
          <div>
            <h4>{t('landing.ratesFrom')}</h4>
            <div className="big">RM 70/day</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,.82)', textAlign: 'right' }}>
            {t('booking.airportJettyHotel')}
            <br />
            {t('booking.islandOnly')}
          </div>
        </div>
      </div>
      <div
        className="right-img"
        style={{ backgroundImage: `url('${encodeURI(FOOTER_CTA_SCENERY_IMAGE)}')` }}
      >
        <div className="right-img-content">
          <h3>
            {t('landing.pantaiCenang')}
            <br />
            {t('landing.tanjungRhu')}
          </h3>
          <button type="button" className="btn btn-sm footer-cta-mini-btn" onClick={onBookMini}>
            {t('landing.bookMini')} <ArrowRight size={12} />
          </button>
        </div>
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
  const { t, href } = usePublicI18n()
  const homePath = href('/')
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="cols">
        <div>
          <div className="brand" style={{ color: '#fff' }}>
            <BrandLogo size={56} />
            <BrandName />
          </div>
          <div className="footer-tagline">
            <p className="tag">{t('footer.tagline1')}</p>
            <p className="tag">{t('footer.tagline2')}</p>
            <p className="tag footer-tagline-signature">{t('footer.signature')}</p>
          </div>
          <div className="socials">
            <a href="https://instagram.com" aria-label={t('footer.instagram')}>
              <Sparkles size={14} />
            </a>
            <a href="https://twitter.com" aria-label={t('footer.twitter')}>
              <ArrowRight size={14} />
            </a>
            <a href="https://facebook.com" aria-label={t('footer.facebook')}>
              <Users size={14} />
            </a>
          </div>
        </div>
        <div>
          <h5>{t('footer.planTrip')}</h5>
          <ul>
            <li>
              <LocaleLink to="/guides/pick-car">{t('footer.pickCar')}</LocaleLink>
            </li>
            <li>
              <LocaleLink to="/guides/pickup-return">{t('footer.pickupGuide')}</LocaleLink>
            </li>
            <li>
              <LocaleLink to="/guides/plan-drive">{t('footer.planDrive')}</LocaleLink>
            </li>
            <li>
              <LocaleLink to="/guides/know-how">{t('footer.knowHow')}</LocaleLink>
            </li>
          </ul>
        </div>
        <div>
          <h5>{t('footer.company')}</h5>
          <ul>
            <li>
              <LocaleLink to="/about">{t('footer.aboutUs')}</LocaleLink>
            </li>
            <li>
              {onScrollFleet ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-left font-inherit text-inherit"
                  onClick={onScrollFleet}
                >
                  {t('nav.ourFleet')}
                </button>
              ) : (
                <Link to={homePath as '/'} hash="top-picks">
                  {t('nav.ourFleet')}
                </Link>
              )}
            </li>
            <li>
              <LocaleLink to="/blog">{t('footer.journal')}</LocaleLink>
            </li>
            <li>
              <LocaleLink to="/login">{t('footer.customerLogin')}</LocaleLink>
            </li>
          </ul>
          <div className="site-footer-matta">
            <img
              src="/images/payments/Matta%20Logo.png"
              alt={t('footer.mattaAlt')}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
        <div>
          <h5>{t('footer.legal')}</h5>
          <ul>
            <li>
              <LocaleLink to="/terms">{t('footer.terms')}</LocaleLink>
            </li>
            <li>
              <LocaleLink to="/rental-agreement">{t('footer.rentalContract')}</LocaleLink>
            </li>
            <li>
              <LocaleLink to="/privacy">{t('footer.privacy')}</LocaleLink>
            </li>
            <li>
              <LocaleLink to="/refund-policy">{t('footer.refund')}</LocaleLink>
            </li>
            <li>
              <LocaleLink to="/pdpa">{t('footer.pdpa')}</LocaleLink>
            </li>
          </ul>
        </div>
        <div>
          <h5>{t('footer.contact')}</h5>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', margin: 0, lineHeight: 1.55 }}>
            <Phone size={11} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            {t('footer.roadside')}
          </p>
        </div>
      </div>
      <div className="site-footer-payments">
        <span className="site-footer-payments-label">{t('footer.weAccept')}</span>
        <PaymentMethodIcons
          className="site-footer-pay-icons"
          chipClassName="site-footer-pay-chip"
        />
      </div>
      <div className="bottom">
        <span>{t('footer.copyright', { year })}</span>
        <span>
          <LocaleLink to="/privacy" style={{ marginRight: 18 }}>
            {t('footer.privacy')}
          </LocaleLink>
          <LocaleLink to="/terms" style={{ marginRight: 18 }}>
            {t('footer.terms')}
          </LocaleLink>
          <LocaleLink to="/refund-policy" style={{ marginRight: 18 }}>
            {t('footer.refund')}
          </LocaleLink>
          <LocaleLink to="/pdpa">{t('footer.pdpa')}</LocaleLink>
        </span>
      </div>
    </footer>
  )
}

function ReelLightbox({
  reel,
  reels,
  onClose,
  onChange,
}: {
  reel: Reel
  reels: Reel[]
  onClose: () => void
  onChange: (reel: Reel) => void
}) {
  const { t } = usePublicI18n()
  const ref = useRef<HTMLVideoElement>(null)
  const { car } = reel
  const index = reels.findIndex((r) => r.id === reel.id)
  const hasMultiple = reels.length > 1

  const goNext = useCallback(() => {
    if (!hasMultiple || index < 0) return
    onChange(reels[(index + 1) % reels.length])
  }, [hasMultiple, index, onChange, reels])

  const goPrev = useCallback(() => {
    if (!hasMultiple || index < 0) return
    onChange(reels[(index - 1 + reels.length) % reels.length])
  }, [hasMultiple, index, onChange, reels])

  useEffect(() => {
    ref.current?.play().catch(() => {})
  }, [reel.id, reel.clip])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  function handleBook() {
    onClose()
    scrollToAnchor('booking-dock')
  }

  return (
    <div className="reel-lightbox" role="presentation" onClick={onClose}>
      <button type="button" className="close-btn" aria-label={t('common.close')} onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, zIndex: 5 }}>
        <X size={16} />
      </button>
      {hasMultiple ? (
        <>
          <button
            type="button"
            className="reel-lightbox-nav reel-lightbox-nav--prev"
            aria-label={t('booking.prevVideo')}
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="reel-lightbox-nav reel-lightbox-nav--next"
            aria-label={t('booking.nextVideo')}
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      ) : null}
      <div className="reel-lightbox-inner" role="presentation" onClick={(e) => e.stopPropagation()}>
        <video
          ref={ref}
          src={reel.clip}
          poster={reel.thumb}
          controls
          loop
          playsInline
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
          className="reel-lightbox-video"
        />
        <div className="reel-lightbox-side">
          <div className="reel-car-head">
            <img src={car.image} alt={`${car.make} ${car.model}`} className="reel-car-photo" loading="lazy" />
            <div>
              <span className="reel-car-category">{car.category}</span>
              <h3 className="reel-car-title">
                {car.make} {car.model}
              </h3>
              {car.oku ? <span className="reel-car-oku">{t('booking.okuFriendly')}</span> : null}
            </div>
          </div>

          <p className="reel-car-tagline">{reel.tagline}</p>

          <div className="reel-car-price-block">
            <span className="reel-car-price-label">{t('booking.startFrom')}</span>
            <div className="reel-car-price">
              RM {car.priceLowSeason}
              <span>{t('common.perDay')}</span>
            </div>
          </div>

          <dl className="reel-car-specs">
            <div>
              <dt>Seats</dt>
              <dd>{car.seats}</dd>
            </div>
            <div>
              <dt>Doors</dt>
              <dd>{car.doors}</dd>
            </div>
            <div>
              <dt>Body</dt>
              <dd>{car.body}</dd>
            </div>
            <div>
              <dt>Gearbox</dt>
              <dd>{car.transmission}</dd>
            </div>
            <div>
              <dt>Fuel</dt>
              <dd>{car.fuel}</dd>
            </div>
            <div>
              <dt>Luggage</dt>
              <dd>{car.luggage}</dd>
            </div>
          </dl>

          <ul className="reel-car-highlights" aria-label="Highlights">
            {car.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>

          <div className="reel-lightbox-cta">
            <strong>{t('booking.bookCar', { make: car.make, model: car.model })}</strong>
            <button type="button" className="btn btn-sm" style={{ background: 'var(--ink)', color: '#fff' }} onClick={handleBook}>
              {t('booking.checkAvailability')} <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
