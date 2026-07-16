import { createContext, useContext } from 'react'
import { DEFAULT_LOCALE, type Locale } from '@/lib/locale'

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export const LocaleProvider = LocaleContext.Provider

export function useLocale(): Locale {
  return useContext(LocaleContext)
}
