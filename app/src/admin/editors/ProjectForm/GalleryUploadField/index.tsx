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
  console.debug('[refactor:project-form-children] GalleryUploadField mounted')

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
            <Button variant="outline" size="sm" onClick={() => removeItem(index)}>
              Убрать
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-fit" onClick={() => onChange([...value, ''])}>
        Добавить в галерею
      </Button>
    </div>
  )
}
