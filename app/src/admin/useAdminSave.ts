import { useState } from 'react'
import { toast } from 'sonner'
import { GithubAuthError, GithubConflictError, saveFile } from '@/admin/github'
import { useAdminAuth } from '@/admin/AdminAuthContext'

const ACTIONS_URL = 'https://github.com/Sunder23/portfolio/actions'

export function useAdminSave<T>(path: string) {
  const { token, logout } = useAdminAuth()
  const [saving, setSaving] = useState(false)

  async function save(content: T, message: string): Promise<boolean> {
    if (!token) {
      console.error(`[admin/useAdminSave] no token available for ${path}`)
      return false
    }

    console.info(`[admin/useAdminSave] save start ${path}`)
    setSaving(true)

    try {
      await saveFile(path, content, message, token)
      console.info(`[admin/useAdminSave] save success ${path}`)
      toast.success('Сохранено. Деплой займёт ~1–2 минуты', {
        action: { label: 'Actions', onClick: () => window.open(ACTIONS_URL, '_blank') },
      })
      return true
    } catch (err) {
      if (err instanceof GithubAuthError) {
        console.error(`[admin/useAdminSave] save failed (401) ${path}`)
        toast.error('Сессия истекла, войдите заново')
        logout()
        return false
      }
      if (err instanceof GithubConflictError) {
        console.error(`[admin/useAdminSave] save failed (409 after retry) ${path}`)
        toast.error('Файл изменён параллельно, обновите страницу')
        return false
      }
      console.error(`[admin/useAdminSave] save failed ${path}`, err)
      toast.error('Не удалось сохранить изменения')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { save, saving }
}
