import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LocalizedField } from '@/admin/components/LocalizedField'
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import { GalleryUploadField } from '@/admin/components/GalleryUploadField'
import { TaxonomyCheckboxes } from '@/admin/components/TaxonomyCheckboxes'
import { useAdminOperation } from '@/admin/hooks/useAdminSave'
import { useAdminAuth } from '@/admin/components/AdminAuthContext'
import { useAdminLocale, useAdminLocalized } from '@/admin/components/AdminLocaleContext'
import { useEditorData } from '@/admin/hooks/useEditorData'
import { createFile, deleteFile, getFile, listDir, saveFile } from '@/admin/lib/github'
import { makeUniqueSlug, slugify } from '@/lib/slug'
import { PROJECTS_DIR, TAXONOMIES_PATH, emptyProject } from '@/admin/editors/projectsData'
import { SUPPORTED_LOCALES } from '@/lib/locale'
import type { Project, Taxonomies } from '@/types'

const YEAR_MIN = 2015
const YEAR_MAX = 2030
const YEAR_ITEMS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => String(YEAR_MAX - i)).map((year) => ({
  label: year,
  value: year,
}))

export function ProjectForm() {
  const { slug: slugParam } = useParams<{ slug: string }>()
  const isNew = !slugParam
  const navigate = useNavigate()
  const { token } = useAdminAuth()
  const { run, saving } = useAdminOperation()
  const { locale, setLocale } = useAdminLocale()
  const [taxonomies] = useEditorData<Taxonomies>(TAXONOMIES_PATH)

  const [loading, setLoading] = useState(!isNew)
  const [notFound, setNotFound] = useState(false)
  const [original, setOriginal] = useState<{ path: string; sha: string } | null>(null)
  const [existingSlugs, setExistingSlugs] = useState<string[]>([])
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

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
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
            label="description"
            value={form.description}
            onChange={(v) => update('description', v)}
            richText
          />
          <LocalizedField
            label="shortDescription"
            value={form.shortDescription}
            onChange={(v) => update('shortDescription', v)}
            multiline
          />

          <div className="flex flex-col gap-1.5">
            <Label>url</Label>
            <Input value={form.url} onChange={(e) => update('url', e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>gallery</Label>
            <GalleryUploadField value={form.gallery} onChange={(paths) => update('gallery', paths)} />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Публикация</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.published} onCheckedChange={(v) => update('published', v)} />
                <Label>published</Label>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>order</Label>
                <Input type="number" value={form.order} onChange={(e) => update('order', Number(e.target.value))} />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={form.featured} onCheckedChange={(v) => update('featured', v)} />
                <Label>featured</Label>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full" disabled={saving} onClick={handleSave}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={saving}
                  nativeButton={false}
                  render={<Link to="/admin/projects" />}
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Языки</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              {SUPPORTED_LOCALES.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={locale === item ? 'secondary' : 'ghost'}
                  onClick={() => setLocale(item)}
                >
                  {item.toUpperCase()}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Классификация</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <TaxonomyCheckboxes label="stack" terms={taxonomies.stack} selected={form.stack} onChange={(v) => update('stack', v)} />
              <TaxonomyCheckboxes
                label="category"
                terms={taxonomies.category}
                selected={form.category}
                onChange={(v) => update('category', v)}
              />

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
                <Select items={YEAR_ITEMS} value={String(form.year)} onValueChange={(v) => update('year', Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {YEAR_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Обложка</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadField value={form.cover} onChange={(path) => update('cover', path)} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
