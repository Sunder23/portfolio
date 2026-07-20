import { createContext, useContext, useState, type ReactNode } from 'react'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/locale'
import { resolveLocalized, type Localized } from '@/types'

const ADMIN_LOCALE_STORAGE_KEY = 'portfolio-admin-locale'

interface AdminLocaleValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

function getStoredAdminLocale(): Locale {
  const stored = window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY)
  return isLocale(stored ?? undefined) ? (stored as Locale) : DEFAULT_LOCALE
}

const AdminLocaleContext = createContext<AdminLocaleValue | null>(null)

export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredAdminLocale())

  function setLocale(next: Locale) {
    window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, next)
    console.info(`[admin/locale] switched to ${next}`)
    setLocaleState(next)
  }

  return <AdminLocaleContext.Provider value={{ locale, setLocale }}>{children}</AdminLocaleContext.Provider>
}

export function useAdminLocale(): AdminLocaleValue {
  const ctx = useContext(AdminLocaleContext)
  if (!ctx) {
    throw new Error('useAdminLocale must be used within AdminLocaleProvider')
  }
  return ctx
}

export function useAdminLocalized<T>(field: Localized<T>): T {
  const { locale } = useAdminLocale()
  return resolveLocalized(field, locale)
}
