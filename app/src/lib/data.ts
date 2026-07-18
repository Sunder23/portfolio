import type { Profile, Project, SkillCategory } from '@/types'

const projectModules = import.meta.glob<{ default: Project }>('../../data/projects/*.json', { eager: true })

export async function getProjects(): Promise<Project[]> {
  return Object.values(projectModules).map((module) => module.default)
}

export async function getProfile(): Promise<Profile> {
  const data = await import('../../data/profile.json')
  return data.default as Profile
}

export async function getSkills(): Promise<SkillCategory[]> {
  const data = await import('../../data/skills.json')
  return data.default as SkillCategory[]
}
