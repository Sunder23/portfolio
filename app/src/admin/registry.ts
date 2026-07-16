import ProjectsEditor from '@/admin/editors/ProjectsEditor'
import ProfileEditor from '@/admin/editors/ProfileEditor'
import SkillsEditor from '@/admin/editors/SkillsEditor'

export const editorRegistry = [
  { id: 'projects', path: 'app/data/projects.json', label: 'Проекты', Editor: ProjectsEditor },
  { id: 'profile', path: 'app/data/profile.json', label: 'Профиль', Editor: ProfileEditor },
  { id: 'skills', path: 'app/data/skills.json', label: 'Скиллы', Editor: SkillsEditor },
] as const
