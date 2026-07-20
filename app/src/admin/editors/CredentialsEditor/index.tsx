import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocalizedField } from '@/admin/components/LocalizedField'
import { useEditorData } from '@/admin/hooks/useEditorData'
import type { Credential } from '@/types'

const CREDENTIALS_PATH = 'app/data/credentials.json'

const KIND_ITEMS = [
  { label: 'education', value: 'education' },
  { label: 'certificate', value: 'certificate' },
]

const EMPTY_CREDENTIAL: Credential = {
  title: { uk: '' },
  issuer: '',
  period: { uk: '' },
  kind: 'education',
  url: '',
}

export default function CredentialsEditor() {
  const [entries, setEntries] = useEditorData<Credential[]>(CREDENTIALS_PATH)

  if (!entries) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function updateEntry(index: number, patch: Partial<Credential>) {
    if (!entries) return
    setEntries(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  return (
    <div className="flex flex-col gap-3">
      <Heading level={2} className="text-lg font-medium">Образование и сертификаты</Heading>

      {entries.map((entry, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>kind</Label>
              <Select items={KIND_ITEMS} value={entry.kind} onValueChange={(v) => updateEntry(index, { kind: v as Credential['kind'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {KIND_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <LocalizedField label="title" value={entry.title} onChange={(v) => updateEntry(index, { title: v })} />

            <div className="flex flex-col gap-1.5">
              <Label>issuer</Label>
              <Input value={entry.issuer} onChange={(e) => updateEntry(index, { issuer: e.target.value })} />
            </div>

            <LocalizedField label="period" value={entry.period} onChange={(v) => updateEntry(index, { period: v })} />

            <div className="flex flex-col gap-1.5">
              <Label>url</Label>
              <Input value={entry.url ?? ''} onChange={(e) => updateEntry(index, { url: e.target.value })} />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEntries(entries.filter((_, i) => i !== index))}
            >
              Убрать запись
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={() => setEntries([...entries, { ...EMPTY_CREDENTIAL }])}>
        Добавить запись
      </Button>
    </div>
  )
}
