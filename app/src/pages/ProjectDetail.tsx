import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkdownContent } from '@/components/MarkdownContent'
import { getProjects } from '@/lib/data'
import { useLocale } from '@/hooks/useLocale'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'

export default function ProjectDetail() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { slug } = useParams<{ slug: string }>()
  const [projects, setProjects] = useState<Project[] | null>(null)

  useEffect(() => {
    console.info('[pages/ProjectDetail] loading projects')
    getProjects().then(setProjects)
  }, [])

  const project = projects?.find((p) => p.slug === slug && p.published) ?? null

  const title = useLocalized(project?.title ?? { uk: '' })
  const description = useLocalized(project?.description ?? { uk: '' })

  if (!projects) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  if (!project) {
    console.warn(`[pages/ProjectDetail] project not found for slug "${slug}"`)
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t('projectDetail.notFound')}</p>
        <Link to={`/${locale}/projects`} className={buttonVariants({ variant: 'outline' })}>
          {t('projectDetail.back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to={`/${locale}/projects`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {t('projectDetail.back')}
      </Link>

      <h1 className="text-2xl font-medium">{title}</h1>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          {t('projectDetail.role')}: {project.role}
        </span>
        <span>
          {t('projectDetail.year')}: {project.year}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <Badge key={tech} variant="outline">
            {tech}
          </Badge>
        ))}
      </div>

      {project.gallery.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {project.gallery.map((src) => (
            <img key={src} src={src} alt={title} loading="lazy" className="rounded-lg object-cover" />
          ))}
        </div>
      )}

      <MarkdownContent markdown={description} />

      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: 'default' }), 'self-start')}
        >
          {t('projectDetail.visitProject')}
        </a>
      )}
    </div>
  )
}
