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

// Deep-walks any plain object/array tree and replaces every PendingImage leaf
// (regardless of which field it's under — cover, gallery[i], avatar, ...) with
// the path returned by `upload`. Doesn't mutate `value` — other in-flight UI
// state (the editor's own local view) may still reference the original tree.
export async function resolvePendingImages<T>(value: T, upload: (blob: Blob) => Promise<string>): Promise<T> {
  const pendingCount = countPendingImages(value)
  if (pendingCount === 0) {
    return value
  }

  console.info(`[admin/resolvePendingImages] resolving ${pendingCount} pending image(s)`)
  return (await resolveNode(value, upload)) as T
}

function countPendingImages(value: unknown): number {
  if (isPendingImage(value)) return 1
  if (Array.isArray(value)) return value.reduce((sum: number, item) => sum + countPendingImages(item), 0)
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce((sum: number, item) => sum + countPendingImages(item), 0)
  }
  return 0
}

async function resolveNode(value: unknown, upload: (blob: Blob) => Promise<string>): Promise<unknown> {
  if (isPendingImage(value)) {
    try {
      const path = await upload(value.blob)
      console.info(`[admin/resolvePendingImages] resolved pending image -> ${path}`)
      return path
    } catch (err) {
      console.error('[admin/resolvePendingImages] upload failed', err)
      throw err
    }
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => resolveNode(item, upload)))
  }

  if (value !== null && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(async ([key, item]) => [key, await resolveNode(item, upload)] as const),
    )
    return Object.fromEntries(entries)
  }

  return value
}
