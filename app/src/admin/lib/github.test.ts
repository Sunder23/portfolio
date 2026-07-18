import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GithubAuthError,
  GithubConflictError,
  commitFiles,
  createFile,
  createImageBlob,
  deleteFile,
  listDir,
} from '@/admin/lib/github'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('listDir', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('returns only .json entries from a directory listing', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, [
        { name: 'a.json', path: 'app/data/projects/a.json', sha: 'sha-a' },
        { name: 'README.md', path: 'app/data/projects/README.md', sha: 'sha-readme' },
      ]),
    )

    const result = await listDir('app/data/projects', 'token')

    expect(result).toEqual([{ name: 'a.json', path: 'app/data/projects/a.json', sha: 'sha-a' }])
  })

  it('treats a 404 (folder not created yet) as an empty list', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { message: 'Not Found' }))

    const result = await listDir('app/data/projects', 'token')

    expect(result).toEqual([])
  })

  it('throws GithubAuthError on 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Bad credentials' }))

    await expect(listDir('app/data/projects', 'token')).rejects.toBeInstanceOf(GithubAuthError)
  })
})

describe('createFile', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('PUTs without a sha field in the body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { content: { sha: 'new-sha' } }))

    const result = await createFile('app/data/projects/new.json', { slug: 'new' }, 'admin: create', 'token')

    expect(result).toEqual({ sha: 'new-sha' })
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body).not.toHaveProperty('sha')
    expect(body.message).toBe('admin: create')
  })

  it('throws GithubAuthError on 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Bad credentials' }))

    await expect(createFile('app/data/projects/new.json', {}, 'admin: create', 'token')).rejects.toBeInstanceOf(
      GithubAuthError,
    )
  })
})

describe('deleteFile', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('DELETEs with the given sha in the body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {}))

    await deleteFile('app/data/projects/old.json', 'old-sha', 'admin: delete', 'token')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('DELETE')
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({ message: 'admin: delete', sha: 'old-sha' })
  })

  it('throws GithubAuthError on 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Bad credentials' }))

    await expect(deleteFile('app/data/projects/old.json', 'old-sha', 'admin: delete', 'token')).rejects.toBeInstanceOf(
      GithubAuthError,
    )
  })
})

describe('createImageBlob', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('creates a blob without committing (a single POST, no ref/tree/commit calls)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { sha: 'blob-sha' }))

    const result = await createImageBlob(new Blob(['x']), 'token')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.blobSha).toBe('blob-sha')
    expect(result.path).toMatch(/^app\/public\/uploads\/.+\.webp$/)
    // publicPath is the runtime URL substituted into JSON (cover/gallery/avatar); path above
    // is the repo path used as the commitFiles tree entry — they must not be the same string.
    expect(result.publicPath).toMatch(/^\/uploads\/.+\.webp$/)
    expect(result.publicPath).not.toBe(result.path)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/git/blobs')
    expect(JSON.parse(init.body as string)).toEqual({ content: expect.any(String), encoding: 'base64' })
  })
})

