import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CommandLabel } from '@/components/CommandLabel'
import type { Locale } from '@/lib/locale'
import { resolveLocalized } from '@/types'
import type { Experience } from '@/types'

export function ExperienceSection({ experience, locale }: { experience: Experience[]; locale: Locale }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <CommandLabel label={t('about.experience')}>{t('home.experienceTitle')}</CommandLabel>
        <Link to={`/${locale}/about`} className="text-xs text-muted-foreground hover:text-foreground">
          {t('home.viewFullExperience')} →
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {experience.map((job, index) => (
          <div key={index} className="pixel-notch border border-border p-4">
            <p className="font-heading text-base">
              {resolveLocalized(job.position, locale)} · {job.company}
            </p>
            <p className="text-sm text-muted-foreground">{resolveLocalized(job.period, locale)}</p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {resolveLocalized(job.summary, locale)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
