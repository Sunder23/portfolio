import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LocalizedField } from '@/admin/components/LocalizedField'
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import { GalleryUploadField } from './GalleryUploadField'
import { TaxonomyCheckboxes } from './TaxonomyCheckboxes'
import { useAdminAuth } from '@/admin/context/AdminAuthContext'
import { useAdminDraft } from '@/admin/context/AdminDraftContext'
import { useAdminLocale, useAdminLocalized } from '@/admin/context/AdminLocaleContext'
import { useEditorData } from '@/admin/hooks/useEditorData'
import { commitFiles, createFile, createImageBlob, getFile, listDir, saveFile } from '@/admin/lib/github'
import { resolvePendingImages, type PendingImage } from '@/admin/lib/resolvePendingImages'
import { makeUniqueSlug, slugify } from '@/lib/slug'
import { PROJECTS_DIR, TAXONOMIES_PATH, buildProjectCommitPlan, emptyProject } from '@/admin/editors/projectsData'
import { SUPPORTED_LOCALES } from '@/lib/locale'
import type { Project, Taxonomies } from '@/types'

const YEAR_MIN = 2015
const YEAR_MAX = 2030
const YEAR_ITEMS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => String(YEAR_MAX - i)).map((year) => ({
  label: year,
  value: year,
}))

const NEW_PROJECT_KEY = `${PROJECTS_DIR}/__new__`

// The staged form shape: identical to Project, except cover/gallery can hold a locally
// compressed-but-not-yet-uploaded image (see resolvePendingImages.ts) while editing.
type ProjectDraft = Omit<Project, 'cover' | 'gallery'> & { cover: string | PendingImage; gallery: (string | PendingImage)[] }

// `sha` is the on-disk sha of the loaded file (null for a not-yet-created project) — needed by
// the rename branch below, kept alongside the form instead of separate component state so it
// survives exactly as long as the staged draft itself does.
type ProjectDraftEntry = { form: ProjectDraft; slug: string; sha: string | null }

