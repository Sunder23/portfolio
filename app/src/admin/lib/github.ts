export const OWNER = 'Sunder23'
export const REPO = 'portfolio'

const API_BASE = 'https://api.github.com'

export class GithubAuthError extends Error {
  constructor() {
    super('GitHub token is invalid or expired')
    this.name = 'GithubAuthError'
  }
}

export class GithubConflictError extends Error {
  constructor() {
    super('File was modified concurrently (sha conflict)')
    this.name = 'GithubConflictError'
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  }
}

// Shared status handling for every Contents API call — 401/409/generic-error
// branches used to be repeated in each function; centralized here instead.
async function assertOkResponse(
  response: Response,
  path: string,
  action: string,
  opts: { conflict?: boolean } = {},
): Promise<void> {
  if (response.status === 401) {
    throw new GithubAuthError()
  }
  if (opts.conflict && response.status === 409) {
    throw new GithubConflictError()
  }
  if (!response.ok) {
    console.error(`[admin/github] ${action} failed ${path}: ${response.status}`)
    throw new Error(`GitHub API error ${action} ${path}: ${response.status}`)
  }
}

// Shared retry-once-on-409 wrapper used by saveFile and uploadImage — re-runs
// `action` (which itself re-fetches a fresh sha where needed) exactly once
// after a conflict, then gives up.
async function withConflictRetry<T>(action: () => Promise<T>, path: string, label: string): Promise<T> {
  try {
    const result = await action()
    console.info(`[admin/github] ${label} success ${path}`)
    return result
  } catch (err) {
    if (!(err instanceof GithubConflictError)) {
      console.error(`[admin/github] ${label} failed ${path}`, err)
      throw err
    }

    console.warn(`[admin/github] ${label} conflict on ${path}, retrying once`)
    const result = await action()
    console.info(`[admin/github] ${label} success after retry ${path}`)
    return result
  }
}

// btoa/atob only handle Latin1 — content is Ukrainian/Russian, so we go through
// raw UTF-8 bytes instead of encoding the JS string directly.
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToUtf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

// Binary-safe base64 (raw bytes, no JSON/UTF-8-text assumption like utf8ToBase64 above).
// Chunked to avoid blowing the call stack on String.fromCharCode(...bytes) for large images.
async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function fetchContents(path: string, token: string): Promise<{ sha: string; content: string }> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: authHeaders(token),
  })
  await assertOkResponse(response, path, 'reading')

  const json = await response.json()
  return { sha: json.sha, content: json.content }
}

export async function validateToken(token: string): Promise<boolean> {
  console.info(`[admin/github] validating token for ${OWNER}/${REPO}`)
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}`, {
    headers: authHeaders(token),
  })
  console.info(`[admin/github] token validation result: ${response.status}`)
  return response.ok
}

export async function getFile<T>(path: string, token: string): Promise<{ data: T; sha: string }> {
  console.info(`[admin/github] GET ${path}`)
  const { sha, content } = await fetchContents(path, token)
  const data = JSON.parse(base64ToUtf8(content)) as T
  return { data, sha }
}

export async function putFile(
  path: string,
  content: unknown,
  message: string,
  token: string,
  sha: string,
): Promise<{ sha: string }> {
  console.info(`[admin/github] PUT ${path}`)
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: utf8ToBase64(JSON.stringify(content, null, 2)),
      sha,
    }),
  })
  await assertOkResponse(response, path, 'writing', { conflict: true })

  const json = await response.json()
  return { sha: json.content.sha }
}

export async function saveFile<T>(path: string, content: T, message: string, token: string): Promise<void> {
  console.info(`[admin/github] save start ${path}`)
  await withConflictRetry(
    async () => {
      const { sha } = await fetchContents(path, token)
      await putFile(path, content, message, token, sha)
    },
    path,
    'save',
  )
}

export async function listDir(path: string, token: string): Promise<{ name: string; path: string; sha: string }[]> {
  console.info(`[admin/github] LIST ${path}`)
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: authHeaders(token),
  })

  if (response.status === 401) {
    throw new GithubAuthError()
  }
  if (response.status === 404) {
    console.info(`[admin/github] LIST ${path} -> not found, treating as empty`)
    return []
  }
  await assertOkResponse(response, path, 'listing')

  const json = (await response.json()) as { name: string; path: string; sha: string }[]
  return json.filter((entry) => entry.name.endsWith('.json'))
}

export async function createFile(path: string, content: unknown, message: string, token: string): Promise<{ sha: string }> {
  console.info(`[admin/github] create start ${path}`)
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: utf8ToBase64(JSON.stringify(content, null, 2)),
    }),
  })
  await assertOkResponse(response, path, 'creating')

  const json = await response.json()
  console.info(`[admin/github] create success ${path}`)
  return { sha: json.content.sha }
}

export async function deleteFile(path: string, sha: string, message: string, token: string): Promise<void> {
  console.info(`[admin/github] delete start ${path}`)
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha }),
  })
  await assertOkResponse(response, path, 'deleting', { conflict: true })
  console.info(`[admin/github] delete success ${path}`)
}

// --- Git Data API: multi-file atomic commits -------------------------------------------------
// The Contents API above is one PUT/DELETE = one commit = one GitHub Pages deploy. That's fine
// for a single JSON file, but staging a project edit with 2 new gallery images used to produce
// 3 separate commits (and 3 deploy runs) for what is, from the user's perspective, one save.
// commitFiles() bundles any number of file writes/deletes into a single commit via the
// lower-level Git Data primitives (blob -> tree -> commit -> ref update).

const DEFAULT_BRANCH = 'main'

export type CommitEntry =
  | { path: string; content: string }
  | { path: string; blobSha: string }
  | { path: string; delete: true }

async function createBlob(base64Content: string, token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/git/blobs`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
  })
  await assertOkResponse(response, 'git/blobs', 'creating blob')
  const json = await response.json()
  return json.sha
}

