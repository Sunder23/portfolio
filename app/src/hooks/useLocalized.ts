import { useLocale } from '@/hooks/useLocale'
import { resolveLocalized, type Localized } from '@/types'

export function useLocalized<T>(field: Localized<T>): T {
  const locale = useLocale()
  return resolveLocalized(field, locale)
}