export function ProjectForm() {
  const { slug: slugParam } = useParams<{ slug: string }>()
  const isNew = !slugParam
  const { token } = useAdminAuth()
  const draft = useAdminDraft()
  const { locale, setLocale } = useAdminLocale()
  const [taxonomies] = useEditorData<Taxonomies>(TAXONOMIES_PATH)

  // Existing projects keep the same draft key for their whole lifetime (the GitHub path they
  // were loaded from); a new project gets one synthetic key for the session — only one
  // "new project" draft can be in flight at a time, which is fine for a single-user admin.
  const draftKey = isNew ? NEW_PROJECT_KEY : `${PROJECTS_DIR}/${slugParam}.json`

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [slugLocked, setSlugLocked] = useState(!isNew)

  const current = draft.getEntry<ProjectDraftEntry>(draftKey)
  const form = current?.form ?? emptyProject()
  const slug = current?.slug ?? ''

  const autoSlugSource = useAdminLocalized(form.title)

  useEffect(() => {
    // [FIX] slugify('') falls back to 'untitled' (so a save with no title still gets a usable
    // slug) — but running that through setSlug() here on every mount, before the user typed
    // anything, wrote 'untitled' into the draft immediately and made a freshly opened "Add
    // project" page dirty on its own. The slug *display* already falls back to "untitled" via
    // `{slug || 'untitled'}` below, so there's nothing to auto-fill until there's a real title.
    if (!slugLocked && current && autoSlugSource.trim()) {
      setSlug(slugify(autoSlugSource))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSlugSource, slugLocked])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setNotFound(false)

    listDir(PROJECTS_DIR, token).then(async (files) => {
      const slugs = files.map((file) => file.name.replace(/\.json$/, ''))

      if (isNew) {
        draft.captureBaseline(draftKey, { form: emptyProject(), slug: '', sha: null })
        console.info(`[admin/ProjectForm] draft loaded for ${draftKey}`)
        registerProjectFlush(draftKey, slugs)
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

      const { data, sha } = await getFile<Project>(match.path, token)
      draft.captureBaseline(draftKey, { form: data, slug: data.slug, sha })
      console.info(`[admin/ProjectForm] draft loaded for ${draftKey}`)
      registerProjectFlush(draftKey, slugs)
      setLoading(false)
    })

    function registerProjectFlush(key: string, slugs: string[]) {
      draft.registerFlush(key, async (entryData, saveToken) => {
        const entry = entryData as ProjectDraftEntry
        const ownSlug = key === NEW_PROJECT_KEY ? undefined : key.split('/').pop()?.replace(/\.json$/, '')
        const otherSlugs = slugs.filter((s) => s !== ownSlug)
        const finalSlug = makeUniqueSlug(entry.slug || 'untitled', otherSlugs)
        const newPath = `${PROJECTS_DIR}/${finalSlug}.json`

        try {
          // [FIX] Staged cover/gallery images used to be uploaded as their own commit each
          // (via uploadPendingImage) before the project JSON was saved — one project save with
          // 2 new images produced 3 separate commits/deploys. createImageBlob only creates the
          // Git blob (no commit); buildProjectCommitPlan decides whether it can bundle into the
          // same commit as the JSON (via commitFiles) or fall back to the simpler
          // saveFile/createFile when there are no staged images at all.
          const { value: resolvedForm, imageEntries } = await resolvePendingImages(entry.form, (blob) =>
            createImageBlob(blob, saveToken),
          )
          // resolvePendingImages replaces every PendingImage with its uploaded path at runtime,
          // but its generic signature can't narrow cover/gallery back from `string | PendingImage`
          // to plain `string` at the type level — safe to assert here since resolution is complete.
          const nextProject: Project = {
            ...resolvedForm,
            cover: resolvedForm.cover as string,
            gallery: resolvedForm.gallery as string[],
            slug: finalSlug,
          }

          const mode = entry.sha === null ? 'create' : key === newPath ? 'update' : 'rename'
          const message =
            mode === 'create'
              ? `admin: update projects.json (add "${finalSlug}")`
              : mode === 'update'
                ? `admin: update projects.json (edit "${finalSlug}")`
                : `admin: rename project "${ownSlug}" -> "${finalSlug}"`
          console.info(`[admin/ProjectForm] flush start ${key}, mode=${mode}`)

          const plan = buildProjectCommitPlan({
            mode,
            newPath,
            oldPath: mode === 'rename' ? key : null,
            project: nextProject,
            imageEntries,
          })
          switch (plan.kind) {
            case 'createFile':
              await createFile(plan.path, plan.content, message, saveToken)
              break
            case 'saveFile':
              await saveFile(plan.path, plan.content, message, saveToken)
              break
            case 'commitFiles':
              await commitFiles(plan.entries, message, saveToken)
              break
          }
          console.info(`[admin/ProjectForm] flush success ${key}`)
        } catch (err) {
          console.error(`[admin/ProjectForm] flush failed ${key}`, err)
          throw err
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isNew, slugParam, draftKey])

  const roleItems = useMemo(() => (taxonomies?.role ?? []).map((role) => ({ label: role, value: role })), [taxonomies])

  if (notFound) {
    return <Navigate to="/admin/projects" replace />
  }

  if (loading || !taxonomies || !current) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  function update<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    if (!current) return
    draft.setEntry(draftKey, { ...current, form: { ...current.form, [key]: value } })
  }

  function setSlug(next: string) {
    if (!current) return
    draft.setEntry(draftKey, { ...current, slug: next })
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
            <GalleryUploadField value={form.gallery} onChange={(next) => update('gallery', next)} />
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
                <Button variant="outline" className="w-full" nativeButton={false} render={<Link to="/admin/projects" />}>
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
              <ImageUploadField value={form.cover} onChange={(next) => update('cover', next)} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
