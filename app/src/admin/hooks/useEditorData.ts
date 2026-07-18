import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useAdminAuth } from '@/admin/components/AdminAuthContext'
import { useDirtyState } from '@/admin/hooks/useDirtyState'
import { getFile } from '@/admin/lib/github'

// Shared "load one JSON file once the token is available" pattern used by every
// singleton editor (Profile/Skills/Taxonomies) and by ProjectForm's taxonomies load.
// The third tuple element reports whether `data` has diverged from what was loaded,
// so callers can disable their Save button when there's nothing to persist.
export function useEditorData<T>(path: string): [T | null, Dispatch<SetStateAction<T | null>>, boolean] {
  const { token } = useAdminAuth()
  const [data, setData] = useState<T | null>(null)
  const { capture, isDirty } = useDirtyState<T>()

  useEffect(() => {
    if (!token) return
    getFile<T>(path, token).then(({ data }) => {
      capture(data)
      console.info(`[admin/useEditorData] baseline captured for ${path}`)
      setData(data)
    })
  }, [token, path, capture])

  return [data, setData, data !== null && isDirty(data)]
}
