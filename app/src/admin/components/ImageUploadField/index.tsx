import { useRef, type ChangeEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useImageUpload } from '@/admin/hooks/useImageUpload'

export function ImageUploadField({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (path: string) => void
  label?: string
}) {
  const { uploadImage, uploading } = useImageUpload()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const path = await uploadImage(file)
    if (path) onChange(path)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">нет фото</span>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? (
            <>
              <Loader2 className="animate-spin" />
              Загрузка…
            </>
          ) : value ? (
            'Заменить'
          ) : (
            'Загрузить'
          )}
        </Button>
      </div>
    </div>
  )
}
