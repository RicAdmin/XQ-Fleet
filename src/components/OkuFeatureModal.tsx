import { useEffect, useMemo, useRef } from 'react'
import { Accessibility, X } from 'lucide-react'

import { usePublicI18n } from '#/i18n/usePublicI18n'
import { OKU_NBOX_VIDEO_SRC, okuVideoEmbedUrl, okuVideoIsEmbed } from '#/lib/fleet-oku'
import type { PublicCarRow } from '#/lib/portal-functions'

export function OkuFeatureModal({ car, onClose }: { car: PublicCarRow; onClose: () => void }) {
  const { t } = usePublicI18n()
  const videoRef = useRef<HTMLVideoElement>(null)
  const useEmbed = okuVideoIsEmbed(OKU_NBOX_VIDEO_SRC)
  const embedSrc = useEmbed ? okuVideoEmbedUrl(OKU_NBOX_VIDEO_SRC) : ''

  const features = useMemo(
    () => [
      t('carDetail.okuFeature1'),
      t('carDetail.okuFeature2'),
      t('carDetail.okuFeature3'),
      t('carDetail.okuFeature4'),
    ],
    [t],
  )

  useEffect(() => {
    if (!useEmbed) {
      videoRef.current?.play().catch(() => {})
    }
  }, [useEmbed])

  return (
    <div className="oku-overlay" role="presentation" onClick={onClose}>
      <div
        className="oku-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oku-feature-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="close-btn oku-modal-close" onClick={onClose} aria-label={t('common.close')}>
          <X size={16} />
        </button>

        <div className="oku-modal-head">
          <span className="oku-modal-icon" aria-hidden>
            <Accessibility size={22} />
          </span>
          <div>
            <span className="eyebrow">{t('carDetail.okuNboxOnly')}</span>
            <h3 id="oku-feature-title">{t('carDetail.okuHeadline')}</h3>
            <p>{t('carDetail.okuSummary')}</p>
          </div>
        </div>

        <div className="oku-modal-video-wrap">
          {useEmbed ? (
            <iframe
              src={embedSrc}
              title={t('carDetail.okuVideoTitle')}
              className="oku-modal-embed"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              className="oku-modal-video"
              src={OKU_NBOX_VIDEO_SRC}
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              disableRemotePlayback
              onContextMenu={(e) => e.preventDefault()}
            >
              {t('carDetail.okuVideoUnsupported')}
            </video>
          )}
        </div>

        <ul className="oku-modal-list">
          {features.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="oku-modal-foot">
          {t('carDetail.okuFoot', { make: car.make, model: car.model })}
        </p>
      </div>
    </div>
  )
}
