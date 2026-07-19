import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectCard } from '@/components/ProjectCard'
import { CommandLabel } from '@/components/CommandLabel'
import { TerminalCursor } from '@/components/TerminalCursor'
import { getExperience, getProfile, getProjects, getSkills } from '@/lib/data'
import { useLocale } from '@/hooks/useLocale'
import { useLocalized } from '@/hooks/useLocalized'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { resolveLocalized } from '@/types'

export default function Home() {
  const { t } = useTranslation()
  const locale = useLocale()
  const profile = useAsyncData(getProfile)
  const skills = useAsyncData(getSkills)
  const projects = useAsyncData(getProjects)
  const experience = useAsyncData(getExperience)

  const title = useLocalized(profile?.title ?? { uk: '' })
  const bio = useLocalized(profile?.bio ?? { uk: '' })

  useDocumentMeta({ title: t('meta.home.title'), description: t('meta.home.description') })

  useEffect(() => {
    if (profile && skills && projects && experience) {
      console.debug('[Home] sections loaded', {
        skillsCount: skills.length,
        featuredCount: projects.filter((p) => p.featured && p.published).length,
      })
    }
  }, [profile, skills, projects, experience])

  if (!profile || !skills || !projects || !experience) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  const featured = projects
    .filter((p) => p.featured && p.published)
    .sort((a, b) => a.order - b.order)
    .slice(0, 2)
  const currentJob = experience[0]

  return (
    <div className="flex flex-1 flex-col gap-14">
      <div className="border border-border">
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
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <CommandLabel label={t('about.skills')}>{t('home.stackTitle')}</CommandLabel>
        <div className="flex flex-col gap-3">
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
      </div>

      {featured.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <CommandLabel label={t('projects.title')}>{t('home.featuredTitle')}</CommandLabel>
            <Link
              to={`/${locale}/projects`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('home.viewProjects')} →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featured.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      )}

      {currentJob && (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <CommandLabel label={t('about.experience')}>{t('home.experienceTitle')}</CommandLabel>
            <Link
              to={`/${locale}/about`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('home.viewFullExperience')} →
            </Link>
          </div>
          <div className="border border-border p-4">
            <p className="font-heading text-base">
              {resolveLocalized(currentJob.position, locale)} · {currentJob.company}
            </p>
            <p className="text-sm text-muted-foreground">
              {resolveLocalized(currentJob.period, locale)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
