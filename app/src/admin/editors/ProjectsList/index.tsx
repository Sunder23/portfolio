import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
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
import { useAdminAuth } from '@/admin/components/AdminAuthContext'
import { useAdminDraft } from '@/admin/components/AdminDraftContext'
import { useAdminLocalized } from '@/admin/components/AdminLocaleContext'
import { deleteFile } from '@/admin/lib/github'
import { loadProjectEntries, type ProjectEntry } from '@/admin/editors/projectsData'

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
  const draft = useAdminDraft()

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
              onClick={() => {
                if (!deleteTarget) return
                const { path, sha, project } = deleteTarget
                // [FIX] Used to call deleteFile() straight away via useAdminOperation, bypassing
                // AdminDraftContext entirely — every delete pushed a commit immediately and the
                // floating "Save all" counter never reflected it (and could go stale if the same
                // project had unrelated pending edits). Now it stages like every other editor:
                // marked dirty here, actually deleted from GitHub only when the registered flush
                // runs off the "Save all" click.
                console.info(`[admin/ProjectsList] staged delete: ${project.slug}`)
                draft.captureBaseline(path, { deleted: false })
                draft.setEntry(path, { deleted: true })
                draft.registerFlush(path, async (_data, saveToken) => {
                  await deleteFile(path, sha, `admin: update projects.json (delete "${project.slug}")`, saveToken)
                })
                setEntries((prev) => prev?.filter((e) => e.path !== path) ?? null)
                setDeleteTarget(null)
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
