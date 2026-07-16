import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminSave } from '@/admin/useAdminSave'
import { useAdminAuth } from '@/admin/AdminAuthContext'
import { getFile } from '@/admin/github'
import type { SkillCategory } from '@/types'

const SKILLS_PATH = 'app/data/skills.json'

export default function SkillsEditor() {
  const { token } = useAdminAuth()
  const { save, saving } = useAdminSave<SkillCategory[]>(SKILLS_PATH)

  const [categories, setCategories] = useState<SkillCategory[] | null>(null)

  useEffect(() => {
    if (!token) return
    console.info(`[admin/SkillsEditor] loading ${SKILLS_PATH}`)
    getFile<SkillCategory[]>(SKILLS_PATH, token).then(({ data }) => setCategories(data))
  }, [token])

  if (!categories) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function updateCategory(index: number, patch: Partial<SkillCategory>) {
    if (!categories) return
    setCategories(categories.map((c, i) => (i === index ? { ...c, ...patch } : c)))
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
              <Label>items (через запятую)</Label>
              <Input
                value={cat.items.join(', ')}
                onChange={(e) =>
                  updateCategory(index, {
                    items: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
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
