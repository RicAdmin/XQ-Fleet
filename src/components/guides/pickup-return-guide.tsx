import { useState } from 'react'
import { ArrowRight, Check, Clock, Fuel, Key, MapPin, Phone, Plane, Shield, Sparkles } from 'lucide-react'

import { GuidePageHeader, GuidePageShell } from './guide-shell'

const FLOWS = {
  'airport-pickup': [
    {
      t: 'Land and collect your bags',
      d: "After clearing immigration, head out through Door 3 — that's the southern arrivals exit. Look for our orange Car XQ sign.",
    },
    {
      t: 'Show your booking + license',
      d: "Just your booking ID and driver's license. We've already pre-verified your details from sign-up.",
    },
    {
      t: 'Walk-through with our team (5 min)',
      d: "We'll show you fuel level, dashboard lights, and any pre-existing scratches. Snap your own photos for peace of mind.",
    },
    {
      t: "Sign and you're off",
      d: 'Confirm fuel + mileage on the digital form. Get your keys + a free local map highlighting key roads.',
    },
  ],
  'airport-return': [
    {
      t: 'Fuel up before you head back',
      d: 'Petrol station at Padang Matsirat junction (3 km before the airport) is the closest. Snap a receipt.',
    },
    {
      t: 'Park in our drop-off bay',
      d: "Look for the same orange Car XQ sign at Door 3. Pull into bay 4 or 5 — they're marked for rentals.",
    },
    {
      t: 'Quick walk-around with our team',
      d: 'We check fuel, mileage, and obvious damage. Usually takes 3 minutes.',
    },
    {
      t: 'Sign off and head to your flight',
      d: 'Digital sign-off form. Receipt and security deposit refund hit your card within 24 hours.',
    },
  ],
  'jetty-pickup': [
    {
      t: 'Disembark at Kuah Jetty',
      d: "Once you're past the ferry exit, walk to the right toward the taxi stand. Our orange sign sits next to it.",
    },
    {
      t: 'Show your booking + license',
      d: "Same as airport — booking ID and driver's license. We've got everything else from sign-up.",
    },
    {
      t: 'Walk-through with our team (5 min)',
      d: 'Fuel, dashboard, any scratches. Take your own photos so there is no doubt.',
    },
    {
      t: 'Sign and explore',
      d: 'Digital sign-off. Kuah town is 2 minutes away, Pantai Cenang is 25 minutes by car.',
    },
  ],
  'jetty-return': [
    {
      t: 'Fuel up at Kuah Petronas',
      d: "There's a Petronas on Jalan Kuah, 1 km from the jetty. Quick top-up — keep the receipt.",
    },
    {
      t: 'Park in our return bay near the taxi stand',
      d: "Look for the orange sign. We've got 2 dedicated bays beside the jetty taxi rank.",
    },
    {
      t: 'Walk-around (3 min)',
      d: 'We verify fuel, mileage, condition together. Easy.',
    },
    {
      t: 'Done — make your ferry',
      d: "Digital sign-off, deposit refund within 24 h. You're free to board.",
    },
  ],
} as const

const CHECKS = {
  fuel: [
    'Return with the same fuel level as pickup (we mark it on your form).',
    'If you arrive low, we charge market refuel + a small admin fee.',
    'RON 95 is the standard in Malaysia. Cars take petrol unless your booking says Diesel.',
    'Closest petrol from airport: Padang Matsirat junction · from jetty: Kuah Petronas.',
  ],
  leaving: [
    'Take all personal items — front pocket, glove box, under the seats, the boot.',
    'Charging cables, sunglasses, beach bags — easy to forget.',
    'Lock the car and double-check before walking away.',
    'Keep the keys with you — drop them with our team in person, not the rental box.',
  ],
  returnCheck: [
    'Walk around the car with our team — every dent or scratch is logged on the digital form.',
    'Fuel level photo (we will take one too).',
    'Mileage reading.',
    'Sign the digital handover form. Your security deposit is refunded within 24 hours.',
  ],
} as const

