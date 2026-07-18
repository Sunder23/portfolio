import { useState } from 'react'
import { toast } from 'sonner'
import { GithubAuthError, GithubConflictError, saveFile } from '@/admin/lib/github'
import { useAdminAuth } from '@/admin/components/AdminAuthContext'

const ACTIONS_URL = 'https://github.com/Sunder23/portfolio/actions'
const DEFAULT_SUCCESS_MESSAGE = 'Сохранено. Деплой займёт ~1–2 минуты'

// Shared error/toast handling for any admin write operation (single-file save,
// create, delete, or a multi-call sequence like a slug rename). useAdminSave
// below is the common single-path-overwrite case built on top of this.
export function useAdminOperation() {
  const { logout } = useAdminAuth()
  const [saving, setSaving] = useState(false)

  async function run(operation: () => Promise<void>, successMessage: string = DEFAULT_SUCCESS_MESSAGE): Promise<boolean> {
    setSaving(true)
    try {
      await operation()
      console.info('[admin/useAdminOperation] operation succeeded')
      toast.success(successMessage, {
        action: { label: 'Actions', onClick: () => window.open(ACTIONS_URL, '_blank') },
      })
      return true
    } catch (err) {
      if (err instanceof GithubAuthError) {
        console.error('[admin/useAdminOperation] operation failed (401)')
        toast.error('Сессия истекла, войдите заново')
        logout()
        return false
      }
      if (err instanceof GithubConflictError) {
        console.error('[admin/useAdminOperation] operation failed (409 after retry)')
        toast.error('Файл изменён параллельно, обновите страницу')
        return false
      }
      console.error('[admin/useAdminOperation] operation failed', err)
      toast.error('Не удалось сохранить изменения')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { run, saving }
}

export function useAdminSave<T>(path: string) {
  const { token } = useAdminAuth()
  const { run, saving } = useAdminOperation()

  async function save(content: T, message: string): Promise<boolean> {
    if (!token) {
      console.error(`[admin/useAdminSave] no token available for ${path}`)
      return false
    }

    console.info(`[admin/useAdminSave] save start ${path}`)
    return run(() => saveFile(path, content, message, token))
  }

  return { save, saving }
}
