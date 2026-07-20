import { describe, expect, it } from 'vitest'
import { getAdjacentProjects, getRelatedProjects } from '@/lib/projectNavigation'
import type { Project } from '@/types'

function project(overrides: Partial<Project>): Project {
  return {
    title: { uk: 'Project' },
    slug: 'project',
    shortDescription: { uk: '' },
    description: { uk: '' },
    stack: [],
    category: [],
    role: 'Fullstack developer',
    year: 2026,
    url: '',
    cover: '',
    gallery: [],
    featured: false,
    order: 0,
    published: true,
    ...overrides,
  }
}

describe('getAdjacentProjects', () => {
  const projects: Project[] = [
    project({ slug: 'a', order: 1 }),
    project({ slug: 'b', order: 2 }),
    project({ slug: 'c', order: 3 }),
    project({ slug: 'draft', order: 0, published: false }),
  ]

  it('returns null prev for the first published project', () => {
    expect(getAdjacentProjects(projects, 'a')).toEqual({ prev: null, next: projects[1] })
  })

  it('returns null next for the last published project', () => {
    expect(getAdjacentProjects(projects, 'c')).toEqual({ prev: projects[1], next: null })
  })

  it('returns both neighbours for a middle project', () => {
    expect(getAdjacentProjects(projects, 'b')).toEqual({ prev: projects[0], next: projects[2] })
  })

  it('returns null/null when there is only one published project', () => {
    const single = [project({ slug: 'only', order: 1 })]
    expect(getAdjacentProjects(single, 'only')).toEqual({ prev: null, next: null })
  })

  it('returns null/null when the slug is not found among published projects', () => {
    expect(getAdjacentProjects(projects, 'draft')).toEqual({ prev: null, next: null })
  })
})

describe('getRelatedProjects', () => {
  const current = project({ slug: 'current', stack: ['React', 'TypeScript'], category: ['Web'], order: 1 })
  const projects: Project[] = [
    current,
    project({ slug: 'high-overlap', stack: ['React', 'TypeScript'], category: ['Web'], order: 2 }),
    project({ slug: 'low-overlap', stack: ['React'], category: [], order: 3 }),
    project({ slug: 'no-overlap', stack: ['PHP'], category: ['CMS'], order: 4 }),
    project({ slug: 'unpublished-overlap', stack: ['React'], category: ['Web'], order: 5, published: false }),
  ]

  it('ranks by shared stack/category count, excludes self and unpublished, and respects the limit', () => {
    const result = getRelatedProjects(projects, current, 2)
    expect(result.map((p) => p.slug)).toEqual(['high-overlap', 'low-overlap'])
  })

  it('excludes projects with zero overlap', () => {
    const result = getRelatedProjects(projects, current, 10)
    expect(result.map((p) => p.slug)).toEqual(['high-overlap', 'low-overlap'])
  })

  it('breaks ties by order when scores are equal', () => {
    const tied: Project[] = [
      current,
      project({ slug: 'later', stack: ['React'], category: [], order: 5 }),
      project({ slug: 'earlier', stack: ['React'], category: [], order: 2 }),
    ]
    const result = getRelatedProjects(tied, current, 10)
    expect(result.map((p) => p.slug)).toEqual(['earlier', 'later'])
  })
})
