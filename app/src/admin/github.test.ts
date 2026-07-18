import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GithubAuthError, createFile, deleteFile, listDir } from '@/admin/github'

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