describe('commitFiles', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  function mockSuccessfulCommitSequence() {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { object: { sha: 'parent-sha' } })) // GET ref
      .mockResolvedValueOnce(jsonResponse(200, { tree: { sha: 'base-tree-sha' } })) // GET commit
      .mockResolvedValueOnce(jsonResponse(201, { sha: 'json-blob-sha' })) // POST blob (content entry)
      .mockResolvedValueOnce(jsonResponse(201, { sha: 'new-tree-sha' })) // POST tree
      .mockResolvedValueOnce(jsonResponse(201, { sha: 'new-commit-sha' })) // POST commit
      .mockResolvedValueOnce(jsonResponse(200, {})) // PATCH ref
  }

  it('bundles a JSON entry and an already-created image blob into a single commit', async () => {
    mockSuccessfulCommitSequence()

    await commitFiles(
      [
        { path: 'app/data/projects/foo.json', content: '{"slug":"foo"}' },
        { path: 'app/public/uploads/img.webp', blobSha: 'preexisting-blob-sha' },
      ],
      'admin: save foo',
      'token',
    )

    expect(fetchMock).toHaveBeenCalledTimes(6)

    const [treeUrl, treeInit] = fetchMock.mock.calls[3]
    expect(treeUrl).toContain('/git/trees')
    const treeBody = JSON.parse(treeInit.body as string)
    expect(treeBody.base_tree).toBe('base-tree-sha')
    expect(treeBody.tree).toEqual([
      { path: 'app/data/projects/foo.json', mode: '100644', type: 'blob', sha: 'json-blob-sha' },
      { path: 'app/public/uploads/img.webp', mode: '100644', type: 'blob', sha: 'preexisting-blob-sha' },
    ])

    const [commitUrl, commitInit] = fetchMock.mock.calls[4]
    expect(commitUrl).toContain('/git/commits')
    expect(JSON.parse(commitInit.body as string)).toEqual({
      message: 'admin: save foo',
      tree: 'new-tree-sha',
      parents: ['parent-sha'],
    })

    const [refUrl, refInit] = fetchMock.mock.calls[5]
    expect(refUrl).toContain('/git/refs/heads/main')
    expect(refInit.method).toBe('PATCH')
    expect(JSON.parse(refInit.body as string)).toEqual({ sha: 'new-commit-sha', force: false })
  })

  it('represents a delete entry as a null-sha tree entry (no blob created for it)', async () => {
    mockSuccessfulCommitSequence()

    await commitFiles(
      [
        { path: 'app/data/projects/new-name.json', content: '{"slug":"new-name"}' },
        { path: 'app/data/projects/old-name.json', delete: true },
      ],
      'admin: rename',
      'token',
    )

    const [, treeInit] = fetchMock.mock.calls[3]
    const treeBody = JSON.parse(treeInit.body as string)
    expect(treeBody.tree).toEqual([
      { path: 'app/data/projects/new-name.json', mode: '100644', type: 'blob', sha: 'json-blob-sha' },
      { path: 'app/data/projects/old-name.json', mode: '100644', type: 'blob', sha: null },
    ])
  })

  it('retries once on a non-fast-forward (422) ref update', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { object: { sha: 'parent-sha-1' } }))
      .mockResolvedValueOnce(jsonResponse(200, { tree: { sha: 'base-tree-sha-1' } }))
      .mockResolvedValueOnce(jsonResponse(201, { sha: 'json-blob-sha' }))
      .mockResolvedValueOnce(jsonResponse(201, { sha: 'new-tree-sha-1' }))
      .mockResolvedValueOnce(jsonResponse(201, { sha: 'new-commit-sha-1' }))
      .mockResolvedValueOnce(jsonResponse(422, { message: 'Update is not a fast forward' }))
    mockSuccessfulCommitSequence()

    await commitFiles([{ path: 'app/data/taxonomies.json', content: '{}' }], 'admin: update taxonomies.json', 'token')

    expect(fetchMock).toHaveBeenCalledTimes(12)
  })

  it('throws GithubConflictError after a second consecutive 422', async () => {
    const failingSequence = () =>
      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, { object: { sha: 'parent-sha' } }))
        .mockResolvedValueOnce(jsonResponse(200, { tree: { sha: 'base-tree-sha' } }))
        .mockResolvedValueOnce(jsonResponse(201, { sha: 'json-blob-sha' }))
        .mockResolvedValueOnce(jsonResponse(201, { sha: 'new-tree-sha' }))
        .mockResolvedValueOnce(jsonResponse(201, { sha: 'new-commit-sha' }))
        .mockResolvedValueOnce(jsonResponse(422, { message: 'Update is not a fast forward' }))
    failingSequence()
    failingSequence()

    await expect(
      commitFiles([{ path: 'app/data/taxonomies.json', content: '{}' }], 'admin: update taxonomies.json', 'token'),
    ).rejects.toBeInstanceOf(GithubConflictError)
  })

  it('throws GithubAuthError on 401 from the ref read', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Bad credentials' }))

    await expect(
      commitFiles([{ path: 'app/data/taxonomies.json', content: '{}' }], 'admin: update taxonomies.json', 'token'),
    ).rejects.toBeInstanceOf(GithubAuthError)
  })
})
