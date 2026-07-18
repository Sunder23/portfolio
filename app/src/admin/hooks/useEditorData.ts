import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { useAdminAuth } from '@/admin/components/AdminAuthContext'
import { useAdminDraft } from '@/admin/components/AdminDraftContext'
import { getFile, saveFile, uploadPendingImage } from '@/admin/lib/github'
import { resolvePendingImages } from '@/admin/lib/resolvePendingImages'

// Shared "load one JSON file once the token is available" pattern used by every
// singleton editor (Profile/Skills/Taxonomies) and by ProjectForm's taxonomies load.
// Data lives in the global AdminDraftContext (not local useState) so an in-progress
// edit survives navigating to another admin route before the global "Save all" button
// is clicked. The third tuple element reports whether `data` has diverged from what
// was loaded, so callers can disable a Save-dependent UI when there's nothing to persist.
// The fourth element, `markClean`, lets a caller that performs its own out-of-band save
// (see TaxonomyEditor, which commits immediately on every add/rename/delete instead of
// batching) re-baseline the entry so it doesn't show up as falsely dirty afterwards.
export function useEditorData<T>(
  path: string,
): [T | null, Dispatch<SetStateAction<T | null>>, boolean, (data: T) => void] {
  const { token } = useAdminAuth()
  const draft = useAdminDraft()
  const data = draft.getEntry<T>(path) ?? null

  useEffect(() => {
    if (!token) return
    getFile<T>(path, token).then(({ data }) => {
      draft.captureBaseline(path, data)
      console.info(`[admin/useEditorData] baseline captured for ${path}`)
      draft.registerFlush(path, async (entryData, saveToken) => {
        const resolved = await resolvePendingImages(entryData, (blob) => uploadPendingImage(blob, saveToken))
        await saveFile(path, resolved, `admin: update ${path.split('/').pop()}`, saveToken)
      })
      console.info(`[admin/useEditorData] flush registered for ${path}`)
    })
  }, [token, path, draft.captureBaseline, draft.registerFlush])

  function setData(next: SetStateAction<T | null>) {
    const resolved = typeof next === 'function' ? (next as (prev: T | null) => T | null)(data) : next
    if (resolved === null) return
    draft.setEntry(path, resolved)
  }

  function markClean(next: T) {
    draft.captureBaseline(path, next)
  }

  const isDirty = data !== null && draft.isDirty(path)

  return [data, setData, isDirty, markClean]
}
