import { Body, Head, Html, Img, Link, Preview } from '@react-email/components'

import {
  categoryDisplayName,
  formatBookingDate,
  formatBookingTime,
  formatRM,
  formatShortDate,
  rentalDays,
} from './email-helpers'
import { EmailBrandMark } from './EmailBrandMark'
import { absolutePublicUrl, publicSitePath } from '#/lib/brand'

export type BookingConfirmationEmailProps = {
  customerFirstName: string
  customerEmail: string
  bookingRef: string
  bookedAt: Date

  carMake: string
  carModel: string
  carYear: number
  carPlateNumber: string
  carCategory: string
  carPhotoUrl: string | null

  pickupDate: Date
  pickupTime: string | null
  pickupLocation: string | null
  returnDate: Date
  returnTime: string | null
  returnLocation: string | null

  baseRentalSen: number
  extraChargeSen: number
  addonsTotalSen: number
  deliveryFeeSen: number
  subTotalSen: number
  discountAmountSen: number
  discountPercent: string
  couponCode: string | null
  totalAmountSen: number
  paidAmountSen: number
}

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif"
const DARK = '#14181A'
const ORANGE = '#FF6600'
const MUTED = '#6B7378'
const FOOTER_TEXT = '#9AA1A6'
const BG = '#F4F5F7'
const DIVIDER = '#E4E6EA'
const BORDER_SUBTLE = '#ECEEF1'

