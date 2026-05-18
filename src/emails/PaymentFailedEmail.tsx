import { Body, Head, Html, Link, Preview } from '@react-email/components'

import { formatRM, formatShortDate, formatBookingTime } from './email-helpers'

export type PaymentFailedEmailProps = {
  customerFirstName: string
  customerEmail: string
  bookingRef: string
  carMake: string
  carModel: string
  pickupDate: Date
  pickupTime: string | null
  pickupLocation: string | null
  totalAmountSen: number
  retryUrl: string
}

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif"
const DARK = '#14181A'
const ORANGE = '#FF6600'
const MUTED = '#6B7378'
const FOOTER_TEXT = '#9AA1A6'
const BG = '#F4F5F7'
const DIVIDER = '#E4E6EA'
const ERROR_RED = '#D94040'
const ERROR_BG = '#FFF0F0'

export function PaymentFailedEmail(props: PaymentFailedEmailProps) {
  const {
    customerFirstName,
    customerEmail,
    bookingRef,
    carMake,
    carModel,
    pickupDate,
    pickupTime,
    pickupLocation,
    totalAmountSen,
    retryUrl,
  } = props

  const carName = `${carMake} ${carModel}`

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Action needed: Your payment for {carName} (Booking {bookingRef}) was unsuccessful. Tap to
        retry.
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
                    maxWidth: '680px',
                    width: '100%',
                    background: '#FFFFFF',
                    borderRadius: '28px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 0 rgba(0,0,0,.02),0 20px 60px -30px rgba(20,24,26,.18)',
                  }}
                >
                  <tbody>
                    {/* ── Nav bar ──────────────────────────────────────────── */}
                    <tr>
                      <td style={{ background: DARK, padding: '18px 28px' }}>
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
                                            width: '30px',
                                            height: '30px',
                                            borderRadius: '9px',
                                            background: ORANGE,
                                            color: '#FFFFFF',
                                            fontSize: '17px',
                                            fontWeight: 700,
                                            textAlign: 'center',
                                            lineHeight: '30px',
                                            letterSpacing: '-0.02em',
                                          }}
                                        >
                                          X
                                        </div>
                                      </td>
                                      <td
                                        style={{
                                          fontSize: '17px',
                                          fontWeight: 600,
                                          color: '#FFFFFF',
                                          letterSpacing: '-0.01em',
                                          verticalAlign: 'middle',
                                        }}
                                      >
                                        Car XQ
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontSize: '11px',
                                  letterSpacing: '0.12em',
                                  textTransform: 'uppercase',
                                  color: '#FFFFFF',
                                  verticalAlign: 'middle',
                                }}
                              >
                                Payment Notice
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Error status chip ────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '40px 36px 0 36px' }}>
                        <table
                          role="presentation"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{
                            background: ERROR_BG,
                            borderRadius: '999px',
                            display: 'inline-table',
                          }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  padding: '6px 16px',
                                  fontSize: '12px',
                                  letterSpacing: '0.10em',
                                  textTransform: 'uppercase',
                                  color: ERROR_RED,
                                  fontWeight: 600,
                                }}
                              >
                                Payment Unsuccessful
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Hero ─────────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '16px 36px 20px 36px' }}>
                        <h1
                          style={{
                            margin: '0 0 12px 0',
                            fontSize: '40px',
                            fontWeight: 500,
                            letterSpacing: '-0.02em',
                            color: DARK,
                            lineHeight: 1.1,
                          }}
                        >
                          Something went wrong, {customerFirstName}.
                        </h1>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '15px',
                            color: MUTED,
                            lineHeight: 1.6,
                            maxWidth: '46ch',
                          }}
                        >
                          We were unable to process your payment for the <strong style={{ color: DARK }}>{carName}</strong> booking. Your reservation is on hold — please retry your payment to confirm it.
                        </p>
                      </td>
                    </tr>

                    {/* ── Booking summary card ─────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px' }}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ background: BG, borderRadius: '14px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '20px 24px' }}>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding="0"
                                  cellSpacing="0"
                                >
                                  <tbody>
                                    <tr>
                                      <td style={{ verticalAlign: 'top', paddingBottom: '12px' }}>
                                        <p
                                          style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '11px',
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            color: MUTED,
                                          }}
                                        >
                                          Booking ID
                                        </p>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: 500,
                                            letterSpacing: '-0.01em',
                                            color: DARK,
                                          }}
                                        >
                                          {bookingRef}
                                        </p>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td
                                        style={{
                                          paddingTop: '12px',
                                          borderTop: `1px solid ${DIVIDER}`,
                                        }}
                                      >
                                        <table
                                          role="presentation"
                                          width="100%"
                                          cellPadding="0"
                                          cellSpacing="0"
                                        >
                                          <tbody>
                                            <tr>
                                              <td style={{ verticalAlign: 'top', width: '50%' }}>
                                                <p
                                                  style={{
                                                    margin: '0 0 4px 0',
                                                    fontSize: '11px',
                                                    letterSpacing: '0.12em',
                                                    textTransform: 'uppercase',
                                                    color: MUTED,
                                                  }}
                                                >
                                                  Car
                                                </p>
                                                <p
                                                  style={{
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                    color: DARK,
                                                  }}
                                                >
                                                  {carName}
                                                </p>
                                              </td>
                                              <td style={{ verticalAlign: 'top', width: '50%' }}>
                                                <p
                                                  style={{
                                                    margin: '0 0 4px 0',
                                                    fontSize: '11px',
                                                    letterSpacing: '0.12em',
                                                    textTransform: 'uppercase',
                                                    color: MUTED,
                                                  }}
                                                >
                                                  Pickup
                                                </p>
                                                <p
                                                  style={{
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                    color: DARK,
                                                  }}
                                                >
                                                  {formatShortDate(pickupDate)}
                                                  {pickupTime ? `, ${formatBookingTime(pickupTime)}` : ''}
                                                </p>
                                                {pickupLocation && (
                                                  <p
                                                    style={{
                                                      margin: '2px 0 0 0',
                                                      fontSize: '12px',
                                                      color: MUTED,
                                                    }}
                                                  >
                                                    {pickupLocation}
                                                  </p>
                                                )}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td
                                        style={{
                                          paddingTop: '12px',
                                          borderTop: `1px solid ${DIVIDER}`,
                                        }}
                                      >
                                        <table
                                          role="presentation"
                                          width="100%"
                                          cellPadding="0"
                                          cellSpacing="0"
                                        >
                                          <tbody>
                                            <tr>
                                              <td
                                                style={{
                                                  fontSize: '14px',
                                                  fontWeight: 500,
                                                  color: DARK,
                                                }}
                                              >
                                                Amount due
                                              </td>
                                              <td
                                                style={{
                                                  textAlign: 'right',
                                                  fontSize: '16px',
                                                  fontWeight: 500,
                                                  letterSpacing: '-0.01em',
                                                  color: DARK,
                                                }}
                                              >
                                                {formatRM(totalAmountSen)}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Retry CTA ────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 36px 36px', textAlign: 'center' }}>
                        <Link
                          href={retryUrl}
                          style={{
                            display: 'inline-block',
                            background: ORANGE,
                            color: '#FFFFFF',
                            padding: '14px 32px',
                            borderRadius: '999px',
                            fontSize: '15px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          Retry payment &rarr;
                        </Link>
                        <p
                          style={{
                            margin: '12px 0 0 0',
                            fontSize: '13px',
                            color: MUTED,
                            lineHeight: 1.55,
                          }}
                        >
                          Your booking slot is held for a limited time. If your payment continues to
                          fail, please contact us.
                        </p>
                      </td>
                    </tr>

                    {/* ── Divider ──────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px' }}>
                        <div style={{ height: '1px', background: DIVIDER }} />
                      </td>
                    </tr>

                    {/* ── Get in touch ─────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '28px 36px' }}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ background: DARK, borderRadius: '20px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '28px', textAlign: 'center' }}>
                                <p
                                  style={{
                                    margin: '0 0 6px 0',
                                    fontSize: '12px',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: '#FFD2A8',
                                    fontWeight: 500,
                                  }}
                                >
                                  Need Help?
                                </p>
                                <p
                                  style={{
                                    margin: '0 0 16px 0',
                                    color: 'rgba(255,255,255,.80)',
                                    fontSize: '14px',
                                    lineHeight: 1.55,
                                  }}
                                >
                                  Our team can help you complete your booking.
                                </p>
                                <Link
                                  href="https://wa.me/60125105576?text=Hi%20XQ%20Car%2C%20I%20need%20help%20with%20my%20payment..."
                                  style={{
                                    display: 'inline-block',
                                    background: ORANGE,
                                    color: '#FFFFFF',
                                    padding: '11px 20px',
                                    borderRadius: '999px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                  }}
                                >
                                  WhatsApp +60 12-510 5576
                                </Link>
                                <p style={{ margin: '10px 0 0 0', textAlign: 'center' }}>
                                  <Link
                                    href="mailto:cs@xqholidays.com.my"
                                    style={{
                                      color: '#FFD2A8',
                                      fontSize: '14px',
                                      textDecoration: 'none',
                                      fontWeight: 500,
                                    }}
                                  >
                                    cs@xqholidays.com.my
                                  </Link>
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Footer ───────────────────────────────────────────── */}
                    <tr>
                      <td
                        style={{
                          background: BG,
                          padding: '24px 36px',
                          borderTop: `1px solid ${DIVIDER}`,
                        }}
                      >
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <tr>
                              <td>
                                <table role="presentation" cellPadding="0" cellSpacing="0">
                                  <tbody>
                                    <tr>
                                      <td style={{ paddingRight: '8px', verticalAlign: 'middle' }}>
                                        <div
                                          style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '7px',
                                            background: ORANGE,
                                            color: '#FFFFFF',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            textAlign: 'center',
                                            lineHeight: '24px',
                                          }}
                                        >
                                          X
                                        </div>
                                      </td>
                                      <td
                                        style={{
                                          fontSize: '14px',
                                          fontWeight: 600,
                                          color: DARK,
                                          letterSpacing: '-0.01em',
                                          verticalAlign: 'middle',
                                        }}
                                      >
                                        Car XQ
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p
                          style={{
                            margin: '14px 0 0 0',
                            fontSize: '11px',
                            color: FOOTER_TEXT,
                            lineHeight: 1.55,
                          }}
                        >
                          This email was sent to {customerEmail} regarding Booking ID {bookingRef}.
                        </p>
                        <p
                          style={{
                            margin: '8px 0 0 0',
                            fontSize: '11px',
                            color: FOOTER_TEXT,
                            lineHeight: 1.55,
                          }}
                        >
                          Copyright &copy; {new Date().getFullYear()} XIAO QIANG HOLIDAYS SDN BHD
                          (201301017811). All rights reserved.
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
