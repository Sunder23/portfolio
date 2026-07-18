import { Link, useLocation } from 'react-router-dom'
import { SUPPORTED_LOCALES, type Locale } from '@/lib/locale'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'

function buildPathForLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split('/')
  segments[1] = locale
  return segments.join('/')
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const location = useLocation()

  return (
    <div className="flex items-center gap-1">
      {SUPPORTED_LOCALES.map((loc) => (
        <Link
          key={loc}
          to={buildPathForLocale(location.pathname, loc)}
          aria-current={loc === locale ? 'true' : undefined}
          className={cn(
            'rounded-md px-1.5 py-0.5 text-xs font-medium uppercase transition-colors',
            loc === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {loc}
        </Link>
      ))}
    </div>
  )
}
