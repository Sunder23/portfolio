import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { CommandLabel } from '@/components/CommandLabel'
import { ProjectCard } from '@/components/ProjectCard'
import type { Locale } from '@/lib/locale'
import type { Project } from '@/types'

export function FeaturedProjectsSection({ featured, locale }: { featured: Project[]; locale: Locale }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <CommandLabel label={t('projects.title')}>{t('home.featuredTitle')}</CommandLabel>
        <Link
          to={`/${locale}/projects`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('home.viewProjects')}
          <ArrowRight className="size-3.5 shrink-0" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {featured.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  )
}
