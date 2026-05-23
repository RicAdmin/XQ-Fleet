import { useState } from 'react'
import { Car, Fuel, Phone, Shield } from 'lucide-react'

import { GuidePageHeader, GuidePageShell } from './guide-shell'

type KnowId = 'parking' | 'fines' | 'fuel' | 'accident'

type KnowIcon = 'cab' | 'shield' | 'fuel' | 'phone'

const KNOWHOW: Array<{
  id: KnowId
  title: string
  intro: string
  points: Array<{ t: string; d: string }>
  icon: KnowIcon
}> = [
  {
    id: 'parking',
    icon: 'cab',
    title: 'Street parking',
    intro: "Most of Langkawi has free parking. Where it isn't free, the rules are simple — yellow lines and coupon zones.",
    points: [
      {
        t: 'Free zones',
        d: "Pantai Cenang's main strip, Tanjung Rhu beach, Kilim Park, Sky Bridge base — all free. Arrive before 10 am in peak season.",
      },
      {
        t: 'Coupon parking',
        d: 'Some of Kuah town has coupon-paid parking — RM 0.40/hour. Buy coupons from the corner shops; scratch the date + time and leave on dash.',
      },
      {
        t: 'Hotel parking',
        d: 'Most resorts have free parking for guests. Mention your booking at the gate if asked.',
      },
      {
        t: 'What to avoid',
        d: 'Yellow lines = no stopping. Red lines = tow zone. Police are friendly but a tow at 2 am is no fun.',
      },
    ],
  },
  {
    id: 'fines',
    icon: 'shield',
    title: 'Speeding & fines',
    intro: 'Langkawi is patient on the road, but two highway stretches have automated speed cameras (AES). Know them and you will be fine.',
    points: [
      { t: 'Speed limits', d: 'Towns 50 km/h · Rural roads 70 km/h · No expressways on Langkawi.' },
      {
        t: 'AES camera stretches',
        d: 'Jalan Padang Matsirat (airport → Kuah) and Jalan Kuah → Tanjung Rhu. Both 70 km/h. Watch the signage.',
      },
      {
        t: 'If you get a fine',
        d: "It's mailed to us first. We forward it to your email with the original notice. You can pay direct via JPJ online portal.",
      },
      {
        t: 'Drinking',
        d: "Malaysia's limit is 0.08% BAC. The cleanest answer: don't drink and drive at all. Grab is cheap on the island.",
      },
    ],
  },
  {
    id: 'fuel',
    icon: 'fuel',
    title: 'Fuelling up',
    intro: 'Government-set fuel prices, so every station is the same. Three stations cover most of the island.',
    points: [
      { t: 'RON 95', d: 'The standard. Use this unless your booking says Diesel. Currently around RM 2.05/litre.' },
      { t: 'Closest to airport', d: 'Petronas at Padang Matsirat junction — 3 km from arrivals.' },
      { t: 'Closest to jetty', d: 'Petronas on Jalan Kuah — 1 km from the ferry terminal.' },
      {
        t: 'Up north',
        d: "There's one Shell along the Datai road, then a long stretch with none. Top up before heading to Tanjung Rhu or Datai Bay.",
      },
      {
        t: 'Returning the car',
        d: "Match the fuel level on your form. Save the petrol receipt — proof if there's any dispute.",
      },
    ],
  },
  {
    id: 'accident',
    icon: 'phone',
    title: 'Accident handling',
    intro: 'Small bumps happen. Keep calm and follow these three steps — we will guide you through it.',
    points: [
      {
        t: "1. Make sure everyone's safe",
        d: "Move to the side of the road if possible. Hazard lights on. If anyone's hurt, dial 999.",
      },
      {
        t: '2. Call us first',
        d: "Our roadside line: +60 11 3521 5576. We'll guide you through the report. We reach you within 30 minutes anywhere on the island.",
      },
      {
        t: '3. Take photos',
        d: "Both cars, both license plates, the road, any signage, the other driver's IC + license. More photos = easier insurance later.",
      },
      {
        t: 'Police report',
        d: 'Malaysia requires a police report within 24 hours of any accident. We help you do this at the Kuah district station.',
      },
      {
        t: "Insurance — what's covered",
        d: 'Coverage varies by booking. Ask us about optional collision damage waiver (from RM 25/day) before you travel.',
      },
    ],
  },
]

function KhIcon({ kind, size }: { kind: KnowIcon; size: number }) {
  switch (kind) {
    case 'cab':
      return <Car size={size} />
    case 'shield':
      return <Shield size={size} />
    case 'fuel':
      return <Fuel size={size} />
    case 'phone':
      return <Phone size={size} />
    default:
      return null
  }
}

export function KnowHowGuide() {
  const [openId, setOpenId] = useState<KnowId>('parking')

  return (
    <GuidePageShell>
      <GuidePageHeader
        kicker="Know-how"
        title="Driving in Langkawi — the practical bits."
        body="Street parking, speed cameras, fuel stations, and what to do if something goes sideways. Read it once on the plane and you are set."
      />

      <section className="page-section know-how-page">
        <div className="kh-nav">
          {KNOWHOW.map((k) => (
            <button key={k.id} type="button" className={'kh-nav-btn' + (openId === k.id ? ' on' : '')} onClick={() => setOpenId(k.id)}>
              <span className="kh-nav-icon">
                <KhIcon kind={k.icon} size={22} />
              </span>
              <span>{k.title}</span>
            </button>
          ))}
        </div>

        <div className="kh-grid">
          {KNOWHOW.map((k) => (
            <article key={k.id} id={k.id} className={'kh-card' + (openId === k.id ? ' focused' : '')}>
              <header>
                <span className="kh-card-icon">
                  <KhIcon kind={k.icon} size={22} />
                </span>
                <div>
                  <h3>{k.title}</h3>
                  <p>{k.intro}</p>
                </div>
              </header>
              <ul className="kh-points">
                {k.points.map((p) => (
                  <li key={p.t}>
                    <span className="kh-point-bullet" />
                    <div>
                      <strong>{p.t}</strong>
                      <span>{p.d}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="kh-emergency">
          <div className="kh-emergency-icon">
            <Phone size={24} />
          </div>
          <div>
            <strong>Emergency? Save these now.</strong>
            <div className="kh-emergency-list">
              <span>
                <b>999</b> · Malaysia general emergency (ambulance, police, fire)
              </span>
              <span>
                <b>+60 4 966 3333</b> · Sultanah Maliha Hospital (Langkawi)
              </span>
              <span>
                <b>+60 11 3521 5576</b> · XQ Car 24/7 roadside
              </span>
            </div>
          </div>
        </div>
      </section>
    </GuidePageShell>
  )
}
