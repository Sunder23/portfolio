import type { Credential, Experience, Profile, Project, SkillCategory, Testimonial } from '@/types'

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

export async function getExperience(): Promise<Experience[]> {
  const data = await import('../../data/experience.json')
  return data.default as Experience[]
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const data = await import('../../data/testimonials.json')
  return data.default as Testimonial[]
}

export async function getCredentials(): Promise<Credential[]> {
  const data = await import('../../data/credentials.json')
  return data.default as Credential[]
}
