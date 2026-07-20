import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import type { Profile } from '@/types'

export function CtaSection({ profile }: { profile: Profile }) {
  const { t } = useTranslation()

  return (
    <div className="pixel-notch flex flex-col items-start gap-3 border border-accent/50 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p aria-hidden className="font-heading text-xs uppercase tracking-wide text-accent">
          $ {t('home.ctaTitle')}
        </p>
        <p className="font-heading text-xl">{t('home.ctaHeading')}</p>
        <p className="max-w-md text-sm text-muted-foreground">{t('home.ctaText')}</p>
      </div>
      <a href={`mailto:${profile.email}`} className={buttonVariants({ variant: 'default' })}>
        {t('home.contactMe')}
      </a>
    </div>
  )
}
