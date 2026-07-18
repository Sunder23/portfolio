export type PendingImage = { blob: Blob; previewUrl: string }

export function isPendingImage(value: unknown): value is PendingImage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'blob' in value &&
    'previewUrl' in value &&
    (value as { blob: unknown }).blob instanceof Blob &&
    typeof (value as { previewUrl: unknown }).previewUrl === 'string'
  )
}

export interface ResolvedImageEntry {
  // Repo path (e.g. app/public/uploads/<uuid>.webp) — used as the commit tree entry.
  path: string
  // Public runtime URL (e.g. /portfolio/uploads/<uuid>.webp) — substituted into the JSON's
  // cover/gallery/avatar field so <img src> resolves in both dev and the built site.
  publicPath: string
  blobSha: string
}

export interface ResolvePendingImagesResult<T> {
  value: T
  // Every staged image found, as a Git blob already created (but not yet committed) —
  // callers pass these to github.ts's commitFiles() alongside the entity's own JSON so the
  // image(s) and the entity land in the same commit instead of one commit per image.
  imageEntries: ResolvedImageEntry[]
}

// Deep-walks any plain object/array tree and replaces every PendingImage leaf
// (regardless of which field it's under — cover, gallery[i], avatar, ...) with
// the path returned by `upload`. Doesn't mutate `value` — other in-flight UI
// state (the editor's own local view) may still reference the original tree.
export async function resolvePendingImages<T>(
  value: T,
  upload: (blob: Blob) => Promise<ResolvedImageEntry>,
): Promise<ResolvePendingImagesResult<T>> {
  const pendingCount = countPendingImages(value)
  if (pendingCount === 0) {
    return { value, imageEntries: [] }
  }

  console.info(`[admin/resolvePendingImages] resolving ${pendingCount} pending image(s)`)
  const imageEntries: ResolvedImageEntry[] = []
  const resolvedValue = (await resolveNode(value, upload, imageEntries)) as T
  return { value: resolvedValue, imageEntries }
}

function countPendingImages(value: unknown): number {
  if (isPendingImage(value)) return 1
  if (Array.isArray(value)) return value.reduce((sum: number, item) => sum + countPendingImages(item), 0)
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce((sum: number, item) => sum + countPendingImages(item), 0)
  }
  return 0
}

async function resolveNode(
  value: unknown,
  upload: (blob: Blob) => Promise<ResolvedImageEntry>,
  imageEntries: ResolvedImageEntry[],
): Promise<unknown> {
  if (isPendingImage(value)) {
    try {
      const entry = await upload(value.blob)
      console.info(`[admin/resolvePendingImages] resolved pending image -> ${entry.publicPath}`)
      imageEntries.push(entry)
      return entry.publicPath
    } catch (err) {
      console.error('[admin/resolvePendingImages] upload failed', err)
      throw err
    }
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => resolveNode(item, upload, imageEntries)))
  }

  if (value !== null && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(
        async ([key, item]) => [key, await resolveNode(item, upload, imageEntries)] as const,
      ),
    )
    return Object.fromEntries(entries)
  }

  return value
}
