import { Body, Head, Html, Link, Preview } from '@react-email/components'

import { formatRM, formatBookingDate, formatBookingTime, formatShortDate } from './email-helpers'

export type AdminBookingNotificationEmailProps = {
  rentalId: string
  bookingRef: string
  adminPanelUrl: string

  customerName: string | null
  customerEmail: string
  customerPhone: string | null

  carMake: string
  carModel: string
  carYear: number
  carPlateNumber: string

  pickupDate: Date
  pickupTime: string | null
  pickupLocation: string | null
  returnDate: Date
  returnTime: string | null

  totalAmountSen: number
  paidAmountSen: number
  paymentMethod: string | null
  ipay88TransId: string | null
}

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif"
const DARK = '#14181A'
const ORANGE = '#FF6600'
const MUTED = '#6B7378'
const FOOTER_TEXT = '#9AA1A6'
const BG = '#F4F5F7'
const DIVIDER = '#E4E6EA'

function LabelValue({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <tr>
      <td
        style={{
          padding: '8px 0',
          borderBottom: `1px solid ${DIVIDER}`,
          width: '40%',
          fontSize: '12px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: MUTED,
          verticalAlign: 'top',
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '8px 0 8px 16px',
          borderBottom: `1px solid ${DIVIDER}`,
          fontSize: '14px',
          color: DARK,
          fontFamily: mono ? 'monospace' : FONT,
          fontWeight: 500,
          verticalAlign: 'top',
        }}
      >
        {value}
      </td>
    </tr>
  )
}

export function AdminBookingNotificationEmail(props: AdminBookingNotificationEmailProps) {
  const {
    bookingRef,
    adminPanelUrl,
    customerName,
    customerEmail,
    customerPhone,
    carMake,
    carModel,
    carYear,
    carPlateNumber,
    pickupDate,
    pickupTime,
    pickupLocation,
    returnDate,
    returnTime,
    totalAmountSen,
    paidAmountSen,
    paymentMethod,
    ipay88TransId,
  } = props

  const carName = `${carMake} ${carModel} (${carYear})`
  const pickupStr = `${formatBookingDate(pickupDate)}${pickupTime ? ', ' + formatBookingTime(pickupTime) : ''}${pickupLocation ? ' · ' + pickupLocation : ''}`
  const returnStr = `${formatBookingDate(returnDate)}${returnTime ? ', ' + formatBookingTime(returnTime) : ''}`

  return (
    <Html lang="en">
      <Head />
      <Preview>
        New booking: {customerName ?? customerEmail} — {carMake} {carModel} — Pickup{' '}
        {formatShortDate(pickupDate)} — {formatRM(paidAmountSen)} paid
      </Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          background: BG,
          fontFamily: FONT,
          color: DARK,
          lineHeight: 1.5,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ background: BG, padding: '18px 0' }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 0 rgba(0,0,0,.02),0 12px 40px -20px rgba(20,24,26,.14)',
                  }}
                >
                  <tbody>
                    {/* ── Header ───────────────────────────────────────────── */}
                    <tr>
                      <td style={{ background: DARK, padding: '20px 28px' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <tr>
                              <td style={{ verticalAlign: 'middle' }}>
                                <table role="presentation" cellPadding="0" cellSpacing="0">
                                  <tbody>
                                    <tr>
                                      <td style={{ paddingRight: '10px', verticalAlign: 'middle' }}>
                                        <div
                                          style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '8px',
                                            background: ORANGE,
                                            color: '#FFFFFF',
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            textAlign: 'center',
                                            lineHeight: '28px',
                                          }}
                                        >
                                          X
                                        </div>
                                      </td>
                                      <td
                                        style={{
                                          fontSize: '15px',
                                          fontWeight: 600,
                                          color: '#FFFFFF',
                                          verticalAlign: 'middle',
                                        }}
                                      >
                                        Car XQ Admin
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontSize: '11px',
                                  letterSpacing: '0.10em',
                                  textTransform: 'uppercase',
                                  color: 'rgba(255,255,255,.6)',
                                  verticalAlign: 'middle',
                                }}
                              >
                                New Booking
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Alert banner ─────────────────────────────────────── */}
                    <tr>
                      <td
                        style={{
                          background: '#F0FFF4',
                          padding: '14px 28px',
                          borderBottom: `1px solid #BBF0C8`,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            color: '#1A6B35',
                            fontWeight: 500,
                          }}
                        >
                          ✓ Payment confirmed — {formatRM(paidAmountSen)} received for booking{' '}
                          <strong>{bookingRef}</strong>
                        </p>
                      </td>
                    </tr>

                    {/* ── Body ─────────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '28px 28px 8px 28px' }}>
                        <p
                          style={{
                            margin: '0 0 20px 0',
                            fontSize: '12px',
                            letterSpacing: '0.10em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Customer Details
                        </p>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <LabelValue label="Name" value={customerName ?? '–'} />
                            <LabelValue label="Email" value={customerEmail} />
                            <LabelValue label="Phone" value={customerPhone ?? '–'} />
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '24px 28px 8px 28px' }}>
                        <p
                          style={{
                            margin: '0 0 20px 0',
                            fontSize: '12px',
                            letterSpacing: '0.10em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Booking Details
                        </p>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <LabelValue label="Booking ID" value={bookingRef} />
                            <LabelValue label="Car" value={carName} />
                            <LabelValue label="Plate" value={carPlateNumber} mono />
                            <LabelValue label="Pickup" value={pickupStr} />
                            <LabelValue label="Return" value={returnStr} />
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '24px 28px 8px 28px' }}>
                        <p
                          style={{
                            margin: '0 0 20px 0',
                            fontSize: '12px',
                            letterSpacing: '0.10em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Payment Details
                        </p>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <LabelValue label="Total" value={formatRM(totalAmountSen)} />
                            <LabelValue label="Paid" value={formatRM(paidAmountSen)} />
                            {paymentMethod && (
                              <LabelValue label="Method" value={paymentMethod} />
                            )}
                            {ipay88TransId && (
                              <LabelValue label="Trans ID" value={ipay88TransId} mono />
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── CTA ──────────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '28px', textAlign: 'center' }}>
                        <Link
                          href={adminPanelUrl}
                          style={{
                            display: 'inline-block',
                            background: DARK,
                            color: '#FFFFFF',
                            padding: '12px 28px',
                            borderRadius: '999px',
                            fontSize: '14px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          View in admin panel &rarr;
                        </Link>
                      </td>
                    </tr>

                    {/* ── Footer ───────────────────────────────────────────── */}
                    <tr>
                      <td
                        style={{
                          background: BG,
                          padding: '18px 28px',
                          borderTop: `1px solid ${DIVIDER}`,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: '11px',
                            color: FOOTER_TEXT,
                            lineHeight: 1.55,
                          }}
                        >
                          Car XQ internal notification · Booking {bookingRef} · Do not forward this
                          email.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  )
}
