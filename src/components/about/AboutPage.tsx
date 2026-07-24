import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, MapPin, Phone, Shield } from 'lucide-react'

import PublicMarketingShell from '#/components/shells/PublicMarketingShell'
import { LEGAL_COMPANY } from '#/lib/legal/company'
import { RENTAL_LOCATIONS } from '#/components/landing/cxq-landing-data'

const WHY_CHOOSE = [
  {
    title: 'An owned fleet, maintained to authorised-dealer standards',
    body: 'From the fuel-efficient Perodua Axia and Toyota Vios to the adventure-ready Suzuki Jimny, family MPVs, and stylish Mini Cooper options — the majority of our vehicles are owned by XQ Holidays and serviced exclusively by authorised dealerships. New, clean, and road-ready, every time.',
  },
  {
    title: 'The only OKU-friendly rental on the island',
    body: 'We are the only car rental service in Langkawi offering dedicated OKU-friendly (special needs accessible) vehicles. Inclusive travel is not a feature we added — it is a commitment we built the company around.',
  },
  {
    title: 'Island-wide delivery, free at key locations',
    body: 'Free pickup and drop-off at Langkawi International Airport and Kuah Jetty. Convenient delivery to Pantai Cenang, Pantai Tengah, Pantai Kok, Tanjung Rhu, Datai Bay, Burau Bay, Telaga Harbour, and every resort in between.',
  },
  {
    title: 'Transparent pricing from RM 70 per day',
    body: 'No hidden fees, no inflated insurance charges at handover, no surprises at return. The price you see online is the price you pay.',
  },
  {
    title: 'Local knowledge, earned the right way',
    body: 'Our team has spent years walking these beaches, driving these roads, and learning which corner of the island catches the best sunset. Booking a car with us means more than a vehicle — it means a quick conversation about where to find the freshest seafood in Kuah, which routes turn into rivers during monsoon season, and the quiet stretch of Pantai Kok most tourists never see.',
  },
] as const

const LICENSE_ITEMS = [
  `Company registration: ${LEGAL_COMPANY.name} (${LEGAL_COMPANY.registrationNo})`,
  `Tourism licence: ${LEGAL_COMPANY.kpkLn}`,
  'MATTA member: MA4659 (Malaysian Association of Tour and Travel Agents)',
  `Headquartered in Langkawi: ${LEGAL_COMPANY.address}`,
] as const

