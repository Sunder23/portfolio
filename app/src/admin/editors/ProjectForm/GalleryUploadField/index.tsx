import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import type { PendingImage } from '@/admin/lib/resolvePendingImages'

export function GalleryUploadField({
  value,
  onChange,
}: {
  value: (string | PendingImage)[]
  onChange: (next: (string | PendingImage)[]) => void
}) {
  function updateItem(index: number, item: string | PendingImage) {
    const next = [...value]
    next[index] = item
    onChange(next)
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {value.map((item, index) => (
          <div key={index} className="flex flex-col items-start gap-1.5">
            <ImageUploadField value={item} onChange={(path) => updateItem(index, path)} />
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-1.5"
              onClick={() => removeItem(index)}
            >
              <X className="size-3.5 shrink-0" aria-hidden />
              Убрать
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="inline-flex w-fit items-center gap-1.5"
        onClick={() => onChange([...value, ''])}
      >
        <Plus className="size-3.5 shrink-0" aria-hidden />
        Добавить в галерею
      </Button>
    </div>
  )
}
