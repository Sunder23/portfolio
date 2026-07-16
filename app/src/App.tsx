import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'
import About from '@/pages/About'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, getStoredLocale, storeLocale, type Locale } from '@/lib/locale'
import { LocaleProvider } from '@/hooks/useLocale'

// Lazy-loaded so the GitHub client, marked, sonner, and every editor never
// ship in the public bundle — only pulled in when /#/admin is visited.
const Admin = lazy(() => import('@/pages/Admin'))

function RootRedirect() {
  const target = `/${getStoredLocale() ?? DEFAULT_LOCALE}`
  console.info('[FIX:admin-locale-redirect] RootRedirect ->', target, 'from', window.location.hash)
  return <Navigate to={target} replace />
}

// Literal per-locale routes (not a `:locale` param) so "admin" can never be
// mismatched as a locale value by React Router's path ranking.
function LocaleLayout({ locale }: { locale: Locale }) {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = locale
    i18n.changeLanguage(locale)
    storeLocale(locale)
  }, [locale, i18n])

  return (
    <LocaleProvider value={locale}>
      <Outlet />
    </LocaleProvider>
  )
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route index element={<RootRedirect />} />
        {SUPPORTED_LOCALES.map((locale) => (
          <Route key={locale} path={locale} element={<LocaleLayout locale={locale} />}>
            <Route index element={<Home />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
            <Route path="about" element={<About />} />
          </Route>
        ))}
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
