import { describe, expect, it } from 'vitest'
import { buildProjectCommitPlan, emptyProject } from '@/admin/editors/projectsData'

const project = { ...emptyProject(), slug: 'my-project', title: { uk: 'Мій проєкт' } }

describe('buildProjectCommitPlan', () => {
  it('uses createFile for a brand new project with no staged images', () => {
    const plan = buildProjectCommitPlan({
      mode: 'create',
      newPath: 'app/data/projects/my-project.json',
      oldPath: null,
      project,
      imageEntries: [],
    })

    expect(plan).toEqual({ kind: 'createFile', path: 'app/data/projects/my-project.json', content: project })
  })

  it('uses saveFile for an in-place edit with no staged images', () => {
    const plan = buildProjectCommitPlan({
      mode: 'update',
      newPath: 'app/data/projects/my-project.json',
      oldPath: null,
      project,
      imageEntries: [],
    })

    expect(plan).toEqual({ kind: 'saveFile', path: 'app/data/projects/my-project.json', content: project })
  })

  // [FIX] A staged cover/gallery image used to be uploaded as its own separate commit before
  // the project JSON was saved — see the "chore(uploads): add <uuid>.webp" commits reported
  // alongside "admin: update projects.json". Now they land in the same commit.
  it('bundles the JSON and staged image blobs into one commitFiles call when creating with images', () => {
    const plan = buildProjectCommitPlan({
      mode: 'create',
      newPath: 'app/data/projects/my-project.json',
      oldPath: null,
      project,
      imageEntries: [{ path: 'app/public/uploads/a.webp', blobSha: 'blob-a' }],
    })

    expect(plan).toEqual({
      kind: 'commitFiles',
      entries: [
        { path: 'app/data/projects/my-project.json', content: JSON.stringify(project, null, 2) },
        { path: 'app/public/uploads/a.webp', blobSha: 'blob-a' },
      ],
    })
  })

  it('bundles the JSON and staged image blobs into one commitFiles call when updating with images', () => {
    const plan = buildProjectCommitPlan({
      mode: 'update',
      newPath: 'app/data/projects/my-project.json',
      oldPath: null,
      project,
      imageEntries: [
        { path: 'app/public/uploads/a.webp', blobSha: 'blob-a' },
        { path: 'app/public/uploads/b.webp', blobSha: 'blob-b' },
      ],
    })

    expect(plan.kind).toBe('commitFiles')
    if (plan.kind !== 'commitFiles') throw new Error('unreachable')
    expect(plan.entries).toHaveLength(3)
    expect(plan.entries[1]).toEqual({ path: 'app/public/uploads/a.webp', blobSha: 'blob-a' })
    expect(plan.entries[2]).toEqual({ path: 'app/public/uploads/b.webp', blobSha: 'blob-b' })
  })

  // [FIX] A slug rename used to be two separate commits (create the new path, then delete the
  // old one) — a failure in between could leave both files present. Now it's one atomic commit.
  it('always uses commitFiles for a rename, deleting the old path in the same commit, even with no images', () => {
    const plan = buildProjectCommitPlan({
      mode: 'rename',
      newPath: 'app/data/projects/new-slug.json',
      oldPath: 'app/data/projects/old-slug.json',
      project: { ...project, slug: 'new-slug' },
      imageEntries: [],
    })

    expect(plan).toEqual({
      kind: 'commitFiles',
      entries: [
        { path: 'app/data/projects/new-slug.json', content: JSON.stringify({ ...project, slug: 'new-slug' }, null, 2) },
        { path: 'app/data/projects/old-slug.json', delete: true },
      ],
    })
  })

  it('bundles staged images into a rename commit too', () => {
    const plan = buildProjectCommitPlan({
      mode: 'rename',
      newPath: 'app/data/projects/new-slug.json',
      oldPath: 'app/data/projects/old-slug.json',
      project: { ...project, slug: 'new-slug' },
      imageEntries: [{ path: 'app/public/uploads/a.webp', blobSha: 'blob-a' }],
    })

    expect(plan.kind).toBe('commitFiles')
    if (plan.kind !== 'commitFiles') throw new Error('unreachable')
    expect(plan.entries).toEqual([
      { path: 'app/data/projects/new-slug.json', content: JSON.stringify({ ...project, slug: 'new-slug' }, null, 2) },
      { path: 'app/public/uploads/a.webp', blobSha: 'blob-a' },
      { path: 'app/data/projects/old-slug.json', delete: true },
    ])
  })

  it('throws if rename mode is used without an oldPath', () => {
    expect(() =>
      buildProjectCommitPlan({
        mode: 'rename',
        newPath: 'app/data/projects/new-slug.json',
        oldPath: null,
        project,
        imageEntries: [],
      }),
    ).toThrow()
  })
})