// Creates a blob for a staged image without committing it — the resulting sha is included in
// the same tree/commit as the JSON entity that references it (see resolvePendingImages.ts).
// Returns both the repo path (used as the commit tree entry) and the public runtime URL
// (substituted into the JSON's cover/gallery/avatar field) — BASE_URL differs between dev ('/')
// and the built site ('/portfolio/'), see vite.config.ts.
export async function createImageBlob(blob: Blob, token: string): Promise<{ path: string; publicPath: string; blobSha: string }> {
  const filename = `${crypto.randomUUID()}.webp`
  const path = `app/public/uploads/${filename}`
  const publicPath = `${import.meta.env.BASE_URL}uploads/${filename}`
  console.info(`[admin/github] create image blob start ${filename} (${blob.size} bytes)`)
  const blobSha = await createBlob(await blobToBase64(blob), token)
  console.info(`[admin/github] create image blob success ${filename} -> ${blobSha}`)
  return { path, publicPath, blobSha }
}

async function getRef(branch: string, token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, {
    headers: authHeaders(token),
  })
  await assertOkResponse(response, `refs/heads/${branch}`, 'reading ref')
  const json = await response.json()
  return json.object.sha as string
}

async function getCommitTreeSha(commitSha: string, token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/git/commits/${commitSha}`, {
    headers: authHeaders(token),
  })
  await assertOkResponse(response, `git/commits/${commitSha}`, 'reading commit')
  const json = await response.json()
  return json.tree.sha as string
}

async function createTree(baseTreeSha: string, entries: { path: string; sha: string | null }[], token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: entries.map((entry) => ({ path: entry.path, mode: '100644', type: 'blob', sha: entry.sha })),
    }),
  })
  await assertOkResponse(response, 'git/trees', 'creating tree')
  const json = await response.json()
  return json.sha as string
}

async function createGitCommit(message: string, treeSha: string, parentSha: string, token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
  })
  await assertOkResponse(response, 'git/commits', 'creating commit')
  const json = await response.json()
  return json.sha as string
}

async function updateRef(branch: string, commitSha: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commitSha, force: false }),
  })
  if (response.status === 401) {
    throw new GithubAuthError()
  }
  // 422 = not a fast-forward (someone else committed in between reading the parent and
  // updating the branch) — the same kind of conflict as a Contents API sha mismatch, just
  // surfaced as a different status code by this endpoint.
  if (response.status === 422) {
    throw new GithubConflictError()
  }
  await assertOkResponse(response, `refs/heads/${branch}`, 'updating ref')
}

// Bundles any number of file writes/deletes into a single commit. `content` entries get a
// fresh blob created for them (JSON, always UTF-8-safe base64 like putFile); `blobSha` entries
// reuse an already-created blob (staged images, see createImageBlob); `delete` entries remove
// the path from the tree. Retries once on a non-fast-forward ref update, same as saveFile's
// sha-conflict retry.
export async function commitFiles(entries: CommitEntry[], message: string, token: string): Promise<void> {
  if (entries.length === 0) return

  const paths = entries.map((entry) => entry.path).join(', ')
  console.info(`[admin/github] commitFiles start (${entries.length}): ${paths}`)

  await withConflictRetry(
    async () => {
      const parentSha = await getRef(DEFAULT_BRANCH, token)
      const baseTreeSha = await getCommitTreeSha(parentSha, token)

      const treeEntries = await Promise.all(
        entries.map(async (entry) => {
          if ('delete' in entry) {
            return { path: entry.path, sha: null }
          }
          if ('blobSha' in entry) {
            return { path: entry.path, sha: entry.blobSha }
          }
          const sha = await createBlob(utf8ToBase64(entry.content), token)
          return { path: entry.path, sha }
        }),
      )

      const newTreeSha = await createTree(baseTreeSha, treeEntries, token)
      const commitSha = await createGitCommit(message, newTreeSha, parentSha, token)
      await updateRef(DEFAULT_BRANCH, commitSha, token)
    },
    paths,
    'commitFiles',
  )

  console.info(`[admin/github] commitFiles success: ${paths}`)
}
