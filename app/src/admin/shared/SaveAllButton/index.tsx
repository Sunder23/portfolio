import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/admin/context/AdminAuthContext'
import { useAdminDraft } from '@/admin/context/AdminDraftContext'
import { GithubAuthError, GithubConflictError } from '@/admin/lib/github'
import { ACTIONS_URL } from '@/admin/hooks/useAdminSave'

// The single save point for the whole admin session (see .ai-factory/RESEARCH.md):
// every editor stages its edits in AdminDraftContext instead of committing immediately,
// and this button flushes every dirty entity, one GitHub write at a time, when clicked.
export function SaveAllButton() {
  const { token, logout } = useAdminAuth()
  const draft = useAdminDraft()
  const [saving, setSaving] = useState(false)

  if (draft.dirtyPaths.length === 0) {
    return null
  }

  async function handleSaveAll() {
    if (!token) return

    const paths = draft.dirtyPaths
    console.info(`[admin/SaveAllButton] batch save start, ${paths.length} dirty entries`)
    setSaving(true)
    let savedCount = 0

    try {
      for (const path of paths) {
        const flush = draft.getFlush(path)
        if (!flush) {
          // Can happen after a page reload restores a draft from localStorage before its
          // owning editor has mounted (registerFlush only runs on mount) — open that section
          // once to re-register the flush, then Save All again.
          console.error(`[admin/SaveAllButton] no flush registered for ${path}, skipping`)
          toast.error(`${path}: откройте этот раздел ещё раз перед сохранением`)
          continue
        }

        try {
          await flush(draft.getEntry(path), token)
          draft.clearEntry(path)
          savedCount += 1
          console.info(`[admin/SaveAllButton] saved ${path}`)
        } catch (err) {
          if (err instanceof GithubAuthError) {
            console.error(`[admin/SaveAllButton] failed ${path} (401)`)
            toast.error('Сессия истекла, войдите заново')
            logout()
            return
          }
          if (err instanceof GithubConflictError) {
            console.error(`[admin/SaveAllButton] failed ${path} (409 after retry)`)
            toast.error(`${path}: файл изменён параллельно, обновите страницу`)
            continue
          }
          console.error(`[admin/SaveAllButton] failed ${path}`, err)
          toast.error(`${path}: не удалось сохранить`)
        }
      }
    } finally {
      setSaving(false)
      console.info(`[admin/SaveAllButton] batch save complete: ${savedCount}/${paths.length} saved`)
    }

    if (savedCount > 0) {
      toast.success(`Сохранено (${savedCount}). Деплой займёт ~1–2 минуты`, {
        action: { label: 'Actions', onClick: () => window.open(ACTIONS_URL, '_blank') },
      })
      // [FIX] Committing to GitHub doesn't mean the SPA's own state is fresh — editors keep
      // whatever they had in memory/AdminDraftContext before the save. Reload shortly after
      // (not waiting for the ~1-2min GitHub Pages deploy, which this page never tracks) so
      // every open editor re-fetches from GitHub instead of showing stale local data.
      console.info('[admin/SaveAllButton] reloading admin after successful save')
      window.setTimeout(() => window.location.reload(), 1200)
    }
  }

  return (
    <Button
      className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-1.5 shadow-lg"
      disabled={saving}
      onClick={handleSaveAll}
    >
      <Save className="size-4 shrink-0" aria-hidden />
      {saving ? 'Сохранение…' : `Сохранить всё (${draft.dirtyPaths.length})`}
    </Button>
  )
}
