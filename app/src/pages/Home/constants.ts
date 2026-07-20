import type { TFunction } from 'i18next'
import type { Profile, SkillCategory } from '@/types'

export function stepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function getTechHighlights(skills: SkillCategory[]): string[] {
  return skills.flatMap((cat) => cat.items.slice(0, 2))
}

export function buildStats(
  t: TFunction,
  profile: Profile,
  skillsCount: number,
  publishedCount: number,
): { label: string; value: string }[] {
  return [
    { label: t('home.statStatus'), value: t('home.statStatusValue') },
    { label: t('home.statLocation'), value: profile.location },
    { label: t('home.statStack'), value: String(skillsCount) },
    { label: t('home.statProjects'), value: String(publishedCount) },
  ]
}

