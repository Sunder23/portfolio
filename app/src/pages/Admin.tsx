import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AdminAuthProvider } from '@/admin/AdminAuthContext'
import { AdminLocaleProvider } from '@/admin/AdminLocaleContext'
import AdminLayout from '@/admin/AdminLayout'
import { editorRegistry } from '@/admin/registry'
import { ProjectForm, ProjectsList } from '@/admin/editors/ProjectsEditor'
import TaxonomyEditor from '@/admin/editors/TaxonomyEditor'
import type { Taxonomies } from '@/types'

const TAXONOMY_KEYS: (keyof Taxonomies)[] = ['stack', 'category', 'role']

function TaxonomyRouter() {
  const { key } = useParams<{ key: string }>()

  if (!key || !TAXONOMY_KEYS.includes(key as keyof Taxonomies)) {
    console.info('[admin/router] unknown taxonomy key', key, '-> redirecting to stack')
    return <Navigate to="/admin/taxonomies/stack" replace />
  }

  return <TaxonomyEditor />
}

export default function Admin() {
  return (
    <AdminAuthProvider>
      <AdminLocaleProvider>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/new" element={<ProjectForm />} />
            <Route path="projects/:slug" element={<ProjectForm />} />
            {editorRegistry.map((entry) => (
              <Route key={entry.id} path={entry.id} element={<entry.Editor />} />
            ))}
            <Route path="taxonomies/:key" element={<TaxonomyRouter />} />
            <Route path="*" element={<Navigate to="projects" replace />} />
          </Route>
        </Routes>
      </AdminLocaleProvider>
    </AdminAuthProvider>
  )
}
