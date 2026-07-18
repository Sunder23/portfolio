import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLocale } from '@/hooks/useLocale'

const OG_LOCALE_MAP: Record<string, string> = {
  uk: 'uk_UA',
  ru: 'ru_RU',
  en: 'en_US',
}

interface DocumentMetaOptions {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    if (attr === 'name' && key === 'description') {
      console.warn('[useDocumentMeta] expected static <meta name="description"> not found in index.html, creating one at runtime')
    }
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useDocumentMeta({ title, description, ogTitle, ogDescription }: DocumentMetaOptions): void {
  const locale = useLocale()
  const location = useLocation()

  useEffect(() => {
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', ogTitle ?? title)
    upsertMeta('property', 'og:description', ogDescription ?? description)
    upsertMeta('property', 'og:locale', OG_LOCALE_MAP[locale] ?? locale)
    upsertMeta('property', 'og:url', window.location.href)
  }, [title, description, ogTitle, ogDescription, locale, location.pathname])
}
