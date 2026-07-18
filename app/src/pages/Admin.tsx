import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AdminAuthProvider } from '@/admin/AdminAuthContext'
import { AdminLocaleProvider } from '@/admin/AdminLocaleContext'
import AdminLayout from '@/admin/AdminLayout'
import { editorRegistry } from '@/admin/registry'

function EditorRouter() {
  const { entityId } = useParams<{ entityId: string }>()
  const entry = editorRegistry.find((e) => e.id === entityId)

  if (!entry) {
    console.info('[FIX:admin-locale-redirect] unknown entityId', entityId, '-> redirecting to', editorRegistry[0].id)
    return <Navigate to={`/admin/${editorRegistry[0].id}`} replace />
  }

  const Editor = entry.Editor
  return <Editor />
}

export default function Admin() {
  return (
    <AdminAuthProvider>
      <AdminLocaleProvider>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to={editorRegistry[0].id} replace />} />
            <Route path=":entityId" element={<EditorRouter />} />
          </Route>
        </Routes>
      </AdminLocaleProvider>
    </AdminAuthProvider>
  )
}
