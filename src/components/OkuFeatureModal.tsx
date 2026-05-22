import { useEffect, useRef } from 'react'
import { Accessibility, X } from 'lucide-react'

import {
  OKU_NBOX_FEATURES,
  OKU_NBOX_HEADLINE,
  OKU_NBOX_SUMMARY,
  OKU_NBOX_VIDEO_SRC,
  okuVideoEmbedUrl,
  okuVideoIsEmbed,
} from '#/lib/fleet-oku'
import type { PublicCarRow } from '#/lib/portal-functions'

export function OkuFeatureModal({ car, onClose }: { car: PublicCarRow; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const useEmbed = okuVideoIsEmbed(OKU_NBOX_VIDEO_SRC)
  const embedSrc = useEmbed ? okuVideoEmbedUrl(OKU_NBOX_VIDEO_SRC) : ''

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
        <button type="button" className="close-btn oku-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="oku-modal-head">
          <span className="oku-modal-icon" aria-hidden>
            <Accessibility size={22} />
          </span>
          <div>
            <span className="eyebrow">Honda N-Box only</span>
            <h3 id="oku-feature-title">{OKU_NBOX_HEADLINE}</h3>
            <p>{OKU_NBOX_SUMMARY}</p>
          </div>
        </div>

        <div className="oku-modal-video-wrap">
          {useEmbed ? (
            <iframe
              src={embedSrc}
              title="How to use OKU features on the Honda N-Box"
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
              Your browser does not support video playback.
            </video>
          )}
        </div>

        <ul className="oku-modal-list">
          {OKU_NBOX_FEATURES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="oku-modal-foot">
          {car.make} {car.model} · Ask our team on WhatsApp if you need help loading equipment at pickup.
        </p>
      </div>
    </div>
  )
}