export function AboutPage() {
  return (
    <PublicMarketingShell screenLabel="About XQ Car Rental" mainClassName="container about-page-main">
      <article className="about-page">
        <header className="about-hero">
          <span className="eyebrow">About us</span>
          <h1 className="h-section">XQ Car Rental Langkawi</h1>
          <p className="about-hero-lead">Trusted Langkawi car rental since 2015</p>
          <p className="about-hero-intro">
            XQ Car Rental is the dedicated vehicle rental service of Xiao Qiang Holidays Sdn Bhd (Company
            No. {LEGAL_COMPANY.registrationNo} | {LEGAL_COMPANY.kpkLn} | MATTA Member MA4659), a licensed
            Malaysian tourism company headquartered in the heart of Kuah, Langkawi.
          </p>
          <p className="about-hero-intro">
            For over a decade, we have helped travellers, families, and business visitors discover Langkawi
            the way it should be discovered — at their own pace, on their own route, in a vehicle they can
            trust. From the moment you land at Langkawi International Airport to the moment you drop your
            keys at Kuah Jetty, our fleet is built to make the island yours.
          </p>
        </header>

        <section className="about-section-block">
          <h2>Your safety, our standard</h2>
          <p>
            When you rent with XQ Car Rental, you are not handed an unknown car from an unknown source. The
            majority of our fleet is directly owned and operated by XQ Holidays. That single fact changes
            everything about the experience you receive.
          </p>
          <p>
            Because we own the cars, we control how they are looked after. Every vehicle is serviced on
            schedule by authorised dealerships, not roadside workshops. Tyres are checked, brakes are
            inspected, fluids are topped, and the interior is detailed before every single rental. Nothing
            leaves our lot unless we would be comfortable putting our own family in it.
          </p>
          <p>
            We also operate our vehicles sensitively between rentals — short, careful runs only, with our own
            trained team behind the wheel. No aggressive driving. No long-distance abuse. No cutting corners
            on care. When you collect your car, it has been treated with the same respect we expect you to
            give it back.
          </p>
          <p>
            This is why travellers, especially families with young children, first-time visitors to Malaysia,
            and solo travellers, choose XQ. You should not have to wonder whether the car you are about to
            drive across an unfamiliar island is safe. With us, you do not have to.
          </p>
        </section>

        <section className="about-section-block">
          <h2>Why travellers choose XQ Car Rental</h2>
          <div className="about-why-grid">
            {WHY_CHOOSE.map((item) => (
              <article key={item.title} className="about-why-card">
                <span className="about-why-icon" aria-hidden>
                  <Check size={16} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section-block">
          <h2>Our story: founded on a love for Langkawi</h2>
          <p>XQ Holidays began with a simple idea — to share the very best of Pulau Langkawi with the world.</p>
          <p>
            Our founder arrived in Langkawi as a visitor and never quite left. What started as a holiday
            became something deeper. The slow rhythm of the island, the warmth of its people, the way the
            light falls on the Andaman Sea at dusk — Langkawi has a way of holding on to those who pay
            attention. He paid attention, fell in love, and decided to stay.
          </p>
          <p>
            Out of that love, XQ Holidays was born. A company built not by someone selling a destination, but
            by someone who chose this destination as home. Every cruise we book, every itinerary we plan, every
            car we hand to a traveller carries that same intention: this is an island worth knowing well, and
            we want you to know it the way we have come to.
          </p>
          <blockquote className="about-quote">
            <p>You Play, I Think.</p>
            <footer>
              You came here to experience Langkawi. Let us handle the logistics — the booking, the delivery,
              the local know-how — so your only job is to enjoy the island we already love.
            </footer>
          </blockquote>
        </section>

        <section className="about-section-block">
          <h2>Part of an integrated Langkawi tourism brand</h2>
          <p>
            XQ Car Rental is one service pillar within XQ Holidays&apos; integrated tourism offering in
            Langkawi. Through our sister platforms, we also coordinate{' '}
            <a href="https://cruise.xqholidays.com.my/" target="_blank" rel="noopener noreferrer">
              sunset and private cruise bookings
            </a>
            , island hopping packages, attraction tickets at exclusive rates, and tailored itinerary planning
            — so when you rent with XQ, you have a single trusted partner for the entire trip.
          </p>
        </section>

        <section className="about-section-block about-license">
          <div className="about-license-head">
            <Shield size={22} />
            <h2>Licensed, insured, and MATTA accredited</h2>
          </div>
          <ul>
            {LICENSE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            When you book with XQ Car Rental, you are booking with a licensed Malaysian tour and travel
            operator, not an unregulated middleman. Every booking is covered by valid commercial vehicle
            insurance and backed by a physical office you can walk into.
          </p>
          <div className="about-matta">
            <img
              src="/images/payments/Matta%20Logo.png"
              alt="MATTA — Malaysia Association of Tour and Travel Agents"
              loading="lazy"
              decoding="async"
              width={57}
              height={44}
            />
          </div>
        </section>

        <section className="about-section-block">
          <h2>Our service area</h2>
          <p>We deliver to every corner of Langkawi. If you can point to it on a map of Langkawi, we will meet you there.</p>
          <div className="about-locations">
            {RENTAL_LOCATIONS.map((loc) => (
              <a
                key={loc.name}
                href={loc.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="chip"
              >
                <MapPin size={12} />
                {loc.name}
              </a>
            ))}
          </div>
        </section>

        <section className="about-cta">
          <div>
            <h2>Ready to drive Langkawi your way?</h2>
            <p>
              Browse our fleet, pick your dates, and reserve your car in under three minutes. Free delivery
              at the airport and jetty. Transparent rates. Local team on standby.
            </p>
          </div>
          <div className="about-cta-actions">
            <Link to="/" hash="top-picks" className="btn btn-ghost">
              Browse our fleet
            </Link>
            <Link to="/" hash="booking-dock" className="btn btn-leaf">
              Book now <ArrowRight size={14} />
            </Link>
            <a
              className="btn btn-ghost"
              href="https://wa.me/601135215576?text=Hi%20XQ%20Car%20Rental%20—%20I%20have%20a%20question"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone size={13} /> Contact us on WhatsApp
            </a>
          </div>
        </section>
      </article>
    </PublicMarketingShell>
  )
}