export function PickupReturnGuide() {
  const [where, setWhere] = useState<'airport' | 'jetty'>('airport')
  const [mode, setMode] = useState<'pickup' | 'return'>('pickup')

  const flowKey = `${where}-${mode}` as keyof typeof FLOWS
  const steps = FLOWS[flowKey]

  return (
    <GuidePageShell>
      <GuidePageHeader
        kicker="Step-by-step guide"
        title="Pickup & returning your rental car."
        body="Where to meet us, what to bring, and a quick walk-through for both Langkawi airport and the Kuah jetty."
      />

      <section className="page-section pickup-return-page">
        <div className="pkr-segmented">
          <div className="pkr-row">
            <span className="pkr-row-label">Location</span>
            <div className="pkr-tabs">
              <button type="button" className={where === 'airport' ? 'on' : ''} onClick={() => setWhere('airport')}>
                <Plane size={14} /> Langkawi Airport
              </button>
              <button type="button" className={where === 'jetty' ? 'on' : ''} onClick={() => setWhere('jetty')}>
                <MapPin size={14} /> Kuah Ferry Jetty
              </button>
            </div>
          </div>
          <div className="pkr-row">
            <span className="pkr-row-label">Direction</span>
            <div className="pkr-tabs">
              <button type="button" className={mode === 'pickup' ? 'on' : ''} onClick={() => setMode('pickup')}>
                <Key size={14} /> Picking up
              </button>
              <button type="button" className={mode === 'return' ? 'on' : ''} onClick={() => setMode('return')}>
                <ArrowRight size={14} /> Returning
              </button>
            </div>
          </div>
        </div>

        <div className="pkr-flow">
          <div className="pkr-flow-head">
            <h2>
              {mode === 'pickup' ? 'Pickup at ' : 'Return at '}
              {where === 'airport' ? 'Langkawi Intl Airport' : 'Kuah Ferry Jetty'}
            </h2>
            <span className="pkr-meta">
              <Clock size={12} /> Typically {mode === 'pickup' ? '10 minutes' : '5 minutes'} · friendly humans, no queues
            </span>
          </div>
          <ol className="pkr-steps">
            {steps.map((s, i) => (
              <li key={s.t} className="pkr-step">
                <span className="pkr-step-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{s.t}</strong>
                  <p>{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="pkr-checklists">
          <article className="pkr-check">
            <div className="pkr-check-head">
              <span className="pkr-check-icon">
                <Fuel size={20} />
              </span>
              <h3>Fuel check</h3>
            </div>
            <ul>
              {CHECKS.fuel.map((t) => (
                <li key={t}>
                  <Check size={12} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="pkr-check">
            <div className="pkr-check-head">
              <span className="pkr-check-icon">
                <Sparkles size={20} />
              </span>
              <h3>Before leaving the car</h3>
            </div>
            <ul>
              {CHECKS.leaving.map((t) => (
                <li key={t}>
                  <Check size={12} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="pkr-check">
            <div className="pkr-check-head">
              <span className="pkr-check-icon">
                <Shield size={20} />
              </span>
              <h3>Return procedure</h3>
            </div>
            <ul>
              {CHECKS.returnCheck.map((t) => (
                <li key={t}>
                  <Check size={12} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="pkr-help">
          <div>
            <strong>Anything unclear?</strong>
            <p>WhatsApp our pickup team — replies usually under 4 minutes, 24/7. We would rather answer one quick question than fix a confusion later.</p>
          </div>
          <div className="pkr-help-actions">
            <a className="btn btn-leaf" href="https://wa.me/601135215576" target="_blank" rel="noreferrer">
              <Phone size={13} /> WhatsApp +60 11 3521 5576
            </a>
            <a className="btn btn-ghost pkr-help-email" href="mailto:hello@carxq.my">
              Email support
            </a>
          </div>
        </div>
      </section>
    </GuidePageShell>
  )
}
