import { Car, Luggage, Sparkles, Users, X } from 'lucide-react'

import { usePublicI18n } from '#/i18n/usePublicI18n'
import type { PublicCarRow } from '#/lib/portal-functions'
import { heuristicLuggageFit } from '#/lib/fleet-luggage-fit'

export function LuggageFitModal({ car, onClose }: { car: PublicCarRow; onClose: () => void }) {
  const { t } = usePublicI18n()
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
          aria-label={t('common.close')}
        >
          <X size={16} />
        </button>

        <div className="luggage-head">
          <span className="eyebrow">{t('carDetail.luggageFitEyebrow', { category: car.category })}</span>
          <h3 id="luggage-fit-title">
            {t('carDetail.luggageFitsTitle', { make: car.make, model: car.model })}
          </h3>
          <p>{t('carDetail.luggageFitIntro')}</p>
        </div>

        <div className="luggage-stage">
          <div className="luggage-stage-car">
            {car.coverPhotoUrl ? (
              <img src={car.coverPhotoUrl} alt={`${car.make} ${car.model}`} />
            ) : (
              <div style={{ padding: 40 }}>{t('carDetail.noPhoto')}</div>
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
              <span className="luggage-counter-label">
                {fit.lg !== 1 ? t('carDetail.largeSuitcases') : t('carDetail.largeSuitcase')}
              </span>
              <span className="luggage-counter-sub">{t('carDetail.largeDim')}</span>
            </div>
          </div>
          <div className="luggage-counter">
            <span className="luggage-counter-icon">
              <Luggage size={16} />
            </span>
            <div>
              <span className="luggage-counter-num">{fit.sm}</span>
              <span className="luggage-counter-label">
                {fit.sm !== 1 ? t('carDetail.smallCarryOns') : t('carDetail.smallCarryOn')}
              </span>
              <span className="luggage-counter-sub">{t('carDetail.smallDim')}</span>
            </div>
          </div>
        </div>

        <div className="luggage-meta">
          <span>
            <Car size={12} /> {t('carDetail.bootCapacity')}: <b>{fit.boot}</b>
          </span>
          <span>
            <Users size={12} /> {t('carDetail.upToPassengers', { count: fit.seats })}
          </span>
          <span>
            <Sparkles size={12} /> {t('carDetail.combinedCapacity', { litres: totalLitres })}
          </span>
        </div>

        <div className="luggage-tip">
          <Sparkles size={14} style={{ color: 'var(--brand-leaf)', flexShrink: 0 }} />
          <p>{t('carDetail.luggageTip')}</p>
        </div>
      </div>
    </div>
  )
}
