import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { TaxonomyCheckboxes } from '@/admin/TaxonomyCheckboxes'
import { useAdminOperation } from '@/admin/useAdminSave'
import { useAdminAuth } from '@/admin/AdminAuthContext'
import { useAdminLocalized } from '@/admin/AdminLocaleContext'
import { createFile, deleteFile, getFile, listDir, saveFile } from '@/admin/github'
import { makeUniqueSlug, slugify } from '@/lib/slug'
import type { Project, Taxonomies } from '@/types'

const PROJECTS_DIR = 'app/data/projects'
const TAXONOMIES_PATH = 'app/data/taxonomies.json'

interface ProjectEntry {
  project: Project
  path: string
  sha: string
}

async function loadProjectEntries(token: string): Promise<ProjectEntry[]> {
  const files = await listDir(PROJECTS_DIR, token)
  return Promise.all(
    files.map(async (file) => {
      const { data, sha } = await getFile<Project>(file.path, token)
      return { project: data, path: file.path, sha }
    }),
  )
}

function emptyProject(): Project {
  return {
    title: { uk: '' },
    slug: '',
    shortDescription: { uk: '' },
    description: { uk: '' },
    stack: [],
    category: [],
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

function ProjectRow({ entry, onDelete }: { entry: ProjectEntry; onDelete: (entry: ProjectEntry) => void }) {
  const title = useAdminLocalized(entry.project.title)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || entry.project.slug}</CardTitle>
        <CardAction className="flex gap-2">
          <Badge variant={entry.project.published ? 'default' : 'outline'}>
            {entry.project.published ? 'published' : 'draft'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {entry.project.slug} · order {entry.project.order}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link to={`/admin/projects/${entry.project.slug}`} />}
          >
            Редактировать
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(entry)}>
            Удалить
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProjectsList() {
  const { token } = useAdminAuth()
  const { run, saving: deleting } = useAdminOperation()

  const [entries, setEntries] = useState<ProjectEntry[] | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectEntry | null>(null)

  useEffect(() => {
    if (!token) return
    console.info('[admin/ProjectsList] loading project list')
    loadProjectEntries(token).then(setEntries)
  }, [token])

  if (!entries) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  const sorted = [...entries].sort((a, b) => a.project.order - b.project.order)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Проекты</h2>
        <Button nativeButton={false} render={<Link to="/admin/projects/new" />}>
          Добавить
        </Button>
      </div>

      {sorted.map((entry) => (
        <ProjectRow key={entry.path} entry={entry} onDelete={setDeleteTarget} />
      ))}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.project.title.uk}» будет удалён из app/data/projects/. Действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                if (!deleteTarget || !token) return
                console.info(`[admin/ProjectsList] delete requested: ${deleteTarget.project.slug}`)
                const ok = await run(
                  () =>
                    deleteFile(
                      deleteTarget.path,
                      deleteTarget.sha,
                      `admin: update projects.json (delete "${deleteTarget.project.slug}")`,
                      token,
                    ),
                  'Проект удалён. Деплой займёт ~1–2 минуты',
                )
                if (ok) {
                  setEntries((prev) => prev?.filter((e) => e.path !== deleteTarget.path) ?? null)
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

export function ProjectForm() {
  const { slug: slugParam } = useParams<{ slug: string }>()
  const isNew = !slugParam
  const navigate = useNavigate()
  const { token } = useAdminAuth()
  const { run, saving } = useAdminOperation()

  const [loading, setLoading] = useState(!isNew)
  const [notFound, setNotFound] = useState(false)
  const [original, setOriginal] = useState<{ path: string; sha: string } | null>(null)
  const [existingSlugs, setExistingSlugs] = useState<string[]>([])
  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null)
  const [form, setForm] = useState<Project>(emptyProject())
  const [slug, setSlug] = useState('')
  const [slugLocked, setSlugLocked] = useState(!isNew)

  const autoSlugSource = useAdminLocalized(form.title)

  useEffect(() => {
    if (!slugLocked) {
      setSlug(slugify(autoSlugSource))
    }
  }, [autoSlugSource, slugLocked])

  useEffect(() => {
    if (!token) return

    getFile<Taxonomies>(TAXONOMIES_PATH, token).then(({ data }) => setTaxonomies(data))

    listDir(PROJECTS_DIR, token).then(async (files) => {
      setExistingSlugs(files.map((file) => file.name.replace(/\.json$/, '')))

      if (isNew) {
        setLoading(false)
        return
      }

      const match = files.find((file) => file.name === `${slugParam}.json`)
      if (!match) {
        console.warn(`[admin/ProjectForm] project not found: ${slugParam}`)
        setNotFound(true)
        setLoading(false)
        return
      }

      console.info(`[admin/ProjectForm] loading ${match.path}`)
      const { data, sha } = await getFile<Project>(match.path, token)
      setForm(data)
      setSlug(data.slug)
      setOriginal({ path: match.path, sha })
      setLoading(false)
    })
  }, [token, isNew, slugParam])

  const roleItems = useMemo(() => (taxonomies?.role ?? []).map((role) => ({ label: role, value: role })), [taxonomies])

  if (notFound) {
    return <Navigate to="/admin/projects" replace />
  }

  if (loading || !taxonomies) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function update<K extends keyof Project>(key: K, value: Project[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!token) return

    const otherSlugs = existingSlugs.filter((s) => s !== original?.path.split('/').pop()?.replace(/\.json$/, ''))
    const finalSlug = makeUniqueSlug(slug || 'untitled', otherSlugs)
    const nextProject: Project = { ...form, slug: finalSlug }
    const newPath = `${PROJECTS_DIR}/${finalSlug}.json`

    const ok = await run(async () => {
      if (!original) {
        console.info(`[admin/ProjectForm] creating ${newPath}`)
        await createFile(newPath, nextProject, `admin: update projects.json (add "${finalSlug}")`, token)
      } else if (original.path === newPath) {
        console.info(`[admin/ProjectForm] updating ${newPath}`)
        await saveFile(newPath, nextProject, `admin: update projects.json (edit "${finalSlug}")`, token)
      } else {
        console.info(`[admin/ProjectForm] renaming ${original.path} -> ${newPath}`)
        const message = `admin: rename project "${original.path.split('/').pop()?.replace(/\.json$/, '')}" -> "${finalSlug}"`
        await createFile(newPath, nextProject, message, token)
        await deleteFile(original.path, original.sha, message, token)
      }
    })

    if (ok) {
      navigate('/admin/projects')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{isNew ? 'Новый проект' : 'Редактировать проект'}</h2>

      <LocalizedField label="title" value={form.title} onChange={(v) => update('title', v)} />

      <div className="flex flex-col gap-1.5">
        <Label>slug</Label>
        {slugLocked ? (
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{slug || 'untitled'}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSlugLocked(true)}>
              <Pencil data-icon="inline-start" />
              Изменить
            </Button>
          </div>
        )}
      </div>

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
        richText
      />

      <TaxonomyCheckboxes label="stack" terms={taxonomies.stack} selected={form.stack} onChange={(v) => update('stack', v)} />
      <TaxonomyCheckboxes
        label="category"
        terms={taxonomies.category}
        selected={form.category}
        onChange={(v) => update('category', v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>role</Label>
          <Select items={roleItems} value={form.role} onValueChange={(v) => update('role', v as string)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {roleItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>year</Label>
          <Input type="number" value={form.year} onChange={(e) => update('year', Number(e.target.value))} />
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
        <Button disabled={saving} onClick={handleSave}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
        <Button variant="outline" disabled={saving} nativeButton={false} render={<Link to="/admin/projects" />}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
