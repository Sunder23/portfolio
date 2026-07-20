import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Filter, FilterX, Search } from 'lucide-react'
import { ProjectCard } from '@/components/ProjectCard'
import { ProjectFilters } from './ProjectFilters'
import { CommandLabel } from '@/components/CommandLabel'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getProjects } from '@/lib/data'
import { deriveFilterOptions, filterProjects, type ProjectFilterState } from '@/lib/projectFilters'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { cn } from '@/lib/utils'

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
  const activeFilterCount = (filters.role ? 1 : 0) + filters.stack.length + filters.category.length

  function handleFilterChange(next: ProjectFilterState) {
    console.debug('[Projects] filters applied', { ...next, resultCount: filterProjects(published, next).length })
    setSearchParams(serializeFilters(next), { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <CommandLabel as="h1" className="text-2xl" label={t('projects.title')}>
        {t('projects.commandTitle')}
      </CommandLabel>

      {published.length > 0 && (
        <div className="md:grid md:grid-cols-[340px_1fr] md:items-start md:gap-8">
          <aside aria-label={t('projects.filter.toggle')} className="md:sticky md:top-24">
            <div className="md:hidden" data-testid="mobile-filter-panel">
              <Collapsible>
                <CollapsibleTrigger
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'group w-full justify-between')}
                >
                  <span className="flex items-center gap-1.5">
                    <Filter className="size-4 shrink-0" aria-hidden />
                    {t('projects.filter.toggle')}
                    {activeFilterCount > 0 && <Badge variant="default">{activeFilterCount}</Badge>}
                  </span>
                  <ChevronDown className="size-4 transition-transform group-aria-expanded:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pixel-notch mt-4 border border-border bg-card p-4">
                  <ProjectFilters options={options} value={filters} onChange={handleFilterChange} />
                </CollapsibleContent>
              </Collapsible>
            </div>
            <div className="hidden md:block" data-testid="desktop-filter-panel">
              <div className="pixel-notch border border-border bg-card p-4">
                <ProjectFilters options={options} value={filters} onChange={handleFilterChange} />
              </div>
            </div>
          </aside>

          <div className="mt-6 flex flex-col gap-4 md:mt-0">
            {filtered.length === 0 ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FilterX className="size-4 shrink-0" aria-hidden />
                {t('projects.emptyFiltered')}
              </p>
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
        </div>
      )}

      {published.length === 0 && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Search className="size-4 shrink-0" aria-hidden />
          {t('projects.empty')}
        </p>
      )}
    </div>
  )
}
