import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowRight, MapPin, Plane, Ship, X } from 'lucide-react'

import { RENTAL_LOCATIONS } from './cxq-landing-data'

const ISLAND_PATH =
  'M 95 155 C 72 98, 118 52, 188 44 C 258 36, 318 68, 338 128 C 358 198, 348 288, 308 352 C 262 408, 188 428, 118 408 C 58 388, 38 318, 48 248 C 58 198, 78 172, 95 155 Z'

type Location = (typeof RENTAL_LOCATIONS)[number]

export function LangkawiMapModal({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<string | null>(RENTAL_LOCATIONS[0]?.name ?? null)
  const activeLoc = RENTAL_LOCATIONS.find((loc) => loc.name === active)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="langkawi-map-modal" role="presentation" onClick={onClose}>
      <div
        className="langkawi-map-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="langkawi-map-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="langkawi-map-head">
          <div>
            <span className="langkawi-map-eyebrow">Pickup & drop-off zones</span>
            <h2 id="langkawi-map-title">Langkawi delivery map</h2>
            <p>Tap a pin or location — we meet you at the airport, jetty, or your hotel across the island.</p>
          </div>
          <button type="button" className="close-btn" aria-label="Close map" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <div className="langkawi-map-body">
          <div className="langkawi-map-stage" aria-hidden={false}>
            <div className="langkawi-map-ocean" />
            <svg className="langkawi-map-svg" viewBox="0 0 400 450" role="img" aria-label="Stylised map of Langkawi Island">
              <defs>
                <linearGradient id="langkawiLand" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F8FAF7" />
                  <stop offset="100%" stopColor="#E8EDE4" />
                </linearGradient>
                <filter id="langkawiShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#14181A" floodOpacity="0.12" />
                </filter>
              </defs>
              <path
                className="langkawi-map-island"
                d={ISLAND_PATH}
                fill="url(#langkawiLand)"
                stroke="#C8D4C0"
                strokeWidth="2"
                filter="url(#langkawiShadow)"
              />
              <path className="langkawi-map-coast" d={ISLAND_PATH} fill="none" stroke="rgba(255,102,0,.35)" strokeWidth="1.5" />
            </svg>

            {RENTAL_LOCATIONS.map((loc, i) => (
              <MapPinButton
                key={loc.name}
                loc={loc}
                index={i}
                active={active === loc.name}
                onSelect={() => setActive(loc.name)}
              />
            ))}

            {activeLoc ? (
              <div
                className="langkawi-map-tooltip"
                style={{ left: `${activeLoc.mapPin.x}%`, top: `${activeLoc.mapPin.y}%` }}
              >
                <strong>{activeLoc.name}</strong>
                {'meetPoint' in activeLoc && activeLoc.meetPoint ? (
                  <span className="langkawi-map-tooltip-tag">Main meet point</span>
                ) : null}
                <a href={activeLoc.mapsUrl} target="_blank" rel="noopener noreferrer">
                  Open in Google Maps <ArrowRight size={11} />
                </a>
              </div>
            ) : null}
          </div>

          <aside className="langkawi-map-list">
            <h3>All locations</h3>
            <ul>
              {RENTAL_LOCATIONS.map((loc) => (
                <li key={loc.name}>
                  <button
                    type="button"
                    className={active === loc.name ? 'is-active' : undefined}
                    onMouseEnter={() => setActive(loc.name)}
                    onFocus={() => setActive(loc.name)}
                    onClick={() => setActive(loc.name)}
                  >
                    <span className="langkawi-map-list-icon">
                      {'meetPoint' in loc && loc.meetPoint ? (
                        loc.name.includes('Airport') ? <Plane size={13} /> : <Ship size={13} />
                      ) : (
                        <MapPin size={13} />
                      )}
                    </span>
                    <span className="langkawi-map-list-label">
                      {loc.name}
                      {'meetPoint' in loc && loc.meetPoint ? <em>Meet point</em> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}

function MapPinButton({
  loc,
  index,
  active,
  onSelect,
}: {
  loc: Location
  index: number
  active: boolean
  onSelect: () => void
}) {
  const isMeet = 'meetPoint' in loc && loc.meetPoint

  return (
    <button
      type="button"
      className={[
        'langkawi-map-pin',
        active ? 'is-active' : '',
        isMeet ? 'is-meet' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          left: `${loc.mapPin.x}%`,
          top: `${loc.mapPin.y}%`,
          '--pin-delay': `${index * 55}ms`,
        } as CSSProperties
      }
      aria-label={`${loc.name}${isMeet ? ', main meet point' : ''}`}
      aria-pressed={active}
      onClick={onSelect}
    >
      {isMeet ? <span className="langkawi-map-pin-ring" /> : null}
      <span className="langkawi-map-pin-dot" />
      <span className="langkawi-map-pin-label">{loc.name}</span>
    </button>
  )
}
