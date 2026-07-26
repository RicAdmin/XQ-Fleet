import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plane,
  Search,
} from 'lucide-react'

import { addCalendarDays, startOfLocalDay } from '#/lib/booking-datetime'
import { usePublicI18n } from '#/i18n/usePublicI18n'

import { HOTELS, PICK_TIMES } from './cxq-landing-data'

export function fmtDate(d: Date | null, selectLabel: string) {
  return d
    ? d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    : selectLabel
}

export function fmtTime(time: string, selectLabel: string) {
  return time.trim() || selectLabel
}

export function BookingField({
  active,
  onToggle,
  label,
  value,
  menu,
  required,
  invalid,
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
          {required ? (
            <span className="field-required-mark" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
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

export function LocationMenu({
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
    <div
      className="bk-menu loc-menu"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
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
            <li
              key={h}
              onClick={() => onPick(`${h}${t('booking.hotelDeliverySuffix')}`)}
              onKeyDown={() => {}}
              role="presentation"
            >
              <MapPin size={12} />
              {h}
            </li>
          ))}
        </ul>
      )}
      {query && filtered.length === 0 && (
        <div className="loc-empty">
          {t('booking.locEmptyArrange', { query })}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => onPick(`${query}${t('booking.hotelCustomSuffix')}`)}
          >
            {t('booking.useThisName')} <ArrowRight size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

export function DateTimeMenu({
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
  const [view, setView] = useState(
    () => new Date(initialView.getFullYear(), initialView.getMonth(), 1),
  )

  const month = view.getMonth()
  const year = view.getFullYear()
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))

  const sameDay = (a: Date | null, b: Date | null) =>
    Boolean(a && b && a.toDateString() === b.toDateString())

  return (
    <div className="bk-menu dt-menu" onClick={(e) => e.stopPropagation()}>
      <div className="dt-cal">
        <div className="cal-head">
          <button
            type="button"
            className="cal-iconbtn"
            onClick={() => setView(new Date(year, month - 1, 1))}
          >
            <ChevronLeft size={14} />
          </button>
          <h4>{view.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</h4>
          <button
            type="button"
            className="cal-iconbtn"
            onClick={() => setView(new Date(year, month + 1, 1))}
          >
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

export function PaxMenu({
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
          <button
            type="button"
            onClick={() => onChange(Math.max(0, adults - 1), children)}
            disabled={adults <= 0}
          >
            −
          </button>
          <span>{adults}</span>
          <button
            type="button"
            onClick={() => onChange(adults + 1, children)}
            disabled={adults + children >= 14}
          >
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
          <button
            type="button"
            onClick={() => onChange(adults, Math.max(0, children - 1))}
            disabled={children <= 0}
          >
            −
          </button>
          <span>{children}</span>
          <button
            type="button"
            onClick={() => onChange(adults, children + 1)}
            disabled={adults + children >= 14}
          >
            +
          </button>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-leaf btn-sm dt-done"
        style={{ marginLeft: 'auto' }}
        onClick={onDone}
      >
        {t('common.confirm')} <Check size={12} />
      </button>
    </div>
  )
}
