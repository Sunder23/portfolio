import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProjectCard } from '@/components/ProjectCard'
import { ProjectFilters } from '@/components/ProjectFilters'
import { CommandLabel } from '@/components/CommandLabel'
import { getProjects } from '@/lib/data'
import { deriveFilterOptions, filterProjects, type ProjectFilterState } from '@/lib/projectFilters'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

function parseFilters(searchParams: URLSearchParams): ProjectFilterState {
  const stack = searchParams.get('stack')
  const category = searchParams.get('category')
  return {
    role: searchParams.get('role'),
    stack: stack ? stack.split(',') : [],
    category: category ? category.split(',') : [],
  }
}

function serializeFilters(filters: ProjectFilterState): URLSearchParams {
  const next = new URLSearchParams()
  if (filters.role) next.set('role', filters.role)
  if (filters.stack.length > 0) next.set('stack', filters.stack.join(','))
  if (filters.category.length > 0) next.set('category', filters.category.join(','))
  return next
}

export default function Projects() {
  const { t } = useTranslation()
  const projects = useAsyncData(getProjects)
  const [searchParams, setSearchParams] = useSearchParams()

  useDocumentMeta({ title: t('meta.projects.title'), description: t('meta.projects.description') })

  const filters = parseFilters(searchParams)

  if (!projects) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  const published = projects.filter((p) => p.published).sort((a, b) => a.order - b.order)
  const options = deriveFilterOptions(published)
  const filtered = filterProjects(published, filters)

  function handleFilterChange(next: ProjectFilterState) {
    console.debug('[Projects] filters applied', { ...next, resultCount: filterProjects(published, next).length })
    setSearchParams(serializeFilters(next), { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <CommandLabel as="h1" className="text-2xl" label={t('projects.title')}>
        {t('projects.commandTitle')}
      </CommandLabel>

      {published.length > 0 && <ProjectFilters options={options} value={filters} onChange={handleFilterChange} />}

      {published.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('projects.empty')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('projects.emptyFiltered')}</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t('projects.showingCount', { count: filtered.length, total: published.length })}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
