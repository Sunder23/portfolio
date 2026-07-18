import { getFile, listDir } from '@/admin/github'
import type { Project } from '@/types'

export const PROJECTS_DIR = 'app/data/projects'
export const TAXONOMIES_PATH = 'app/data/taxonomies.json'

export interface ProjectEntry {
  project: Project
  path: string
  sha: string
}

export async function loadProjectEntries(token: string): Promise<ProjectEntry[]> {
  const files = await listDir(PROJECTS_DIR, token)
  return Promise.all(
    files.map(async (file) => {
      const { data, sha } = await getFile<Project>(file.path, token)
      return { project: data, path: file.path, sha }
    }),
  )
}

export function emptyProject(): Project {
  return {
    title: { uk: '' },
    slug: '',
    shortDescription: { uk: '' },
    description: { uk: '' },
    stack: [],
    category: [],
    role: '',
    year: new Date().getFullYear(),
    url: '',
    cover: '',
    gallery: [],
    featured: false,
    order: 0,
    published: false,
  }
}
