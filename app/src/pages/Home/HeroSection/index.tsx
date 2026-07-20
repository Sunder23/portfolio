import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import type { Locale } from '@/lib/locale'
import type { Profile } from '@/types'
import { TerminalCursor } from './TerminalCursor'

export function HeroSection({
  profile,
  title,
  bio,
  locale,
}: {
  profile: Profile
  title: string
  bio: string
  locale: Locale
}) {
  const { t } = useTranslation()
  console.debug('[refactor:home-hero]', { mounted: true })

  return (
    <div className="pixel-notch relative border border-border bg-card">
      <span aria-hidden className="absolute top-0 left-0 size-1.5 bg-accent" />
      <span aria-hidden className="absolute top-4 left-2.5 size-1.5 bg-primary" />
      <span aria-hidden className="absolute right-3 bottom-2 size-1.5 bg-accent" />
      <div className="flex items-center gap-1.5 border-b border-border bg-muted px-3 py-2">
        <span aria-hidden className="size-2.5 border border-border bg-destructive" />
        <span aria-hidden className="size-2.5 border border-border bg-accent" />
        <span aria-hidden className="size-2.5 border border-border bg-primary" />
        <p className="font-heading ml-2 text-xs uppercase tracking-wide text-muted-foreground">
          guest@maxkravchuk: ~
        </p>
      </div>
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
        {profile.avatar && (
          <figure className="shrink-0 self-center border border-border sm:self-start">
            <img src={profile.avatar} alt={profile.name} className="size-28 object-cover sm:size-36" />
            <figcaption className="border-t border-border px-2 py-1 text-center font-heading text-[10px] uppercase tracking-wide text-muted-foreground">
              profile.webp
            </figcaption>
          </figure>
        )}
        <div className="flex flex-col items-start gap-4">
          <h1 className="glow-text font-heading text-4xl text-card-foreground">
            {profile.name}
            <TerminalCursor />
          </h1>
          <p className="font-heading text-lg text-accent">{title}</p>
          <p className="max-w-xl text-sm text-muted-foreground">{bio}</p>
          <div className="flex gap-2">
            <Link to={`/${locale}/projects`} className={buttonVariants({ variant: 'default' })}>
              {t('home.viewProjects')}
            </Link>
            <Link to={`/${locale}/about`} className={buttonVariants({ variant: 'outline' })}>
              {t('home.viewAbout')}
            </Link>
            <a href={`mailto:${profile.email}`} className={buttonVariants({ variant: 'ghost' })}>
              {t('home.contactMe')}
            </a>
            {profile.cv && (
              <a href={profile.cv} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'ghost' })}>
                {t('common.downloadCv')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
