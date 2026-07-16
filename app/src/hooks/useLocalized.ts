import { useLocale } from '@/hooks/useLocale'
import type { Localized } from '@/types'

export function useLocalized<T>(field: Localized<T>): T {
  const locale = useLocale()
  return field[locale] ?? field.uk
}
