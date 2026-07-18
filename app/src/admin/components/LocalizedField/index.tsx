import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/admin/components/RichTextEditor'
import { useAdminLocale } from '@/admin/components/AdminLocaleContext'
import type { Locale } from '@/lib/locale'
import type { Localized } from '@/types'

const TABS: { locale: Locale; title: string; required: boolean }[] = [
  { locale: 'uk', title: 'UK*', required: true },
  { locale: 'ru', title: 'RU', required: false },
  { locale: 'en', title: 'EN', required: false },
]

interface LocalizedFieldProps {
  value: Localized<string>
  onChange: (next: Localized<string>) => void
  label: string
  multiline?: boolean
  richText?: boolean
}

export function LocalizedField({ value, onChange, label, multiline, richText }: LocalizedFieldProps) {
  const { locale: adminLocale } = useAdminLocale()
  const [active, setActive] = useState<Locale>(adminLocale)

  // One-way sync: switching the admin-wide language in the top bar jumps every
  // open LocalizedField to that tab, but clicking a tab locally does not push
  // back into the global admin locale (same behavior as WordPress's admin
  // language switcher).
  useEffect(() => {
    setActive(adminLocale)
  }, [adminLocale])

  function handleFieldChange(locale: Locale, next: string) {
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
      <Tabs value={active} onValueChange={(next) => setActive(next as Locale)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.locale} value={tab.locale}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((tab) => {
          const fieldValue = value[tab.locale] ?? ''
          return (
            <TabsContent key={tab.locale} value={tab.locale}>
              {richText ? (
                <RichTextEditor value={fieldValue} onChange={(next) => handleFieldChange(tab.locale, next)} />
              ) : multiline ? (
                <Textarea rows={6} value={fieldValue} onChange={(e) => handleFieldChange(tab.locale, e.target.value)} />
              ) : (
                <Input value={fieldValue} onChange={(e) => handleFieldChange(tab.locale, e.target.value)} />
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
