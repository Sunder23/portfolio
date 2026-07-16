import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HashRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import Home from '@/pages/Home'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'
import About from '@/pages/About'
import { DEFAULT_LOCALE, getStoredLocale, isLocale, storeLocale } from '@/lib/locale'

// Lazy-loaded so the GitHub client, marked, sonner, and every editor never
// ship in the public bundle — only pulled in when /#/admin is visited.
const Admin = lazy(() => import('@/pages/Admin'))

function RootRedirect() {
  return <Navigate to={`/${getStoredLocale() ?? DEFAULT_LOCALE}`} replace />
}

function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>()
  const valid = isLocale(locale)
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!valid) return
    document.documentElement.lang = locale
    i18n.changeLanguage(locale)
    storeLocale(locale)
  }, [locale, valid, i18n])

  if (!valid) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />
  }

  return <Outlet />
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route index element={<RootRedirect />} />
        <Route path=":locale" element={<LocaleLayout />}>
          <Route index element={<Home />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:slug" element={<ProjectDetail />} />
          <Route path="about" element={<About />} />
        </Route>
        <Route
          path="admin/*"
          element={
            <Suspense
              fallback={
                <div className="flex min-h-svh items-center justify-center">
                  <p className="text-sm text-muted-foreground">Загрузка…</p>
                </div>
              }
            >
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </HashRouter>
  )
}

export default App
