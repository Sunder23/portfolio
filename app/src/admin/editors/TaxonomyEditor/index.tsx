import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
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
import { useAdminAuth } from '@/admin/context/AdminAuthContext'
import { useEditorData } from '@/admin/hooks/useEditorData'
import { getFile, listDir } from '@/admin/lib/github'
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
  // [FIX] Term add/rename/delete used to commit immediately via useAdminSave, bypassing the
  // shared draft store entirely — so the floating "Save all" button never had anything to
  // show here, and every action pushed a commit + deploy on its own. Now every mutation just
  // calls the normal setter from useEditorData, which stages the change like every other
  // editor — useEditorData already auto-registers a generic flush for this path, so no
  // per-editor save logic is needed here anymore.
  const [taxonomies, setTaxonomies] = useEditorData<Taxonomies>(TAXONOMIES_PATH)

  const [newTerm, setNewTerm] = useState('')
  const [renaming, setRenaming] = useState<{ index: number; value: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ term: string; usageCount: number } | null>(null)

  if (!taxonomies) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  const terms = taxonomies[taxonomyKey]

  function persist(next: string[]) {
    console.info(`[FIX][admin/TaxonomyEditor] staged ${taxonomyKey} change (${next.length} terms) — not pushed until Save all`)
    // TS can't statically prove every field of Taxonomies is still present after spreading
    // with a union-typed computed key ([taxonomyKey] is 'stack' | 'category' | 'role') —
    // every field really is present here, all three are homogeneous string[] properties.
    const updated: Taxonomies = { ...taxonomies, [taxonomyKey]: next } as Taxonomies
    setTaxonomies(updated)
  }

  function handleAdd() {
    const value = newTerm.trim()
    if (!value || terms.includes(value)) return
    persist([...terms, value])
    setNewTerm('')
  }

  function handleRenameConfirm() {
    if (!renaming) return
    const value = renaming.value.trim()
    const oldValue = terms[renaming.index]
    if (!value || value === oldValue) {
      console.info('[admin/TaxonomyEditor] rename skipped: value unchanged')
      setRenaming(null)
      return
    }
    const next = terms.map((t, i) => (i === renaming.index ? value : t))
    persist(next)
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

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const next = terms.filter((t) => t !== deleteTarget.term)
    persist(next)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <Heading level={2} className="text-lg font-medium">{TAXONOMY_LABELS[taxonomyKey]}</Heading>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full lg:w-72 lg:shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Добавить термин</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Input
                placeholder="Новый термин"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button onClick={handleAdd} className="inline-flex items-center gap-1.5">
                <Plus className="size-3.5 shrink-0" aria-hidden />
                Добавить
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                      <Button
                        size="sm"
                        disabled={!renaming.value.trim() || renaming.value.trim() === terms[renaming.index]}
                        onClick={handleRenameConfirm}
                      >
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
                      <Button
                        variant="destructive"
                        size="sm"
                        className="inline-flex items-center gap-1.5"
                        onClick={() => handleDeleteRequest(term)}
                      >
                        <Trash2 className="size-3.5 shrink-0" aria-hidden />
                        Удалить
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
