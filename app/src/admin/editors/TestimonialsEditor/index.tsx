import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { LocalizedField } from '@/admin/components/LocalizedField'
import { useEditorData } from '@/admin/hooks/useEditorData'
import type { Testimonial } from '@/types'

const TESTIMONIALS_PATH = 'app/data/testimonials.json'

const EMPTY_TESTIMONIAL: Testimonial = {
  name: '',
  role: '',
  quote: { uk: '' },
  avatar: '',
}

export default function TestimonialsEditor() {
  const [entries, setEntries] = useEditorData<Testimonial[]>(TESTIMONIALS_PATH)

  if (!entries) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function updateEntry(index: number, patch: Partial<Testimonial>) {
    if (!entries) return
    setEntries(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  return (
    <div className="flex flex-col gap-3">
      <Heading level={2} className="text-lg font-medium">Отзывы</Heading>

      {entries.map((entry, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>name</Label>
              <Input value={entry.name} onChange={(e) => updateEntry(index, { name: e.target.value })} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>role</Label>
              <Input value={entry.role ?? ''} onChange={(e) => updateEntry(index, { role: e.target.value })} />
            </div>

            <LocalizedField label="quote" value={entry.quote} onChange={(v) => updateEntry(index, { quote: v })} richText />

            <div className="flex flex-col gap-1.5">
              <Label>avatar</Label>
              <Input value={entry.avatar ?? ''} onChange={(e) => updateEntry(index, { avatar: e.target.value })} />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEntries(entries.filter((_, i) => i !== index))}
            >
              Убрать отзыв
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={() => setEntries([...entries, { ...EMPTY_TESTIMONIAL }])}>
        Добавить отзыв
      </Button>
    </div>
  )
}
