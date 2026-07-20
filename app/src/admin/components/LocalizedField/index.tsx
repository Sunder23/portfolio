import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from './RichTextEditor'
import { useAdminLocale } from '@/admin/context/AdminLocaleContext'
import type { Localized } from '@/types'

interface LocalizedFieldProps {
  value: Localized<string>
  onChange: (next: Localized<string>) => void
  label: string
  multiline?: boolean
  richText?: boolean
}

export function LocalizedField({ value, onChange, label, multiline, richText }: LocalizedFieldProps) {
  const { locale } = useAdminLocale()
  const fieldValue = value[locale] ?? ''

  function handleFieldChange(next: string) {
    const updated: Localized<string> = { ...value }
    if (locale === 'uk') {
      updated.uk = next
    } else if (next === '') {
      // Omit empty optional locales entirely so reads fall back to uk.
      delete updated[locale]
    } else {
      updated[locale] = next
    }
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {richText ? (
        <RichTextEditor value={fieldValue} onChange={handleFieldChange} />
      ) : multiline ? (
        <Textarea rows={6} value={fieldValue} onChange={(e) => handleFieldChange(e.target.value)} />
      ) : (
        <Input value={fieldValue} onChange={(e) => handleFieldChange(e.target.value)} />
      )}
    </div>
  )
}