export function BookingConfirmationEmail(props: BookingConfirmationEmailProps) {
  const {
    customerFirstName,
    customerEmail,
    bookingRef,
    bookedAt,
    carMake,
    carModel,
    carYear,
    carCategory,
    carPhotoUrl,
    pickupDate,
    pickupTime,
    pickupLocation,
    returnDate,
    returnTime,
    returnLocation,
    baseRentalSen,
    extraChargeSen,
    addonsTotalSen,
    deliveryFeeSen,
    subTotalSen,
    discountAmountSen,
    discountPercent,
    couponCode,
    totalAmountSen,
  } = props

  const days = rentalDays(pickupDate, returnDate)
  const hasDiscount = discountAmountSen > 0
  const catLabel = categoryDisplayName(carCategory)
  const carFullName = `${carMake} ${carModel}`
  const specLine = [catLabel, String(carYear)].filter(Boolean).join(' · ')

  const discountLabel = hasDiscount
    ? couponCode
      ? `Discount · ${couponCode.toUpperCase()} (${parseFloat(discountPercent)}%)`
      : `Discount (${parseFloat(discountPercent)}%)`
    : ''

  const previewText = `Booking ${bookingRef} confirmed. Pickup ${formatShortDate(pickupDate)}, ${formatBookingTime(pickupTime)} at ${pickupLocation ?? 'pickup point'}. Here's everything you need.`

  const carPhotoSrc = absolutePublicUrl(carPhotoUrl)

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
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
        {/* Outer wrapper */}
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ background: BG, padding: '18px 0' }}>
          <tbody>
            <tr>
              <td align="center">
                {/* Card container */}
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
                    {/* ── Nav bar ─────────────────────────────────────────── */}
                    <tr>
                      <td style={{ background: DARK, padding: '18px 28px' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <tr>
                              <td style={{ verticalAlign: 'middle' }}>
                                <EmailBrandMark />
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
                                Booking Receipt
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Hero ────────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '40px 36px 20px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 16px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Booking Confirmed
                        </p>
                        <h1
                          style={{
                            margin: '0 0 12px 0',
                            fontSize: '48px',
                            fontWeight: 500,
                            letterSpacing: '-0.02em',
                            color: DARK,
                            lineHeight: 1.1,
                          }}
                        >
                          You&rsquo;re all set, {customerFirstName}.
                        </h1>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '15px',
                            color: MUTED,
                            lineHeight: 1.6,
                            maxWidth: '42ch',
                          }}
                        >
                          Your {carFullName} is reserved. Below is everything you need for pickup
                          day. Save this email and bring it with you.
                        </p>
                      </td>
                    </tr>

                    {/* ── Booking ID chip ──────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px' }}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ background: DARK, borderRadius: '14px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '20px 24px' }}>
                                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                                  <tbody>
                                    <tr>
                                      <td style={{ verticalAlign: 'top' }}>
                                        <p
                                          style={{
                                            margin: '0 0 8px 0',
                                            fontSize: '11px',
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            color: FOOTER_TEXT,
                                          }}
                                        >
                                          Booking ID
                                        </p>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: '24px',
                                            fontWeight: 500,
                                            letterSpacing: '-0.02em',
                                            color: '#FFFFFF',
                                          }}
                                        >
                                          {bookingRef}
                                        </p>
                                      </td>
                                      <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                                        <p
                                          style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '11px',
                                            color: FOOTER_TEXT,
                                          }}
                                        >
                                          Booked
                                        </p>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: '13px',
                                            color: '#FFFFFF',
                                          }}
                                        >
                                          {formatShortDate(bookedAt)}
                                        </p>
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

                    {/* ── Car image ───────────────────────────────────────── */}
                    {carPhotoSrc ? (
                      <tr>
                        <td style={{ padding: '0 36px', lineHeight: 0 }}>
                          <Img
                            src={carPhotoSrc}
                            alt={carFullName}
                            width={608}
                            height={342}
                            style={{
                              width: '100%',
                              maxWidth: '608px',
                              height: 'auto',
                              borderRadius: '16px',
                              display: 'block',
                              background: DARK,
                            }}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td style={{ padding: '0 36px', lineHeight: 0 }}>
                          <table
                            role="presentation"
                            width="100%"
                            cellPadding={0}
                            cellSpacing={0}
                            style={{
                              background: DARK,
                              borderRadius: '16px',
                              width: '100%',
                            }}
                          >
                            <tbody>
                              <tr>
                                <td
                                  align="center"
                                  style={{
                                    padding: '80px 24px',
                                    color: MUTED,
                                    fontSize: '13px',
                                  }}
                                >
                                  {carFullName}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}

                    {/* ── YOUR CAR ─────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px', paddingTop: '0' }}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ background: BG, borderRadius: '16px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '28px 28px 24px 28px' }}>
                                <p
                                  style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '12px',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: ORANGE,
                                    fontWeight: 500,
                                  }}
                                >
                                  Your Car
                                </p>
                                <h2
                                  style={{
                                    margin: '0 0 6px 0',
                                    fontSize: '32px',
                                    fontWeight: 500,
                                    letterSpacing: '-0.01em',
                                    color: DARK,
                                  }}
                                >
                                  {carFullName}
                                </h2>
                                <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: MUTED }}>
                                  {specLine}
                                </p>
                                {/* Disclaimer */}
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding="0"
                                  cellSpacing="0"
                                  style={{ background: '#FFFFFF', borderRadius: '10px' }}
                                >
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: '14px 18px' }}>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: '13px',
                                            color: MUTED,
                                            lineHeight: 1.55,
                                          }}
                                        >
                                          <strong style={{ color: DARK }}>
                                            Image for illustration only.
                                          </strong>{' '}
                                          The car you receive will be the same model and category as
                                          shown. Actual color, year, trim, and accessories may vary
                                          based on availability. If your assigned unit is unavailable
                                          due to maintenance or prior damage, we will provide a
                                          vehicle of the same or higher category at no extra cost.
                                        </p>
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

                    {/* ── Pickup + Return ──────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <tr>
                              <td
                                width="48%"
                                style={{
                                  background: BG,
                                  borderRadius: '14px',
                                  padding: '20px',
                                  verticalAlign: 'top',
                                }}
                              >
                                <p
                                  style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '12px',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: ORANGE,
                                    fontWeight: 500,
                                  }}
                                >
                                  Pickup
                                </p>
                                <p
                                  style={{
                                    margin: '0 0 4px 0',
                                    fontSize: '18px',
                                    fontWeight: 500,
                                    letterSpacing: '-0.01em',
                                    color: DARK,
                                  }}
                                >
                                  {formatBookingDate(pickupDate)}
                                </p>
                                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: DARK }}>
                                  {formatBookingTime(pickupTime)}
                                </p>
                                <p
                                  style={{ margin: 0, fontSize: '13px', color: MUTED, lineHeight: 1.5 }}
                                >
                                  {pickupLocation ?? '–'}
                                </p>
                              </td>
                              <td width="4%" />
                              <td
                                width="48%"
                                style={{
                                  background: BG,
                                  borderRadius: '14px',
                                  padding: '20px',
                                  verticalAlign: 'top',
                                }}
                              >
                                <p
                                  style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '12px',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: ORANGE,
                                    fontWeight: 500,
                                  }}
                                >
                                  Return
                                </p>
                                <p
                                  style={{
                                    margin: '0 0 4px 0',
                                    fontSize: '18px',
                                    fontWeight: 500,
                                    letterSpacing: '-0.01em',
                                    color: DARK,
                                  }}
                                >
                                  {formatBookingDate(returnDate)}
                                </p>
                                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: DARK }}>
                                  {formatBookingTime(returnTime)}
                                </p>
                                <p
                                  style={{ margin: 0, fontSize: '13px', color: MUTED, lineHeight: 1.5 }}
                                >
                                  {returnLocation ?? '–'}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Divider ──────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px' }}>
                        <div style={{ height: '1px', background: DIVIDER }} />
                      </td>
                    </tr>

                    {/* ── Price breakdown ──────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '28px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 16px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Price Breakdown
                        </p>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ fontSize: '14px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '10px 0', color: MUTED }}>
                                Base rental ({days} day{days !== 1 ? 's' : ''})
                              </td>
                              <td style={{ padding: '10px 0', textAlign: 'right', color: DARK }}>
                                {formatRM(baseRentalSen)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px 0', color: MUTED }}>Extra hours</td>
                              <td style={{ padding: '10px 0', textAlign: 'right', color: DARK }}>
                                {formatRM(extraChargeSen)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px 0', color: MUTED }}>Add-ons</td>
                              <td style={{ padding: '10px 0', textAlign: 'right', color: DARK }}>
                                {formatRM(addonsTotalSen)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px 0', color: MUTED }}>Delivery fee</td>
                              <td style={{ padding: '10px 0', textAlign: 'right', color: DARK }}>
                                {formatRM(deliveryFeeSen)}
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: '14px 0 10px 0',
                                  color: DARK,
                                  borderTop: `1px solid ${BORDER_SUBTLE}`,
                                }}
                              >
                                Subtotal
                              </td>
                              <td
                                style={{
                                  padding: '14px 0 10px 0',
                                  textAlign: 'right',
                                  color: DARK,
                                  borderTop: `1px solid ${BORDER_SUBTLE}`,
                                }}
                              >
                                {formatRM(subTotalSen)}
                              </td>
                            </tr>
                            {hasDiscount && (
                              <tr>
                                <td style={{ padding: '10px 0', color: ORANGE }}>{discountLabel}</td>
                                <td style={{ padding: '10px 0', textAlign: 'right', color: ORANGE }}>
                                  -{formatRM(discountAmountSen)}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td
                                style={{
                                  padding: '18px 0 0 0',
                                  fontWeight: 500,
                                  fontSize: '22px',
                                  letterSpacing: '-0.022em',
                                  color: DARK,
                                  borderTop: `2px solid ${DARK}`,
                                }}
                              >
                                Total paid
                              </td>
                              <td
                                style={{
                                  padding: '18px 0 0 0',
                                  textAlign: 'right',
                                  fontWeight: 500,
                                  fontSize: '22px',
                                  letterSpacing: '-0.022em',
                                  color: DARK,
                                  borderTop: `2px solid ${DARK}`,
                                }}
                              >
                                {formatRM(totalAmountSen)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p
                          style={{
                            margin: '16px 0 0 0',
                            fontSize: '13px',
                            color: MUTED,
                            lineHeight: 1.55,
                          }}
                        >
                          A separate payment receipt will be sent to you by our payment gateway,{' '}
                          <strong style={{ color: DARK }}>ADAPTIS</strong>.
                        </p>
                      </td>
                    </tr>

                    {/* ── Deposit chip ─────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px' }}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ background: '#FFD2A8', borderRadius: '14px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '18px 20px' }}>
                                <p
                                  style={{
                                    margin: '0 0 6px 0',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: DARK,
                                  }}
                                >
                                  Refundable security deposit · RM 500
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: '13px',
                                    color: '#2A2F33',
                                    lineHeight: 1.55,
                                  }}
                                >
                                  Collected at pickup via credit card pre-authorization or cash.
                                  Released within 3 working days after return, subject to vehicle
                                  condition and fuel level.
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── What to bring ────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 14px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          What to Bring
                        </p>
                        {[
                          'This confirmation email (printed or on phone)',
                          'Your driving license (original; foreign licenses require an International Driving Permit)',
                          'Your passport or MyKad for identity verification',
                          'The credit card used for booking (for deposit pre-authorization)',
                          'The driver must be the same person named on this booking',
                        ].map((item, i) => (
                          <table
                            key={i}
                            role="presentation"
                            width="100%"
                            cellPadding="0"
                            cellSpacing="0"
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    padding: '6px 0',
                                    width: '28px',
                                    color: ORANGE,
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    verticalAlign: 'top',
                                  }}
                                >
                                  {i + 1}.
                                </td>
                                <td
                                  style={{
                                    padding: '6px 0',
                                    fontSize: '14px',
                                    color: DARK,
                                    lineHeight: 1.55,
                                    verticalAlign: 'top',
                                  }}
                                >
                                  {item}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        ))}
                      </td>
                    </tr>

                    {/* ── Divider ──────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px' }}>
                        <div style={{ height: '1px', background: DIVIDER }} />
                      </td>
                    </tr>

                    {/* ── Policy sections ──────────────────────────────────── */}
                    {[
                      {
                        title: 'Driver Requirements',
                        body: 'Minimum age 23, license held for 2+ years, clean record. If the driver at pickup does not meet these requirements, the rental will be refused with no refund.',
                        pt: '28px',
                      },
                      {
                        title: 'Fuel Policy · Same-to-Same',
                        body: "Return the car with the same fuel level it had at pickup. If it's lower, you'll be charged for the missing fuel at pump price plus an RM 30 refueling service fee.",
                        pt: '16px',
                      },
                    ].map((s) => (
                      <tr key={s.title}>
                        <td style={{ padding: `${s.pt} 36px 16px 36px` }}>
                          <p
                            style={{
                              margin: '0 0 10px 0',
                              fontSize: '12px',
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: ORANGE,
                              fontWeight: 500,
                            }}
                          >
                            {s.title}
                          </p>
                          <p style={{ margin: 0, fontSize: '14px', color: DARK, lineHeight: 1.6 }}>
                            {s.body}
                          </p>
                        </td>
                      </tr>
                    ))}

                    {/* Insurance */}
                    <tr>
                      <td style={{ padding: '16px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Insurance
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: DARK, lineHeight: 1.6 }}>
                          Third-party insurance is included. You are liable up to the excess of{' '}
                          <strong>RM 1,500</strong> for damage to the rented vehicle.
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', color: MUTED, lineHeight: 1.55 }}>
                          Optional upgrade to Comprehensive (RM 50/day) at pickup reduces the excess
                          to RM 500.
                        </p>
                      </td>
                    </tr>

                    {/* Prohibited Use */}
                    <tr>
                      <td style={{ padding: '16px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Prohibited Use
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: DARK, lineHeight: 1.6 }}>
                          The vehicle cannot be used for: racing or off-road driving, towing,
                          commercial passenger transport (ride-hailing or taxi), carrying more than 8
                          passengers, crossing borders, transporting illegal goods or pets without
                          prior arrangement, or being driven by anyone not listed as an authorized
                          driver. Violation forfeits the deposit and may incur further charges.
                        </p>
                      </td>
                    </tr>

                    {/* Smoking, Pets, and Cleaning */}
                    <tr>
                      <td style={{ padding: '16px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Smoking, Pets, and Cleaning
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: DARK, lineHeight: 1.6 }}>
                          No smoking, vaping, or pets inside the vehicle. Violation:{' '}
                          <strong>RM 500</strong> cleaning fee. Please return the car in reasonably
                          clean condition; excessive sand or debris may incur an RM 100 cleaning fee.
                        </p>
                      </td>
                    </tr>

                    {/* Traffic Offenses */}
                    <tr>
                      <td style={{ padding: '16px 36px 28px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Traffic Offenses and Tolls
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: DARK, lineHeight: 1.6 }}>
                          You are responsible for all fines, parking tickets, and tolls during your
                          rental. We will charge your card the amount plus an RM 50 administrative
                          fee per offense if any are received after your return.
                        </p>
                      </td>
                    </tr>

                    {/* ── Divider ──────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px' }}>
                        <div style={{ height: '1px', background: DIVIDER }} />
                      </td>
                    </tr>

                    {/* ── In Case of Accident ──────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '28px 36px 16px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 14px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          In Case of Accident
                        </p>
                        {[
                          'Ensure everyone is safe and move out of traffic if possible.',
                          'Call us immediately: +60 12-510 5576.',
                          'Call police (999) and obtain a police report (mandatory for any claim).',
                          'Do not admit fault or sign anything from third parties.',
                          'Take photos of all vehicles, license plates, and the scene.',
                        ].map((item, i) => (
                          <table
                            key={i}
                            role="presentation"
                            width="100%"
                            cellPadding="0"
                            cellSpacing="0"
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    padding: '6px 0',
                                    width: '28px',
                                    color: ORANGE,
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    verticalAlign: 'top',
                                  }}
                                >
                                  {i + 1}.
                                </td>
                                <td
                                  style={{
                                    padding: '6px 0',
                                    fontSize: '14px',
                                    color: DARK,
                                    lineHeight: 1.55,
                                    verticalAlign: 'top',
                                  }}
                                >
                                  {item}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        ))}
                      </td>
                    </tr>

                    {/* ── Late Return ──────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '16px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Late Return
                        </p>
                        <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: DARK, lineHeight: 1.6 }}>
                          30-minute grace period applies. After that:
                        </p>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ fontSize: '14px' }}
                        >
                          <tbody>
                            {[
                              ['30 min to 6 hours late', 'RM 20 Low / RM 30 Peak per hour'],
                              ['More than 6 hours late', '1 extra rental day'],
                              ['More than 24 hours, no notice', 'Deposit forfeited'],
                            ].map(([label, value]) => (
                              <tr key={label}>
                                <td style={{ padding: '6px 0', color: MUTED }}>{label}</td>
                                <td
                                  style={{ padding: '6px 0', textAlign: 'right', color: DARK }}
                                >
                                  {value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Cancellation Policy ──────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '16px 36px 28px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          Cancellation Policy
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: DARK, lineHeight: 1.6 }}>
                          Refund amounts vary depending on how far in advance you cancel.{' '}
                          <Link
                            href={publicSitePath('/refund-policy')}
                            style={{ color: ORANGE, textDecoration: 'none' }}
                          >
                            View full cancellation policy
                          </Link>
                          .
                        </p>
                      </td>
                    </tr>

                    {/* ── YOU MIGHT ALSO LOVE — Sunset Cruise ──────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px' }}>
                        <p
                          style={{
                            margin: '0 0 16px 0',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: ORANGE,
                            fontWeight: 500,
                          }}
                        >
                          You Might Also Love
                        </p>
                        {/* Cruise card */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ borderRadius: '20px', overflow: 'hidden' }}
                        >
                          <tbody>
                            <tr>
                              {/* Left: sunset illustration */}
                              <td
                                width="40%"
                                style={{
                                  background: 'linear-gradient(180deg,#FF6600 0%,#FF8A33 100%)',
                                  backgroundColor: '#FF6600',
                                  verticalAlign: 'middle',
                                  padding: 0,
                                  lineHeight: 0,
                                }}
                              >
                                <svg
                                  width="100%"
                                  viewBox="0 0 272 300"
                                  xmlns="http://www.w3.org/2000/svg"
                                  style={{ display: 'block' }}
                                >
                                  <defs>
                                    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#FF6600" />
                                      <stop offset="100%" stopColor="#FF9E33" />
                                    </linearGradient>
                                    <radialGradient id="sun" cx="50%" cy="50%" r="50%">
                                      <stop offset="0%" stopColor="#FFF4D2" />
                                      <stop offset="35%" stopColor="#FFD27A" />
                                      <stop offset="100%" stopColor="#FFC79A" />
                                    </radialGradient>
                                  </defs>
                                  <rect width="272" height="300" fill="url(#bg)" />
                                  <circle cx="136" cy="155" r="72" fill="url(#sun)" />
                                  <line x1="0" y1="220" x2="272" y2="220" stroke="rgba(20,24,26,0.15)" strokeWidth="1" />
                                  <ellipse cx="136" cy="228" rx="52" ry="9" fill="#14181A" opacity="0.85" />
                                  <polygon points="136,100 106,222 166,222" fill="white" />
                                  <line x1="136" y1="90" x2="136" y2="222" stroke="#14181A" strokeWidth="2.5" />
                                </svg>
                              </td>
                              {/* Right: content */}
                              <td
                                width="60%"
                                style={{
                                  background: DARK,
                                  padding: '28px 24px',
                                  verticalAlign: 'top',
                                }}
                              >
                                {/* Eyebrow chip */}
                                <table role="presentation" cellPadding="0" cellSpacing="0">
                                  <tbody>
                                    <tr>
                                      <td
                                        style={{
                                          background: '#3A2410',
                                          borderRadius: '999px',
                                          padding: '5px 12px',
                                          fontSize: '10px',
                                          letterSpacing: '0.10em',
                                          textTransform: 'uppercase',
                                          color: ORANGE,
                                          fontWeight: 500,
                                          marginBottom: '12px',
                                          display: 'inline-block',
                                        }}
                                      >
                                        + New from XQ Car Holidays
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <p
                                  style={{
                                    margin: '10px 0 8px 0',
                                    fontSize: '22px',
                                    fontWeight: 500,
                                    letterSpacing: '-0.02em',
                                    color: '#FFFFFF',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  The XQ Sunset Cruise.
                                </p>
                                <p
                                  style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,.80)',
                                    lineHeight: 1.55,
                                  }}
                                >
                                  Two hours of golden hour off Pantai Kok with fresh seafood,
                                  free-flow drinks, and a Langkawi sunset you&rsquo;ll be looking at
                                  for years.
                                </p>
                                {[
                                  'Departs daily · 5:30 PM',
                                  'Up to 12 guests · private option',
                                  'Free hotel transfer for renters',
                                ].map((feat) => (
                                  <p
                                    key={feat}
                                    style={{
                                      margin: '0 0 4px 0',
                                      fontSize: '12px',
                                      color: 'rgba(255,255,255,.85)',
                                    }}
                                  >
                                    <span style={{ color: ORANGE, fontWeight: 600 }}>&#10003;</span>
                                    &nbsp; {feat}
                                  </p>
                                ))}
                                <p
                                  style={{
                                    margin: '12px 0 14px 0',
                                    fontSize: '12px',
                                    letterSpacing: '0.10em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,.55)',
                                    fontWeight: 500,
                                  }}
                                >
                                  From{' '}
                                  <span
                                    style={{
                                      fontSize: '20px',
                                      letterSpacing: '-0.02em',
                                      color: '#FFFFFF',
                                      textTransform: 'none',
                                      fontWeight: 500,
                                    }}
                                  >
                                    RM 220
                                  </span>
                                  <span
                                    style={{
                                      textTransform: 'none',
                                      color: 'rgba(255,255,255,.6)',
                                      fontSize: '12px',
                                      letterSpacing: 0,
                                    }}
                                  >
                                    /pax
                                  </span>{' '}
                                  <span
                                    style={{
                                      textDecoration: 'line-through',
                                      color: 'rgba(255,255,255,.35)',
                                      textTransform: 'none',
                                      fontSize: '12px',
                                      letterSpacing: 0,
                                    }}
                                  >
                                    RM 280
                                  </span>
                                </p>
                                <Link
                                  href="https://cruise.xqholidays.com.my/sunset"
                                  style={{
                                    display: 'inline-block',
                                    background: ORANGE,
                                    color: '#FFFFFF',
                                    padding: '11px 20px',
                                    borderRadius: '999px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    letterSpacing: '-0.01em',
                                  }}
                                >
                                  Book the cruise &rarr;
                                </Link>
                                <p
                                  style={{
                                    margin: '12px 0 0 0',
                                    fontSize: '11px',
                                    color: 'rgba(255,255,255,.55)',
                                    lineHeight: 1.55,
                                  }}
                                >
                                  Free cancellation up to 24 h &middot; life jackets &amp; insurance
                                  included
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ── Get in touch ─────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px' }}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ background: DARK, borderRadius: '20px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '32px 28px', textAlign: 'center' }}>
                                <p
                                  style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '12px',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: '#FFD2A8',
                                    fontWeight: 500,
                                  }}
                                >
                                  Get in Touch
                                </p>
                                <p
                                  style={{
                                    margin: '0 0 18px 0',
                                    color: 'rgba(255,255,255,.85)',
                                    fontSize: '15px',
                                    lineHeight: 1.55,
                                    maxWidth: '42ch',
                                    display: 'inline-block',
                                  }}
                                >
                                  For inquiries about our affordable and safe car rental options in
                                  Langkawi:
                                </p>
                                <br />
                                <Link
                                  href="https://wa.me/60125105576?text=Hi%20XQ%20Car%2C%20I%20have%20inquiry%20about%20your%20car%20services..."
                                  style={{
                                    display: 'inline-block',
                                    background: ORANGE,
                                    color: '#FFFFFF',
                                    padding: '12px 22px',
                                    borderRadius: '999px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                  }}
                                >
                                  WhatsApp +60 12-510 5576
                                </Link>
                                <p
                                  style={{
                                    margin: '12px 0 0 0',
                                    textAlign: 'center',
                                  }}
                                >
                                  <Link
                                    href="tel:+601135215576"
                                    style={{
                                      color: '#FFFFFF',
                                      fontSize: '15px',
                                      textDecoration: 'none',
                                      fontWeight: 500,
                                    }}
                                  >
                                    +60 11-3521 5576
                                  </Link>
                                  <span style={{ color: 'rgba(255,255,255,.4)', padding: '0 8px' }}>
                                    &middot;
                                  </span>
                                  <Link
                                    href="mailto:cs@xqholidays.com.my"
                                    style={{
                                      color: '#FFD2A8',
                                      fontSize: '15px',
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

                    {/* ── T&C ──────────────────────────────────────────────── */}
                    <tr>
                      <td style={{ padding: '0 36px 28px 36px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: FOOTER_TEXT, lineHeight: 1.6 }}>
                          By completing this booking, you have agreed to our{' '}
                          <Link
                            href={publicSitePath('/terms')}
                            style={{ color: DARK, textDecoration: 'underline' }}
                          >
                            Terms and Conditions
                          </Link>
                          . By accepting the vehicle at pickup, you confirm acceptance of the rental
                          agreement and authorize charges for any additional fees described in this
                          email.
                        </p>
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
                              <td style={{ verticalAlign: 'middle' }}>
                                <EmailBrandMark size={24} labelColor={DARK} labelSize="14px" />
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
                          Please save it until after your trip.
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
