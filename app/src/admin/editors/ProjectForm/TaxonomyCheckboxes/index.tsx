import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface TaxonomyCheckboxesProps {
  terms: string[]
  selected: string[]
  onChange: (next: string[]) => void
  label?: string
}

export function TaxonomyCheckboxes({ terms, selected, onChange, label }: TaxonomyCheckboxesProps) {
  console.debug('[refactor:project-form-children] TaxonomyCheckboxes mounted')

  function toggle(term: string, checked: boolean) {
    onChange(checked ? [...selected, term] : selected.filter((t) => t !== term))
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {terms.map((term) => {
          const id = `taxonomy-${label ?? 'terms'}-${term}`
          const checked = selected.includes(term)
          return (
            <div key={term} className="flex items-center gap-1.5">
              <Checkbox id={id} checked={checked} onCheckedChange={(next) => toggle(term, next === true)} />
              <Label htmlFor={id} className="font-normal">
                {term}
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
