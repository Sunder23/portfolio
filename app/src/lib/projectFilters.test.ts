import { describe, expect, it } from 'vitest'
import { deriveFilterOptions, filterProjects, type ProjectFilterState } from '@/lib/projectFilters'
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

const projects: Project[] = [
  project({
    slug: 'a',
    role: 'Fullstack developer',
    stack: ['React', 'TypeScript'],
    category: ['Web', 'Portfolio'],
  }),
  project({
    slug: 'b',
    role: 'WordPress developer',
    stack: ['PHP', 'WordPress'],
    category: ['Web', 'CMS'],
  }),
  project({
    slug: 'c',
    role: 'WordPress developer',
    stack: ['PHP', 'WordPress', 'WooCommerce'],
    category: ['Web', 'CMS', 'E-commerce'],
  }),
]

describe('filterProjects', () => {
  it('returns all projects when no filters are set', () => {
    expect(filterProjects(projects, { role: null, stack: [], category: [] })).toEqual(projects)
  })

  it('filters by role only', () => {
    const result = filterProjects(projects, { role: 'WordPress developer', stack: [], category: [] })
    expect(result.map((p) => p.slug)).toEqual(['b', 'c'])
  })

  it('requires every selected stack term to be present (AND semantics)', () => {
    const result = filterProjects(projects, { role: null, stack: ['PHP', 'WooCommerce'], category: [] })
    expect(result.map((p) => p.slug)).toEqual(['c'])
  })

  it('requires every selected category term to be present (AND semantics)', () => {
    const result = filterProjects(projects, { role: null, stack: [], category: ['Web', 'CMS'] })
    expect(result.map((p) => p.slug)).toEqual(['b', 'c'])
  })

  it('combines role, stack, and category filters', () => {
    const filters: ProjectFilterState = { role: 'WordPress developer', stack: ['WooCommerce'], category: ['E-commerce'] }
    const result = filterProjects(projects, filters)
    expect(result.map((p) => p.slug)).toEqual(['c'])
  })

  it('returns an empty array when nothing matches', () => {
    const result = filterProjects(projects, { role: null, stack: ['Vue'], category: [] })
    expect(result).toEqual([])
  })
})

describe('deriveFilterOptions', () => {
  it('collects unique, sorted role/stack/category values from the given projects', () => {
    expect(deriveFilterOptions(projects)).toEqual({
      roles: ['Fullstack developer', 'WordPress developer'],
      stacks: ['PHP', 'React', 'TypeScript', 'WooCommerce', 'WordPress'],
      categories: ['CMS', 'E-commerce', 'Portfolio', 'Web'],
    })
  })

  it('returns empty option lists for an empty project list', () => {
    expect(deriveFilterOptions([])).toEqual({ roles: [], stacks: [], categories: [] })
  })
})
