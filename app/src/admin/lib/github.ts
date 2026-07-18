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

async function putBinary(path: string, base64Content: string, message: string, token: string): Promise<{ sha: string }> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64Content }),
  })
  await assertOkResponse(response, path, 'uploading', { conflict: true })

  const json = await response.json()
  return { sha: json.content.sha }
}

// New-file create for binary assets (images) — unlike putFile/saveFile, no sha is fetched or
// sent since uploads always target a fresh, uniquely-named path (see uploadPendingImage).
export async function uploadImage(path: string, blob: Blob, message: string, token: string): Promise<{ sha: string }> {
  console.info(`[admin/github] upload start ${path} (${blob.size} bytes)`)
  const base64Content = await blobToBase64(blob)
  return withConflictRetry(() => putBinary(path, base64Content, message, token), path, 'upload')
}

// Uploads a locally-staged image blob (see admin/lib/resolvePendingImages.ts) to a fresh
// uniquely-named path and returns the public runtime URL to store in JSON content fields
// (cover/gallery/avatar) — BASE_URL differs between dev ('/') and the built site ('/portfolio/'),
// see vite.config.ts, so ProjectCard/ProjectDetail/ProfileEditor can render <img src={value}>
// unchanged in both environments.
export async function uploadPendingImage(blob: Blob, token: string): Promise<string> {
  const filename = `${crypto.randomUUID()}.webp`
  const path = `app/public/uploads/${filename}`
  await uploadImage(path, blob, `chore(uploads): add ${filename}`, token)
  const publicPath = `${import.meta.env.BASE_URL}uploads/${filename}`
  console.info(`[admin/github] uploaded pending image ${filename} -> ${publicPath}`)
  return publicPath
}
