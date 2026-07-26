import { useEffect, useRef, useState } from 'react'
import { Calendar, MapPin } from 'lucide-react'

import {
  BookingField,
  DateTimeMenu,
  fmtDate,
  fmtTime,
  LocationMenu,
} from '#/components/landing/booking-trip-fields'
import { usePublicI18n } from '#/i18n/usePublicI18n'
import {
  addCalendarDays,
  earliestPickupDate,
  isAllowedReturnDate,
} from '#/lib/booking-datetime'
import { sanitizeBookingDates, type BookingState } from '#/lib/booking-state'

type OpenField = 'from' | 'to' | 'pick' | 'ret' | null

export function CheckoutTripEditor({
  booking,
  onChange,
  showErrors = false,
}: {
  booking: BookingState
  onChange: (next: BookingState) => void
  /** When true, highlight incomplete fields and show messages below them. */
  showErrors?: boolean
}) {
  const { t } = usePublicI18n()
  const locAirport = t('common.airport')
  const locJetty = t('common.jetty')
  const [open, setOpen] = useState<OpenField>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const missingPick = !booking.pickDate || !booking.pickTime.trim()
  const missingRet = !booking.retDate || !booking.retTime.trim()
  const missingFrom = !booking.from.trim()
  const missingRetLoc = booking.tripType === 'oneway' && !booking.retLoc.trim()
  const missingCount =
    Number(missingFrom) + Number(missingRetLoc) + Number(missingPick) + Number(missingRet)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        window.requestAnimationFrame(() => setOpen(null))
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const patch = (updates: Partial<BookingState>) => {
    onChange(sanitizeBookingDates({ ...booking, ...updates }))
  }

  return (
    <div className="cs-trip-editor" ref={rootRef}>
      <div className="cs-trip-editor-head">
        <div>
          <strong>{t('checkout.editTripTitle')}</strong>
          <p>{t('checkout.editTripSub')}</p>
        </div>
      </div>

      {showErrors && missingCount > 0 ? (
        <div className="checkout-validation-banner" role="alert">
          <strong>{t('checkout.completeRequiredFields')}</strong>
          <span>{t('checkout.fieldsNeedAttention', { count: missingCount })}</span>
        </div>
      ) : null}

      <div
        className={
          'cs-trip-editor-fields ' + (booking.tripType === 'oneway' ? 'with-return' : 'simple')
        }
      >
        <BookingField
          active={open === 'from'}
          onToggle={() => setOpen(open === 'from' ? null : 'from')}
          label={t('booking.pickupLocation')}
          required
          invalid={showErrors && missingFrom}
          error={showErrors && missingFrom ? t('checkout.errPickupLocationRequired') : null}
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
                  patch(updates)
                  window.requestAnimationFrame(() => setOpen('pick'))
                }}
              />
            ) : null
          }
        />

        {booking.tripType === 'oneway' ? (
          <BookingField
            active={open === 'to'}
            onToggle={() => setOpen(open === 'to' ? null : 'to')}
            label={t('booking.returnLocation')}
            required
            invalid={showErrors && missingRetLoc}
            error={
              showErrors && missingRetLoc ? t('checkout.errReturnLocationRequired') : null
            }
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
                    patch({ retLoc: l })
                    window.requestAnimationFrame(() => setOpen('pick'))
                  }}
                />
              ) : null
            }
          />
        ) : null}

        <BookingField
          active={open === 'pick'}
          onToggle={() => setOpen(open === 'pick' ? null : 'pick')}
          label={t('booking.pickup')}
          required
          invalid={showErrors && missingPick}
          error={showErrors && missingPick ? t('booking.selectPickupError') : null}
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
                onPick={(d, time) => {
                  const next: Partial<BookingState> = {}
                  if (d !== undefined) {
                    next.pickDate = d
                    if (!isAllowedReturnDate(d, booking.retDate)) {
                      next.retDate = null
                      next.retTime = ''
                    }
                    if (!booking.pickTime.trim()) next.pickTime = ''
                  }
                  if (time !== undefined) next.pickTime = time
                  patch(next)
                }}
                onDone={() => {
                  window.requestAnimationFrame(() => setOpen('ret'))
                }}
              />
            ) : null
          }
        />

        <BookingField
          active={open === 'ret'}
          onToggle={() => {
            if (!booking.pickDate || !booking.pickTime.trim()) {
              setOpen('pick')
              return
            }
            setOpen(open === 'ret' ? null : 'ret')
          }}
          label={t('booking.return')}
          required
          invalid={showErrors && missingRet}
          error={showErrors && missingRet ? t('booking.selectReturnError') : null}
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
                  booking.pickDate ? addCalendarDays(booking.pickDate, 1) : earliestPickupDate()
                }
                onPick={(d, time) => {
                  const next: Partial<BookingState> = {}
                  if (d !== undefined) {
                    next.retDate = d
                    if (!booking.retTime.trim()) next.retTime = ''
                  }
                  if (time !== undefined) next.retTime = time
                  patch(next)
                }}
                onDone={() => setOpen(null)}
              />
            ) : null
          }
        />
      </div>
    </div>
  )
}
