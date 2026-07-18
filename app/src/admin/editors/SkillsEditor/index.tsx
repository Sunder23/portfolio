import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminSave } from '@/admin/useAdminSave'
import { useEditorData } from '@/admin/useEditorData'
import type { SkillCategory } from '@/types'

const SKILLS_PATH = 'app/data/skills.json'

export default function SkillsEditor() {
  const { save, saving } = useAdminSave<SkillCategory[]>(SKILLS_PATH)
  const [categories, setCategories] = useEditorData<SkillCategory[]>(SKILLS_PATH)

  if (!categories) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function updateCategory(index: number, patch: Partial<SkillCategory>) {
    if (!categories) return
    setCategories(categories.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function updateItem(categoryIndex: number, itemIndex: number, value: string) {
    const cat = categories![categoryIndex]
    updateCategory(categoryIndex, { items: cat.items.map((v, i) => (i === itemIndex ? value : v)) })
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    const cat = categories![categoryIndex]
    updateCategory(categoryIndex, { items: cat.items.filter((_, i) => i !== itemIndex) })
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Скиллы</h2>

      {categories.map((cat, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5">
              <Label>category</Label>
              <Input value={cat.category} onChange={(e) => updateCategory(index, { category: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>items</Label>
              {cat.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex gap-2">
                  <Input value={item} onChange={(e) => updateItem(index, itemIndex, e.target.value)} />
                  <Button variant="outline" size="sm" onClick={() => removeItem(index, itemIndex)}>
                    Убрать
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateCategory(index, { items: [...cat.items, ''] })}
              >
                Добавить элемент
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategories(categories.filter((_, i) => i !== index))}
            >
              Убрать категорию
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={() => setCategories([...categories, { category: '', items: [] }])}
      >
        Добавить категорию
      </Button>

      <Button
        disabled={saving}
        onClick={async () => {
          await save(categories, 'admin: update skills.json')
        }}
      >
        {saving ? 'Сохранение…' : 'Сохранить'}
      </Button>
    </div>
  )
}
