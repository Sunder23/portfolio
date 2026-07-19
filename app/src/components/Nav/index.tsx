import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/hooks/useLocale'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

export function Nav() {
  const { t } = useTranslation()
  const locale = useLocale()

  const links = [
    { to: `/${locale}`, label: t('nav.home'), end: true },
    { to: `/${locale}/projects`, label: t('nav.projects'), end: false },
    { to: `/${locale}/about`, label: t('nav.about'), end: false },
    { to: `/${locale}/contact`, label: t('nav.contact'), end: false },
  ]

  return (
    <header className="sticky top-3 z-40 px-4">
      <nav className="pixel-notch mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 border border-border bg-background/85 px-4 py-3 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'font-heading text-base uppercase tracking-wide transition-colors',
                  isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <span aria-hidden>[ </span>
              {link.label}
              <span aria-hidden> ]</span>
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </nav>
    </header>
  )
}
