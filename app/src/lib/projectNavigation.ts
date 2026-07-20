import type { Project } from '@/types'

export interface AdjacentProjects {
  prev: Project | null
  next: Project | null
}

// Over published projects sorted by `order` — no wraparound: the first project has no
// `prev`, the last has no `next`.
export function getAdjacentProjects(projects: Project[], currentSlug: string): AdjacentProjects {
  const published = projects.filter((p) => p.published).sort((a, b) => a.order - b.order)
  const index = published.findIndex((p) => p.slug === currentSlug)

  if (index === -1) return { prev: null, next: null }

  return {
    prev: index > 0 ? published[index - 1] : null,
    next: index < published.length - 1 ? published[index + 1] : null,
  }
}

// Published, excludes `current`, ranked by number of shared stack/category terms
// (descending), ties broken by `order` (ascending).
export function getRelatedProjects(projects: Project[], current: Project, limit = 2): Project[] {
  const candidates = projects.filter((p) => p.published && p.slug !== current.slug)

  const scored = candidates.map((project) => {
    const sharedStack = project.stack.filter((tech) => current.stack.includes(tech)).length
    const sharedCategory = project.category.filter((cat) => current.category.includes(cat)).length
    return { project, score: sharedStack + sharedCategory }
  })

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.project.order - b.project.order)
    .slice(0, limit)
    .map(({ project }) => project)
}
