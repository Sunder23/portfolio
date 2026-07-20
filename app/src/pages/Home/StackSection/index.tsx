import { useTranslation } from 'react-i18next'
import { CommandLabel } from '@/components/CommandLabel'
import { Badge } from '@/components/ui/badge'
import type { SkillCategory } from '@/types'

export function StackSection({ skills }: { skills: SkillCategory[] }) {
  const { t } = useTranslation()

  return (
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
  )
}
