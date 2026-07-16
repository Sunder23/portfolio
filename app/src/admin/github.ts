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

  if (response.status === 401) {
    throw new GithubAuthError()
  }
  if (!response.ok) {
    throw new Error(`GitHub API error reading ${path}: ${response.status}`)
  }

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

  if (response.status === 401) {
    throw new GithubAuthError()
  }
  if (response.status === 409) {
    throw new GithubConflictError()
  }
  if (!response.ok) {
    throw new Error(`GitHub API error writing ${path}: ${response.status}`)
  }

  const json = await response.json()
  return { sha: json.content.sha }
}

export async function saveFile<T>(path: string, content: T, message: string, token: string): Promise<void> {
  console.info(`[admin/github] save start ${path}`)

  try {
    const { sha } = await fetchContents(path, token)
    await putFile(path, content, message, token, sha)
    console.info(`[admin/github] save success ${path}`)
  } catch (err) {
    if (!(err instanceof GithubConflictError)) {
      console.error(`[admin/github] save failed ${path}`, err)
      throw err
    }

    console.warn(`[admin/github] sha conflict on ${path}, retrying once`)
    const { sha } = await fetchContents(path, token)
    await putFile(path, content, message, token, sha)
    console.info(`[admin/github] save success after retry ${path}`)
  }
}

async function putBinary(path: string, base64Content: string, message: string, token: string): Promise<{ sha: string }> {
  const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64Content }),
  })

  if (response.status === 401) {
    throw new GithubAuthError()
  }
  if (response.status === 409) {
    throw new GithubConflictError()
  }
  if (!response.ok) {
    throw new Error(`GitHub API error uploading ${path}: ${response.status}`)
  }

  const json = await response.json()
  return { sha: json.content.sha }
}

// New-file create for binary assets (images) — unlike putFile/saveFile, no sha is fetched or
// sent since uploads always target a fresh, uniquely-named path (see useImageUpload).
export async function uploadImage(path: string, blob: Blob, message: string, token: string): Promise<{ sha: string }> {
  console.info(`[admin/github] upload start ${path} (${blob.size} bytes)`)
  const base64Content = await blobToBase64(blob)

  try {
    const result = await putBinary(path, base64Content, message, token)
    console.info(`[admin/github] upload success ${path}`)
    return result
  } catch (err) {
    if (!(err instanceof GithubConflictError)) {
      console.error(`[admin/github] upload failed ${path}`, err)
      throw err
    }

    console.warn(`[admin/github] upload conflict on ${path}, retrying once`)
    const result = await putBinary(path, base64Content, message, token)
    console.info(`[admin/github] upload success after retry ${path}`)
    return result
  }
}
