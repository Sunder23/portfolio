import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EMPTY_PROJECT_FILTER, type ProjectFilterOptions, type ProjectFilterState } from '@/lib/projectFilters'

const ALL_ROLES = '__all__'

export function ProjectFilters({
  options,
  value,
  onChange,
}: {
  options: ProjectFilterOptions
  value: ProjectFilterState
  onChange: (next: ProjectFilterState) => void
}) {
  const { t } = useTranslation()

  const hasActiveFilter = value.role !== null || value.stack.length > 0 || value.category.length > 0

  function toggleTerm(field: 'stack' | 'category', term: string) {
    const selected = value[field]
    const next = selected.includes(term) ? selected.filter((t) => t !== term) : [...selected, term]
    onChange({ ...value, [field]: next })
  }

  return (
    <div className="flex flex-col gap-4">
      {options.roles.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="font-heading text-xs uppercase tracking-wide text-muted-foreground">
            {t('projects.filter.roleLabel')}
          </p>
          <Tabs value={value.role ?? ALL_ROLES} onValueChange={(v) => onChange({ ...value, role: v === ALL_ROLES ? null : (v as string) })}>
            <TabsList>
              <TabsTrigger value={ALL_ROLES}>{t('projects.filter.allRoles')}</TabsTrigger>
              {options.roles.map((role) => (
                <TabsTrigger key={role} value={role}>
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {options.stacks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="font-heading text-xs uppercase tracking-wide text-muted-foreground">
            {t('projects.filter.stackLabel')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {options.stacks.map((tech) => {
              const active = value.stack.includes(tech)
              return (
                <Badge
                  key={tech}
                  variant={active ? 'default' : 'outline'}
                  render={<button type="button" aria-pressed={active} onClick={() => toggleTerm('stack', tech)} />}
                >
                  {tech}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {options.categories.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="font-heading text-xs uppercase tracking-wide text-muted-foreground">
            {t('projects.filter.categoryLabel')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {options.categories.map((cat) => {
              const active = value.category.includes(cat)
              return (
                <Badge
                  key={cat}
                  variant={active ? 'default' : 'outline'}
                  render={<button type="button" aria-pressed={active} onClick={() => toggleTerm('category', cat)} />}
                >
                  {cat}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {hasActiveFilter && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => onChange(EMPTY_PROJECT_FILTER)}>
          {t('projects.filter.reset')}
        </Button>
      )}
    </div>
  )
}
