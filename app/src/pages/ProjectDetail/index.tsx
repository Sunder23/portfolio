import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkdownContent } from '@/components/MarkdownContent'
import { getProjects } from '@/lib/data'
import { useLocale } from '@/hooks/useLocale'
import { useLocalized } from '@/hooks/useLocalized'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { cn } from '@/lib/utils'

// Strips common markdown syntax and trims to a reasonable meta-description length.
function toPlainDescription(markdown: string): string {
  const plain = markdown
    .replace(/[#*_`>~-]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain
}

export default function ProjectDetail() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { slug } = useParams<{ slug: string }>()
  const projects = useAsyncData(getProjects, 'ProjectDetail')

  const project = projects?.find((p) => p.slug === slug && p.published) ?? null

  const title = useLocalized(project?.title ?? { uk: '' })
  const description = useLocalized(project?.description ?? { uk: '' })

  useDocumentMeta(
    project
      ? { title: `${title} — Max Kravchuk`, description: toPlainDescription(description) }
      : { title: t('meta.projectDetail.title'), description: t('meta.projectDetail.description') },
  )

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
