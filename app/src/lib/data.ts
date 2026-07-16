import type { Profile, Project, SkillCategory } from '@/types'

export async function getProjects(): Promise<Project[]> {
  const data = await import('../../data/projects.json')
  return data.default as Project[]
}

export async function getProfile(): Promise<Profile> {
  const data = await import('../../data/profile.json')
  return data.default as Profile
}

export async function getSkills(): Promise<SkillCategory[]> {
  const data = await import('../../data/skills.json')
  return data.default as SkillCategory[]
}
