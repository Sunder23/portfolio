import ProfileEditor from '@/admin/editors/ProfileEditor'
import SkillsEditor from '@/admin/editors/SkillsEditor'
import ExperienceEditor from '@/admin/editors/ExperienceEditor'

// Singleton editors only (no list/add/edit screens) - Projects has its own
// dedicated routes (list/new/:slug) wired directly in pages/Admin.tsx, and
// sidebar structure lives in admin/navConfig.ts.
export const editorRegistry = [
  { id: 'profile', path: 'app/data/profile.json', label: 'Профиль', Editor: ProfileEditor },
  { id: 'skills', path: 'app/data/skills.json', label: 'Скиллы', Editor: SkillsEditor },
  { id: 'experience', path: 'app/data/experience.json', label: 'Опыт', Editor: ExperienceEditor },
] as const
