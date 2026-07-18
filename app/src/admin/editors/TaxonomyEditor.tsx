import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAdminSave } from '@/admin/useAdminSave'
import { useAdminAuth } from '@/admin/AdminAuthContext'
import { getFile, listDir } from '@/admin/github'
import type { Project, Taxonomies } from '@/types'

const TAXONOMIES_PATH = 'app/data/taxonomies.json'
const PROJECTS_DIR = 'app/data/projects'

const TAXONOMY_LABELS: Record<keyof Taxonomies, string> = {
  stack: 'Tech Stack',
  category: 'Categories',
  role: 'Roles',
}

export default function TaxonomyEditor() {
  const { key } = useParams<{ key: string }>()
  const taxonomyKey = (key && key in TAXONOMY_LABELS ? key : 'stack') as keyof Taxonomies
  const { token } = useAdminAuth()
  const { save, saving } = useAdminSave<Taxonomies>(TAXONOMIES_PATH)

  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null)
  const [newTerm, setNewTerm] = useState('')
  const [renaming, setRenaming] = useState<{ index: number; value: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ term: string; usageCount: number } | null>(null)

  useEffect(() => {
    if (!token) return
    console.info(`[admin/TaxonomyEditor] loading ${TAXONOMIES_PATH}`)
    getFile<Taxonomies>(TAXONOMIES_PATH, token).then(({ data }) => setTaxonomies(data))
  }, [token])

  if (!taxonomies) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  const terms = taxonomies[taxonomyKey]

  async function persist(next: string[], message: string) {
    if (!taxonomies) return
    const updated = { ...taxonomies, [taxonomyKey]: next }
    const ok = await save(updated, message)
    if (ok) setTaxonomies(updated)
  }

  async function handleAdd() {
    const value = newTerm.trim()
    if (!value || terms.includes(value)) return
    await persist([...terms, value], `admin: update taxonomies.json (add "${value}" to ${taxonomyKey})`)
    setNewTerm('')
  }

  async function handleRenameConfirm() {
    if (!renaming) return
    const value = renaming.value.trim()
    if (!value) return
    const oldValue = terms[renaming.index]
    const next = terms.map((t, i) => (i === renaming.index ? value : t))
    await persist(next, `admin: update taxonomies.json (rename "${oldValue}" -> "${value}" in ${taxonomyKey})`)
    setRenaming(null)
  }

  async function countUsage(term: string): Promise<number> {
    if (!token) return 0
    console.info(`[admin/TaxonomyEditor] scanning projects for usage of "${term}"`)
    const entries = await listDir(PROJECTS_DIR, token)
    const projects = await Promise.all(entries.map((entry) => getFile<Project>(entry.path, token)))
    return projects.filter(({ data }) => {
      if (taxonomyKey === 'role') return data.role === term
      return data[taxonomyKey].includes(term)
    }).length
  }

  async function handleDeleteRequest(term: string) {
    const usageCount = await countUsage(term)
    setDeleteTarget({ term, usageCount })
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    const next = terms.filter((t) => t !== deleteTarget.term)
    await persist(next, `admin: update taxonomies.json (remove "${deleteTarget.term}" from ${taxonomyKey})`)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{TAXONOMY_LABELS[taxonomyKey]}</h2>

      <div className="flex flex-col gap-2">
        {terms.map((term, index) => (
          <Card key={term}>
            <CardContent className="flex items-center justify-between gap-2">
              {renaming?.index === index ? (
                <Input
                  autoFocus
                  value={renaming.value}
                  onChange={(e) => setRenaming({ index, value: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
                />
              ) : (
                <span className="text-sm">{term}</span>
              )}
              <div className="flex gap-2">
                {renaming?.index === index ? (
                  <>
                    <Button size="sm" disabled={saving} onClick={handleRenameConfirm}>
                      Сохранить
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRenaming(null)}>
                      Отмена
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setRenaming({ index, value: term })}>
                      Переименовать
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest(term)}>
                      Удалить
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Новый термин"
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button disabled={saving} onClick={handleAdd}>
          Добавить
        </Button>
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить термин?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.usageCount > 0
                ? `«${deleteTarget.term}» используется в ${deleteTarget.usageCount} проект(ах). Удаление из списка не изменит уже сохранённые проекты.`
                : `«${deleteTarget?.term}» будет удалён из списка.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
