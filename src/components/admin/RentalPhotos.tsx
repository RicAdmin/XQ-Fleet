import { useEffect, useRef, useState } from 'react'

import { Camera, Loader2 } from 'lucide-react'

import { showAdminToast } from '#/components/ui/AdminToast'
import {
  generateRentalPhotoUploadUrl,
  listRentalPhotos,
  saveRentalPhoto,
  type RentalPhotoRow,
} from '#/lib/rental-functions'
import { cn } from '#/lib/utils'

type RentalPhotosProps = {
  rentalId: string
  phase: 'pickup' | 'return'
}

const PHOTO_CATEGORIES = [
  { value: 'ic_passport', label: 'IC / Passport' },
  { value: 'dashboard', label: 'Dashboard (mileage / fuel)' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'damage', label: 'Damage' },
  { value: 'other', label: 'Other' },
]

export function RentalPhotos({ rentalId, phase }: RentalPhotosProps) {
  const [photos, setPhotos] = useState<RentalPhotoRow[]>([])
  const [category, setCategory] = useState('exterior')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    void listRentalPhotos({ data: { rentalId } })
      .then((rows) => {
        if (!cancelled) setPhotos(rows.filter((row) => row.phase === phase))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [rentalId, phase])

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const { presignedUrl, publicUrl } = await generateRentalPhotoUploadUrl({
        data: {
          rentalId,
          phase,
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
        },
      })
      const put = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file,
      })
      if (!put.ok) throw new Error('Upload failed.')
      const saved = await saveRentalPhoto({
        data: { rentalId, phase, category, url: publicUrl },
      })
      setPhotos((prev) => [saved as RentalPhotoRow, ...prev])
      showAdminToast('Photo uploaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          className="field-input h-9 flex-1"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Photo category"
        >
          {PHOTO_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label
          className={cn(
            'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--line)] px-3 text-sm font-medium text-[var(--sea-ink)]',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          {uploading ? 'Uploading…' : 'Add photo'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li key={photo.id}>
              <a href={photo.url} target="_blank" rel="noreferrer">
                <img
                  src={photo.url}
                  alt={photo.category}
                  className="aspect-square w-full rounded-md border border-[var(--line)] object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
