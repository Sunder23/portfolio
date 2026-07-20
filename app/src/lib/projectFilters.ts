import type { Project } from '@/types'

export interface ProjectFilterState {
  role: string | null
  stack: string[]
  category: string[]
}

export const EMPTY_PROJECT_FILTER: ProjectFilterState = { role: null, stack: [], category: [] }

// AND semantics: role must match exactly (when set), and every selected stack/category
// term must be present on the project (not just one of them).
export function filterProjects(projects: Project[], filters: ProjectFilterState): Project[] {
  return projects.filter((project) => {
    if (filters.role && project.role !== filters.role) return false
    if (filters.stack.length > 0 && !filters.stack.every((term) => project.stack.includes(term))) return false
    if (filters.category.length > 0 && !filters.category.every((term) => project.category.includes(term))) return false
    return true
  })
}

export interface ProjectFilterOptions {
  roles: string[]
  stacks: string[]
  categories: string[]
}

// Derived from the given (already published) projects, not from taxonomies.json — so the UI
// never offers a filter option with zero matching projects.
export function deriveFilterOptions(projects: Project[]): ProjectFilterOptions {
  const roles = new Set<string>()
  const stacks = new Set<string>()
  const categories = new Set<string>()

  for (const project of projects) {
    roles.add(project.role)
    for (const tech of project.stack) stacks.add(tech)
    for (const cat of project.category) categories.add(cat)
  }

  return {
    roles: [...roles].sort(),
    stacks: [...stacks].sort(),
    categories: [...categories].sort(),
  }
}
