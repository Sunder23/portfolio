import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { LocalizedField } from '@/admin/LocalizedField'
import { ImageUploadField } from '@/admin/ImageUploadField'
import { GalleryUploadField } from '@/admin/GalleryUploadField'
import { useAdminSave } from '@/admin/useAdminSave'
import { useAdminAuth } from '@/admin/AdminAuthContext'
import { getFile } from '@/admin/github'
import type { Project } from '@/types'

const PROJECTS_PATH = 'app/data/projects.json'

function emptyProject(): Project {
  return {
    id: '',
    title: { uk: '' },
    slug: '',
    shortDescription: { uk: '' },
    description: { uk: '' },
    stack: [],
    role: '',
    year: new Date().getFullYear(),
    url: '',
    cover: '',
    gallery: [],
    featured: false,
    order: 0,
    published: false,
  }
}

export default function ProjectsEditor() {
  const { token } = useAdminAuth()
  const { save, saving } = useAdminSave<Project[]>(PROJECTS_PATH)

  const [projects, setProjects] = useState<Project[] | null>(null)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  useEffect(() => {
    if (!token) return
    console.info(`[admin/ProjectsEditor] loading ${PROJECTS_PATH}`)
    getFile<Project[]>(PROJECTS_PATH, token).then(({ data }) => setProjects(data))
  }, [token])

  if (!projects) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  if (editing) {
    return (
      <ProjectForm
        project={editing}
        saving={saving}
        onCancel={() => setEditing(null)}
        onSave={async (project) => {
          const isNew = !projects.some((p) => p.id === project.id)
          const next = isNew
            ? [...projects, project]
            : projects.map((p) => (p.id === project.id ? project : p))
          const message = `admin: update projects.json (${isNew ? 'add' : 'edit'} "${project.slug}")`
          const ok = await save(next, message)
          if (ok) {
            setProjects(next)
            setEditing(null)
          }
        }}
      />
    )
  }

  const sorted = [...projects].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Проекты</h2>
        <Button onClick={() => setEditing(emptyProject())}>Добавить</Button>
      </div>

      {sorted.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <CardTitle>{project.title.uk || project.slug}</CardTitle>
            <CardAction className="flex gap-2">
              <Badge variant={project.published ? 'default' : 'outline'}>
                {project.published ? 'published' : 'draft'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {project.slug} · order {project.order}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(project)}>
                Редактировать
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(project)}>
                Удалить
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.title.uk}» будет удалён из projects.json. Действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return
                console.info(`[admin/ProjectsEditor] delete requested: ${deleteTarget.slug}`)
                const next = projects.filter((p) => p.id !== deleteTarget.id)
                const ok = await save(next, `admin: update projects.json (delete "${deleteTarget.slug}")`)
                if (ok) {
                  setProjects(next)
                  setDeleteTarget(null)
                }
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProjectForm({
  project,
  saving,
  onSave,
  onCancel,
}: {
  project: Project
  saving: boolean
  onSave: (project: Project) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Project>(project)

  function update<K extends keyof Project>(key: K, value: Project[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{project.id ? 'Редактировать проект' : 'Новый проект'}</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>id</Label>
          <Input value={form.id} onChange={(e) => update('id', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>slug</Label>
          <Input value={form.slug} onChange={(e) => update('slug', e.target.value)} />
        </div>
      </div>

      <LocalizedField label="title" value={form.title} onChange={(v) => update('title', v)} />
      <LocalizedField
        label="shortDescription"
        value={form.shortDescription}
        onChange={(v) => update('shortDescription', v)}
        multiline
      />
      <LocalizedField
        label="description"
        value={form.description}
        onChange={(v) => update('description', v)}
        multiline
        withPreview
      />

      <div className="flex flex-col gap-1.5">
        <Label>stack (через запятую)</Label>
        <Input
          value={form.stack.join(', ')}
          onChange={(e) =>
            update(
              'stack',
              e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>role</Label>
          <Input value={form.role} onChange={(e) => update('role', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>year</Label>
          <Input
            type="number"
            value={form.year}
            onChange={(e) => update('year', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>url</Label>
        <Input value={form.url} onChange={(e) => update('url', e.target.value)} />
      </div>

      <ImageUploadField label="cover" value={form.cover} onChange={(path) => update('cover', path)} />

      <div className="flex flex-col gap-1.5">
        <Label>gallery</Label>
        <GalleryUploadField value={form.gallery} onChange={(paths) => update('gallery', paths)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>order</Label>
          <Input type="number" value={form.order} onChange={(e) => update('order', Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={form.featured} onCheckedChange={(v) => update('featured', v)} />
          <Label>featured</Label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={form.published} onCheckedChange={(v) => update('published', v)} />
        <Label>published</Label>
      </div>

      <div className="flex gap-2">
        <Button disabled={saving} onClick={() => onSave(form)}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
        <Button variant="outline" disabled={saving} onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
