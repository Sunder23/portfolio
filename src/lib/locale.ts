export const SUPPORTED_LOCALES = ['uk', 'ru', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'uk'

export const LOCALE_STORAGE_KEY = 'portfolio-locale'

export function isLocale(value: string | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function getStoredLocale(): Locale | null {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return isLocale(stored ?? undefined) ? (stored as Locale) : null
}

export function storeLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

export function getInitialLocale(): Locale {
  const hashLocale = window.location.hash.split('/')[1]
  if (isLocale(hashLocale)) return hashLocale
  return getStoredLocale() ?? DEFAULT_LOCALE
}
