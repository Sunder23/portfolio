import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkdownContent } from '@/components/MarkdownContent'
import { CommandLabel } from '@/components/CommandLabel'
import { getCredentials, getExperience, getProfile, getSkills } from '@/lib/data'
import { useLocale } from '@/hooks/useLocale'
import { useLocalized } from '@/hooks/useLocalized'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { resolveLocalized } from '@/types'

export default function About() {
  const { t } = useTranslation()
  const locale = useLocale()
  const profile = useAsyncData(getProfile)
  const skills = useAsyncData(getSkills)
  const experience = useAsyncData(getExperience)
  const credentials = useAsyncData(getCredentials)

  const bio = useLocalized(profile?.bio ?? { uk: '' })

  useDocumentMeta({ title: t('meta.about.title'), description: t('meta.about.description') })

  if (!profile || !skills || !experience || !credentials) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <CommandLabel as="h1" className="text-2xl" label={t('about.title')}>
        {t('about.commandTitle')}
      </CommandLabel>

      <p className="max-w-xl text-sm text-muted-foreground">{bio}</p>

      {profile.cv && (
        <a
          href={profile.cv}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: 'outline', className: 'self-start' })}
        >
          {t('common.downloadCv')}
        </a>
      )}

      <div className="flex flex-col gap-6">
        <CommandLabel label={t('about.experience')}>{t('about.experienceCommand')}</CommandLabel>
        {experience.map((entry, index) => (
          <div key={index} className="pixel-notch flex flex-col gap-3 border border-border p-4">
            <CommandLabel as="h3" className="text-xs" label={`${resolveLocalized(entry.position, locale)} · ${entry.company}`}>
              {`history --job=${index + 1}`}
            </CommandLabel>
            <p className="font-heading text-base">
              {resolveLocalized(entry.position, locale)} · {entry.company}
            </p>
            <p className="text-sm text-muted-foreground">
              {resolveLocalized(entry.industry, locale)} · {resolveLocalized(entry.period, locale)}
            </p>
            <MarkdownContent markdown={resolveLocalized(entry.summary, locale)} />
            <MarkdownContent markdown={resolveLocalized(entry.responsibilities, locale)} />
            <MarkdownContent markdown={resolveLocalized(entry.achievements, locale)} />
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">{t('common.stack')}</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.stack.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <CommandLabel label={t('about.skills')}>{t('about.skillsCommand')}</CommandLabel>
        {skills.map((cat) => (
          <div key={cat.category} className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">{cat.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {credentials.length > 0 && (
        <div className="flex flex-col gap-3">
          <CommandLabel label={t('about.education')}>{t('about.educationCommand')}</CommandLabel>
          {credentials.map((credential, index) => (
            <div key={index} className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">
                {resolveLocalized(credential.title, locale)}
                {credential.kind === 'certificate' && (
                  <span className="ml-1.5 text-xs text-muted-foreground">({t('about.certificates')})</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {credential.issuer} · {resolveLocalized(credential.period, locale)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <CommandLabel label={t('about.contact')}>{t('about.contactCommand')}</CommandLabel>
        <p className="text-sm text-muted-foreground">
          <span aria-hidden>{'> '}</span>
          <a href={`mailto:${profile.email}`} className="hover:text-foreground hover:underline">
            {profile.email}
          </a>
        </p>
        {profile.socials.map((social) => (
          <p key={social.platform} className="text-sm text-muted-foreground">
            <span aria-hidden>{'> '}</span>
            <a
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              {social.platform.toLowerCase()}
            </a>
          </p>
        ))}
      </div>
    </div>
  )
}
