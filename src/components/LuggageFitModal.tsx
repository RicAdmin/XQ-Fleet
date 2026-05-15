import { Car, Luggage, Sparkles, Users, X } from 'lucide-react'

import type { PublicCarRow } from '#/lib/portal-functions'
import { heuristicLuggageFit } from '#/lib/fleet-luggage-fit'

export function LuggageFitModal({ car, onClose }: { car: PublicCarRow; onClose: () => void }) {
  const fit = heuristicLuggageFit(car.category)
  const totalLitres = fit.lg * 75 + fit.sm * 35

  return (
    <div className="luggage-overlay" role="presentation" onClick={onClose}>
      <div
        className="luggage-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="luggage-fit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="close-btn"
          style={{ position: 'absolute', top: 14, right: 14 }}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="luggage-head">
          <span className="eyebrow">{car.category} · luggage fit guide</span>
          <h3 id="luggage-fit-title">
            {car.make} {car.model} fits…
          </h3>
          <p>
            Illustrative capacity for this category. Large = 75 L check-in, small = 35 L cabin. Your exact vehicle may
            vary — ask us on WhatsApp if you are unsure.
          </p>
        </div>

        <div className="luggage-stage">
          <div className="luggage-stage-car">
            {car.coverPhotoUrl ? (
              <img src={car.coverPhotoUrl} alt={`${car.make} ${car.model}`} />
            ) : (
              <div style={{ padding: 40 }}>No photo</div>
            )}
            <div className="luggage-stage-floor" aria-hidden="true" />
          </div>
          <div className="luggage-stage-trunk">
            <div className="trunk-frame" aria-hidden="true">
              <span className="trunk-lid" />
              <span className="trunk-floor" />
            </div>
            <div className="trunk-bags">
              {Array.from({ length: fit.lg }).map((_, i) => (
                <span key={`lg-${i}`} className="bag lg" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="bag-handle" />
                  <span className="bag-stripe" />
                  <em>L</em>
                </span>
              ))}
              {Array.from({ length: fit.sm }).map((_, i) => (
                <span key={`sm-${i}`} className="bag sm" style={{ animationDelay: `${(fit.lg + i) * 0.08}s` }}>
                  <span className="bag-handle" />
                  <span className="bag-stripe" />
                  <em>S</em>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="luggage-counts">
          <div className="luggage-counter">
            <span className="luggage-counter-icon">
              <Luggage size={20} />
            </span>
            <div>
              <span className="luggage-counter-num">{fit.lg}</span>
              <span className="luggage-counter-label">Large suitcase{fit.lg !== 1 ? 's' : ''}</span>
              <span className="luggage-counter-sub">75 × 50 × 30 cm · 75 L each</span>
            </div>
          </div>
          <div className="luggage-counter">
            <span className="luggage-counter-icon">
              <Luggage size={16} />
            </span>
            <div>
              <span className="luggage-counter-num">{fit.sm}</span>
              <span className="luggage-counter-label">Small / carry-on{fit.sm !== 1 ? 's' : ''}</span>
              <span className="luggage-counter-sub">55 × 40 × 23 cm · 35 L each</span>
            </div>
          </div>
        </div>

        <div className="luggage-meta">
          <span>
            <Car size={12} /> Boot capacity: <b>{fit.boot}</b>
          </span>
          <span>
            <Users size={12} /> Up to {fit.seats} passenger seats (typical)
          </span>
          <span>
            <Sparkles size={12} /> ≈ {totalLitres} L combined
          </span>
        </div>

        <div className="luggage-tip">
          <Sparkles size={14} style={{ color: 'var(--brand-leaf)', flexShrink: 0 }} />
          <p>
            Tip: figures assume seats are up. Folding rear seats often increases boot space — tell us your group size
            when you book.
          </p>
        </div>
      </div>
    </div>
  )
}
