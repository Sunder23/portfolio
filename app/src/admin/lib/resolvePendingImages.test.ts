import { describe, expect, it, vi } from 'vitest'
import { resolvePendingImages, type PendingImage } from '@/admin/lib/resolvePendingImages'

function pending(name: string): PendingImage {
  return { blob: new Blob([name]), previewUrl: `blob:${name}` }
}

describe('resolvePendingImages', () => {
  it('replaces nested PendingImage leaves (cover + gallery) with the uploaded *public* path and collects their blob entries', async () => {
    const upload = vi.fn(async (blob: Blob) => {
      const name = await blob.text()
      return { path: `app/public/uploads/${name}.webp`, publicPath: `/uploads/${name}.webp`, blobSha: `sha-${name}` }
    })
    const input = {
      title: { uk: 'Проект' },
      cover: pending('cover'),
      gallery: ['/uploads/existing.webp', pending('gallery-1'), pending('gallery-2')],
    }

    const { value, imageEntries } = await resolvePendingImages(input, upload)

    // The JSON stores the *public* URL (what <img src> resolves to), not the repo path.
    expect(value).toEqual({
      title: { uk: 'Проект' },
      cover: '/uploads/cover.webp',
      gallery: ['/uploads/existing.webp', '/uploads/gallery-1.webp', '/uploads/gallery-2.webp'],
    })
    expect(upload).toHaveBeenCalledTimes(3)
    expect(imageEntries).toEqual(
      expect.arrayContaining([
        { path: 'app/public/uploads/cover.webp', publicPath: '/uploads/cover.webp', blobSha: 'sha-cover' },
        { path: 'app/public/uploads/gallery-1.webp', publicPath: '/uploads/gallery-1.webp', blobSha: 'sha-gallery-1' },
        { path: 'app/public/uploads/gallery-2.webp', publicPath: '/uploads/gallery-2.webp', blobSha: 'sha-gallery-2' },
      ]),
    )
    expect(imageEntries).toHaveLength(3)
  })

  it('returns the input unchanged, an empty imageEntries list, and never calls upload when there is nothing pending', async () => {
    const upload = vi.fn(async () => ({
      path: 'app/public/uploads/should-not-be-called.webp',
      publicPath: '/uploads/should-not-be-called.webp',
      blobSha: 'unused',
    }))
    const input = { title: { uk: 'Проект' }, cover: '/uploads/existing.webp', gallery: ['/uploads/a.webp'] }

    const { value, imageEntries } = await resolvePendingImages(input, upload)

    expect(value).toEqual(input)
    expect(imageEntries).toEqual([])
    expect(upload).not.toHaveBeenCalled()
  })

  it('propagates an upload failure', async () => {
    const upload = vi.fn(async () => {
      throw new Error('network error')
    })

    await expect(resolvePendingImages({ cover: pending('cover') }, upload)).rejects.toThrow('network error')
  })
})
