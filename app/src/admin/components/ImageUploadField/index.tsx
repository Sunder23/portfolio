import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { compressImage } from '@/admin/lib/imageCompress'
import { isPendingImage, type PendingImage } from '@/admin/lib/resolvePendingImages'

// Upload is deferred: picking a file only compresses it locally and stages a PendingImage
// (blob + local preview URL) in the field's value — the actual GitHub write happens once,
// for every staged image across the whole session, when the global "Save all" button flushes
// (see resolvePendingImages.ts). This means an abandoned edit never leaves an orphaned file
// in uploads/, unlike the previous eager-upload behavior.
export function ImageUploadField({
  value,
  onChange,
  label,
}: {
  value: string | PendingImage
  onChange: (next: string | PendingImage) => void
  label?: string
}) {
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const previewUrl = typeof value === 'string' ? value : value.previewUrl

  // Revokes the blob URL for a PendingImage exactly when it stops being the active
  // value (replaced by another image, or the field unmounts) — not on every render.
  useEffect(() => {
    const activeBlobUrl = isPendingImage(value) ? value.previewUrl : null
    return () => {
      if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl)
    }
  }, [value])

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setProcessing(true)
    try {
      const blob = await compressImage(file)
      const nextPreviewUrl = URL.createObjectURL(blob)
      console.info(`[admin/ImageUploadField] staged local preview for ${file.name} (${blob.size} bytes)`)
      onChange({ blob, previewUrl: nextPreviewUrl })
    } catch (err) {
      console.error('[admin/ImageUploadField] compress failed', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">нет фото</span>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <Button type="button" variant="outline" size="sm" disabled={processing} onClick={() => inputRef.current?.click()}>
          {processing ? (
            <>
              <Loader2 className="animate-spin" />
              Обработка…
            </>
          ) : previewUrl ? (
            'Заменить'
          ) : (
            'Загрузить'
          )}
        </Button>
      </div>
    </div>
  )
}
