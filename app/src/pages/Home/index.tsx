import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectCard } from '@/components/ProjectCard'
import { CommandLabel } from '@/components/CommandLabel'
import { TerminalCursor } from '@/components/TerminalCursor'
import { getExperience, getProfile, getProjects, getSkills, getTestimonials } from '@/lib/data'
import { formatRelativeCommitDate, getCommitActivity, getRecentCommits } from '@/lib/commits'
import { CommitActivityGrid } from '@/components/CommitActivityGrid'
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
  const testimonials = useAsyncData(getTestimonials)
  const commits = useAsyncData(getRecentCommits)
  const commitActivity = useAsyncData(getCommitActivity)

  const title = useLocalized(profile?.title ?? { uk: '' })
  const bio = useLocalized(profile?.bio ?? { uk: '' })

  useDocumentMeta({ title: t('meta.home.title'), description: t('meta.home.description') })

  useEffect(() => {
    if (profile && skills && projects && experience && testimonials) {
      console.debug('[Home] sections loaded', {
        skillsCount: skills.length,
        featuredCount: projects.filter((p) => p.featured && p.published).length,
        testimonialsCount: testimonials.length,
        commitsCount: commits?.length,
        commitActivityWeeks: commitActivity?.length,
      })
    }
  }, [profile, skills, projects, experience, testimonials, commits, commitActivity])

  if (!profile || !skills || !projects || !experience || !testimonials) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  const featured = projects
    .filter((p) => p.featured && p.published)
    .sort((a, b) => a.order - b.order)
    .slice(0, 2)
  const publishedCount = projects.filter((p) => p.published).length
  const skillsCount = skills.reduce((total, cat) => total + cat.items.length, 0)
  const services = t('home.services.items', { returnObjects: true }) as {
    title: string
    description: string
  }[]
  const processSteps = t('home.process.items', { returnObjects: true }) as {
    title: string
    description: string
  }[]
  const faqItems = t('contact.faq.items', { returnObjects: true }) as { question: string; answer: string }[]
  const techHighlights = skills.flatMap((cat) => cat.items.slice(0, 2))

  const stats = [
    { label: t('home.statStatus'), value: t('home.statStatusValue') },
    { label: t('home.statLocation'), value: profile.location },
    { label: t('home.statStack'), value: String(skillsCount) },
    { label: t('home.statProjects'), value: String(publishedCount) },
  ]

  return (
    <div className="flex flex-1 flex-col gap-14">
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

      <div className="flex flex-col gap-4">
        <CommandLabel label={t('home.whoamiLabel')}>{t('home.whoamiTitle')}</CommandLabel>
        <div className="pixel-notch grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 bg-card px-4 py-3">
              <p className="font-heading text-2xl text-accent">{stat.value}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <CommandLabel label={t('home.servicesLabel')}>{t('home.servicesTitle')}</CommandLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((service, index) => (
            <div key={service.title} className="pixel-notch flex flex-col gap-1.5 border border-border p-4">
              <p aria-hidden className="font-heading text-xs text-accent">
                [{String(index + 1).padStart(2, '0')}]
              </p>
              <p className="font-heading text-base">{service.title}</p>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <CommandLabel label={t('home.processLabel')}>{t('home.processTitle')}</CommandLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <div key={step.title} className="pixel-notch flex flex-col gap-1.5 border border-border p-4">
              <p aria-hidden className="font-heading text-xs text-accent">
                {String(index + 1).padStart(2, '0')} →
              </p>
              <p className="font-heading text-base">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
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

      {techHighlights.length > 0 && (
        <div className="flex flex-col gap-4">
          <CommandLabel label={t('home.techLabel')}>{t('home.techTitle')}</CommandLabel>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {techHighlights.map((tech) => (
              <div
                key={tech}
                className="pixel-notch flex flex-col items-center justify-center gap-1 border border-border bg-card px-2 py-4 text-center"
              >
                <span aria-hidden className="font-heading text-lg text-accent">
                  {tech.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[11px] text-muted-foreground">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {commits && commits.length > 0 && (
        <div className="flex flex-col gap-4">
          <CommandLabel label={t('home.commitsLabel')}>{t('home.commitsTitle')}</CommandLabel>
          {commitActivity && commitActivity.length > 0 && <CommitActivityGrid weeks={commitActivity} />}
          <div className="pixel-notch flex flex-col border border-border bg-card">
            {commits.map((commit) => (
              <div
                key={commit.shortSha}
                className="flex flex-col gap-1 border-b border-border px-4 py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-3"
              >
                <span className="font-heading text-xs text-accent">{commit.shortSha}</span>
                <span className="flex-1 text-sm text-card-foreground">{commit.message}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeCommitDate(commit.date, locale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {experience.length > 0 && (
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
      )}

      {testimonials.length > 0 && (
        <div className="flex flex-col gap-4">
          <CommandLabel label={t('home.testimonialsLabel')}>{t('home.testimonialsTitle')}</CommandLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="pixel-notch flex flex-col gap-2 border border-border p-4">
                <p className="text-sm text-muted-foreground">“{resolveLocalized(testimonial.quote, locale)}”</p>
                <p className="font-heading text-sm">
                  {testimonial.name}
                  {testimonial.role && <span className="text-muted-foreground"> · {testimonial.role}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <CommandLabel label={t('home.faqLabel')}>{t('home.faqTitle')}</CommandLabel>
        <div className="flex flex-col gap-3">
          {faqItems.map((item) => (
            <div key={item.question} className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{item.question}</p>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

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
    </div>
  )
}
