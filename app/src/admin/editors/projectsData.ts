import { getFile, listDir, type CommitEntry } from '@/admin/lib/github'
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

export type ProjectCommitPlan =
  | { kind: 'createFile'; path: string; content: Project }
  | { kind: 'saveFile'; path: string; content: Project }
  | { kind: 'commitFiles'; entries: CommitEntry[] }

// Pure decision of *how* to persist a project save — kept separate from ProjectForm's flush
// (which actually calls github.ts) so it's unit-testable without rendering the form. Staged
// images bundle into the same commit as the JSON via commitFiles (see github.ts) instead of
// each becoming its own commit; a rename always goes through commitFiles so the create-new +
// delete-old pair lands atomically instead of as two separate commits.
export function buildProjectCommitPlan(params: {
  mode: 'create' | 'update' | 'rename'
  newPath: string
  oldPath: string | null
  project: Project
  imageEntries: { path: string; blobSha: string }[]
}): ProjectCommitPlan {
  const { mode, newPath, oldPath, project, imageEntries } = params
  const imageCommitEntries: CommitEntry[] = imageEntries.map((entry) => ({ path: entry.path, blobSha: entry.blobSha }))

  if (mode === 'rename') {
    if (!oldPath) throw new Error('buildProjectCommitPlan: rename requires oldPath')
    const content = JSON.stringify(project, null, 2)
    return { kind: 'commitFiles', entries: [{ path: newPath, content }, ...imageCommitEntries, { path: oldPath, delete: true }] }
  }

  if (imageCommitEntries.length === 0) {
    return mode === 'create'
      ? { kind: 'createFile', path: newPath, content: project }
      : { kind: 'saveFile', path: newPath, content: project }
  }

  const content = JSON.stringify(project, null, 2)
  return { kind: 'commitFiles', entries: [{ path: newPath, content }, ...imageCommitEntries] }
}

export function emptyProject(): Project {
  return {
    title: { uk: '' },
    slug: '',
    shortDescription: { uk: '' },
    description: { uk: '' },
    stack: [],
    category: [],
    role: 'WordPress developer',
    year: new Date().getFullYear(),
    url: '',
    cover: '',
    gallery: [],
    featured: false,
    order: 0,
    published: false,
  }
}
