import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { LocalizedField } from '@/admin/components/LocalizedField'
import { useEditorData } from '@/admin/hooks/useEditorData'
import type { Experience } from '@/types'

const EXPERIENCE_PATH = 'app/data/experience.json'

const EMPTY_EXPERIENCE: Experience = {
  position: { uk: '' },
  company: '',
  industry: { uk: '' },
  period: { uk: '' },
  summary: { uk: '' },
  responsibilities: { uk: '' },
  achievements: { uk: '' },
  stack: [],
}

export default function ExperienceEditor() {
  const [entries, setEntries] = useEditorData<Experience[]>(EXPERIENCE_PATH)

  if (!entries) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function updateEntry(index: number, patch: Partial<Experience>) {
    if (!entries) return
    setEntries(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  function updateStackItem(entryIndex: number, itemIndex: number, value: string) {
    const entry = entries![entryIndex]
    updateEntry(entryIndex, { stack: entry.stack.map((v, i) => (i === itemIndex ? value : v)) })
  }

  function removeStackItem(entryIndex: number, itemIndex: number) {
    const entry = entries![entryIndex]
    updateEntry(entryIndex, { stack: entry.stack.filter((_, i) => i !== itemIndex) })
  }

  return (
    <div className="flex flex-col gap-3">
      <Heading level={2} className="text-lg font-medium">Опыт работы</Heading>

      {entries.map((entry, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>company</Label>
              <Input value={entry.company} onChange={(e) => updateEntry(index, { company: e.target.value })} />
            </div>

            <LocalizedField label="position" value={entry.position} onChange={(v) => updateEntry(index, { position: v })} />
            <LocalizedField label="industry" value={entry.industry} onChange={(v) => updateEntry(index, { industry: v })} />
            <LocalizedField label="period" value={entry.period} onChange={(v) => updateEntry(index, { period: v })} />
            <LocalizedField label="summary" value={entry.summary} onChange={(v) => updateEntry(index, { summary: v })} richText />
            <LocalizedField
              label="responsibilities"
              value={entry.responsibilities}
              onChange={(v) => updateEntry(index, { responsibilities: v })}
              richText
            />
            <LocalizedField
              label="achievements"
              value={entry.achievements}
              onChange={(v) => updateEntry(index, { achievements: v })}
              richText
            />

            <div className="flex flex-col gap-1.5">
              <Label>stack</Label>
              {entry.stack.map((item, itemIndex) => (
                <div key={itemIndex} className="flex gap-2">
                  <Input value={item} onChange={(e) => updateStackItem(index, itemIndex, e.target.value)} />
                  <Button variant="outline" size="sm" onClick={() => removeStackItem(index, itemIndex)}>
                    Убрать
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateEntry(index, { stack: [...entry.stack, ''] })}>
                Добавить элемент
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEntries(entries.filter((_, i) => i !== index))}
            >
              Убрать опыт
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={() => setEntries([...entries, { ...EMPTY_EXPERIENCE }])}>
        Добавить опыт
      </Button>
    </div>
  )
}
