import { useState } from 'react'
import { toast } from 'sonner'
import { compressImage } from '@/admin/lib/imageCompress'
import { GithubAuthError, GithubConflictError, uploadImage as uploadImageToGithub } from '@/admin/lib/github'
import { useAdminAuth } from '@/admin/components/AdminAuthContext'

export function useImageUpload() {
  const { token, logout } = useAdminAuth()
  const [uploading, setUploading] = useState(false)

  async function uploadImage(file: File): Promise<string | null> {
    if (!token) {
      console.error('[admin/useImageUpload] no token available')
      return null
    }

    setUploading(true)
    try {
      const blob = await compressImage(file)
      const filename = `${crypto.randomUUID()}.webp`
      const path = `app/public/uploads/${filename}`

      await uploadImageToGithub(path, blob, `chore(uploads): add ${filename}`, token)

      // BASE_URL differs between dev ('/') and the built site ('/portfolio/') — see vite.config.ts.
      // Storing the prefixed path here means ProjectCard/ProjectDetail/ProfileEditor can keep
      // rendering `<img src={value}>` unchanged in both environments.
      const publicPath = `${import.meta.env.BASE_URL}uploads/${filename}`
      console.info(`[admin/useImageUpload] uploaded ${filename} -> ${publicPath}`)
      return publicPath
    } catch (err) {
      if (err instanceof GithubAuthError) {
        console.error('[admin/useImageUpload] upload failed (401)')
        toast.error('Сессия истекла, войдите заново')
        logout()
        return null
      }
      if (err instanceof GithubConflictError) {
        console.error('[admin/useImageUpload] upload failed (409 after retry)')
        toast.error('Не удалось загрузить файл, конфликт имён — попробуйте ещё раз')
        return null
      }
      console.error('[admin/useImageUpload] upload failed', err)
      toast.error(err instanceof Error ? err.message : 'Не удалось загрузить изображение')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploadImage, uploading }
}
