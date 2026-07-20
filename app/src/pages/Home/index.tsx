import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getExperience, getProfile, getProjects, getSkills, getTestimonials } from '@/lib/data'
import { getCommitActivity, getRecentCommits } from '@/lib/commits'
import { useLocale } from '@/hooks/useLocale'
import { useLocalized } from '@/hooks/useLocalized'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { buildStats, getTechHighlights } from './constants'
import { HeroSection } from './HeroSection'
import { StatsSection } from './StatsSection'
import { ServicesSection } from './ServicesSection'
import { ProcessSection } from './ProcessSection'
import { StackSection } from './StackSection'
import { TechHighlightsSection } from './TechHighlightsSection'
import { FeaturedProjectsSection } from './FeaturedProjectsSection'
import { CommitsSection } from './CommitsSection'
import { ExperienceSection } from './ExperienceSection'
import { TestimonialsSection } from './TestimonialsSection'
import { FaqSection } from './FaqSection'
import { CtaSection } from './CtaSection'

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
  const techHighlights = getTechHighlights(skills)
  const stats = buildStats(t, profile, skillsCount, publishedCount)

  console.debug('[refactor:home-compose]', { sectionsRendered: 12 })

  return (
    <div className="flex flex-1 flex-col gap-14">
      <HeroSection profile={profile} title={title} bio={bio} locale={locale} />
      <StatsSection stats={stats} />
      <ServicesSection services={services} />
      <ProcessSection processSteps={processSteps} />
      <StackSection skills={skills} />
      {techHighlights.length > 0 && <TechHighlightsSection techHighlights={techHighlights} />}
      {featured.length > 0 && <FeaturedProjectsSection featured={featured} locale={locale} />}
      {commits && commits.length > 0 && (
        <CommitsSection commits={commits} commitActivity={commitActivity} locale={locale} />
      )}
      {experience.length > 0 && <ExperienceSection experience={experience} locale={locale} />}
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} locale={locale} />}
      <FaqSection faqItems={faqItems} />
      <CtaSection profile={profile} />
    </div>
  )
}
