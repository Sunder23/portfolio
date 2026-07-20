import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, MapPin, Send, Link as LinkIcon } from 'lucide-react'
import { getProfile } from '@/lib/data'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useLocale } from '@/hooks/useLocale'
import { useLocalized } from '@/hooks/useLocalized'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { cn } from '@/lib/utils'

export function Footer() {
  const { t } = useTranslation()
  const locale = useLocale()
  const profile = useAsyncData(getProfile)
  const title = useLocalized(profile?.title ?? { uk: '' })

  useEffect(() => {
    if (profile) {
      console.debug('[Footer] profile loaded', { hasSocials: profile.socials.length > 0 })
    }
  }, [profile])

  if (!profile) {
    return null
  }

  const links = [
    { to: `/${locale}`, label: t('nav.home'), end: true },
    { to: `/${locale}/projects`, label: t('nav.projects'), end: false },
    { to: `/${locale}/about`, label: t('nav.about'), end: false },
    { to: `/${locale}/contact`, label: t('nav.contact'), end: false },
  ]

  return (
    <footer className="mt-auto border-t border-border font-sans">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 text-sm sm:flex-row sm:justify-between">
        <div className="flex max-w-xs flex-col gap-2">
          <p className="font-heading text-lg text-foreground">{profile.name}_</p>
          <p className="text-muted-foreground">{title}</p>
          <p className="text-muted-foreground">
            <span aria-hidden>{'> '}</span>
            {t('footer.status')}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-heading text-xs uppercase tracking-wide text-accent">
            <span aria-hidden>$ </span>
            {t('footer.menuTitle')}
          </p>
          <nav className="flex flex-col gap-1.5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground hover:underline')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-heading text-xs uppercase tracking-wide text-accent">
            <span aria-hidden>$ </span>
            {t('footer.contactTitle')}
          </p>
          <div className="flex flex-col gap-1.5 text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {t('footer.location')}: {profile.location}
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-1.5 hover:text-foreground hover:underline"
            >
              <Mail className="size-3.5 shrink-0" aria-hidden />
              {profile.email}
            </a>
            {profile.socials.map((social) => {
              const isTelegram = social.platform.toLowerCase() === 'telegram'
              const SocialIcon = isTelegram ? Send : LinkIcon
              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground hover:underline"
                >
                  <SocialIcon className="size-3.5 shrink-0" aria-hidden />
                  {social.platform.toLowerCase()}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {profile.name}
          </p>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  )
}
