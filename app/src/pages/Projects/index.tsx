import { useTranslation } from 'react-i18next'
import { ProjectCard } from '@/components/ProjectCard'
import { CommandLabel } from '@/components/CommandLabel'
import { getProjects } from '@/lib/data'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function Projects() {
  const { t } = useTranslation()
  const projects = useAsyncData(getProjects)

  useDocumentMeta({ title: t('meta.projects.title'), description: t('meta.projects.description') })

  if (!projects) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  const published = projects.filter((p) => p.published).sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-6">
      <CommandLabel as="h1" className="text-2xl" label={t('projects.title')}>
        {t('projects.commandTitle')}
      </CommandLabel>
      {published.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('projects.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {published.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
