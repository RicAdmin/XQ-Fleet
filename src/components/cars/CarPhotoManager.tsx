import { useCallback, useRef, useState } from 'react'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ImageOff, Star, Trash2, Upload } from 'lucide-react'

import {
  deleteCarPhoto,
  generatePresignedUrl,
  reorderPhotos,
  saveCarPhoto,
  setCoverPhoto,
  type CarPhotoRow,
} from '#/lib/car-functions'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  carId: string
  initialPhotos: CarPhotoRow[]
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_MB = 10

// ─── Sortable photo item ──────────────────────────────────────────────────────

function SortablePhoto({
  photo,
  onSetCover,
  onDelete,
  isProcessing,
}: {
  photo: CarPhotoRow
  onSetCover: (id: string) => void
  onDelete: (id: string) => void
  isProcessing: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--foam)]"
    >
      <img src={photo.url} alt="Car photo" className="h-full w-full object-cover" />

      {/* Cover badge */}
      {photo.isCover && (
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[var(--lagoon)] px-2 py-0.5 text-xs font-semibold text-white">
          <Star className="h-3 w-3 fill-white" />
          Cover
        </span>
      )}

      {/* Action overlay */}
      <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          disabled={isProcessing || photo.isCover}
          onClick={() => onSetCover(photo.id)}
          title="Set as cover"
          className="rounded bg-white/90 p-1.5 text-[var(--sea-ink)] hover:bg-white disabled:opacity-40"
        >
          <Star className="h-3.5 w-3.5" />
        </button>

        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded bg-white/90 p-1.5 text-[var(--sea-ink)] hover:bg-white active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onDelete(photo.id)}
          title="Delete photo"
          className="rounded bg-white/90 p-1.5 text-red-600 hover:bg-white disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CarPhotoManager({ carId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<CarPhotoRow[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setUploadError(null)

      const validFiles: File[] = []
      for (const file of Array.from(files)) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setUploadError(`"${file.name}" is not a supported image type (JPEG, PNG, WebP).`)
          return
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setUploadError(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit.`)
          return
        }
        validFiles.push(file)
      }

      setUploading(true)
      try {
        for (const file of validFiles) {
          const { presignedUrl, publicUrl } = await generatePresignedUrl({
            data: { carId, fileName: file.name, contentType: file.type },
          })

          const res = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          })
          if (!res.ok) throw new Error(`Upload failed for "${file.name}".`)

          const newPhoto = await saveCarPhoto({ data: { carId, url: publicUrl, key: '' } })
          setPhotos((prev) => [...prev, newPhoto])
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed.')
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [carId],
  )

  // ── Set cover ─────────────────────────────────────────────────────────────

  const handleSetCover = useCallback(
    async (photoId: string) => {
      setProcessing(true)
      try {
        await setCoverPhoto({ data: { carId, photoId } })
        setPhotos((prev) => prev.map((p) => ({ ...p, isCover: p.id === photoId })))
      } catch {
        // ignore
      } finally {
        setProcessing(false)
      }
    },
    [carId],
  )

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (!confirm('Delete this photo?')) return
      setProcessing(true)
      try {
        await deleteCarPhoto({ data: { carId, photoId } })
        setPhotos((prev) => {
          const next = prev.filter((p) => p.id !== photoId)
          // If deleted was cover, promote first remaining
          if (prev.find((p) => p.id === photoId)?.isCover && next.length > 0) {
            next[0] = { ...next[0], isCover: true }
            setCoverPhoto({ data: { carId, photoId: next[0].id } }).catch(() => null)
          }
          return next
        })
      } catch {
        // ignore
      } finally {
        setProcessing(false)
      }
    },
    [carId],
  )

  // ── Drag & drop reorder ───────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    setPhotos((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id)
      const newIndex = prev.findIndex((p) => p.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex).map((p, i) => ({
        ...p,
        sortOrder: i,
      }))
      reorderPhotos({ data: { carId, photoIds: reordered.map((p) => p.id) } }).catch(() => null)
      return reordered
    })
  }

  const activePhoto = photos.find((p) => p.id === activeId)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <p className="island-kicker">Photos</p>

      {/* Upload zone */}
      <div
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[var(--line)] bg-[var(--foam)] px-6 py-8 transition-colors hover:border-[var(--lagoon)] hover:bg-[var(--sand)]"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <Upload className="h-6 w-6 text-[var(--sea-ink-soft)]" />
        <p className="text-sm text-[var(--sea-ink-soft)]">
          {uploading ? 'Uploading…' : 'Click to upload photos'}
        </p>
        <p className="text-xs text-[var(--sea-ink-soft)]">JPEG, PNG, WebP · max {MAX_FILE_SIZE_MB} MB each</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </div>

      {uploadError && <p className="form-error text-sm">{uploadError}</p>}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-[var(--sea-ink-soft)]">
          <ImageOff className="h-8 w-8 opacity-40" />
          <p className="text-sm">No photos yet</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photos.map((photo) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  onSetCover={handleSetCover}
                  onDelete={handleDelete}
                  isProcessing={processing}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activePhoto && (
              <div className="aspect-square overflow-hidden rounded-lg border-2 border-[var(--lagoon)] opacity-90">
                <img src={activePhoto.url} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
