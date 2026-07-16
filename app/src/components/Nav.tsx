import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/hooks/useLocale'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { cn } from '@/lib/utils'

export function Nav() {
  const { t } = useTranslation()
  const locale = useLocale()

  const links = [
    { to: `/${locale}`, label: t('nav.home'), end: true },
    { to: `/${locale}/projects`, label: t('nav.projects'), end: false },
    { to: `/${locale}/about`, label: t('nav.about'), end: false },
  ]

  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <LocaleSwitcher />
      </nav>
    </header>
  )
}
