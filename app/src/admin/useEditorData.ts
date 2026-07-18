import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useAdminAuth } from '@/admin/AdminAuthContext'
import { getFile } from '@/admin/github'

// Shared "load one JSON file once the token is available" pattern used by every
// singleton editor (Profile/Skills/Taxonomies) and by ProjectForm's taxonomies load.
export function useEditorData<T>(path: string): [T | null, Dispatch<SetStateAction<T | null>>] {
  const { token } = useAdminAuth()
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    if (!token) return
    getFile<T>(path, token).then(({ data }) => setData(data))
  }, [token, path])

  return [data, setData]
}
