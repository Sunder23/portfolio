import { describe, expect, it, vi } from 'vitest'
import { resolvePendingImages, type PendingImage } from '@/admin/lib/resolvePendingImages'

function pending(name: string): PendingImage {
  return { blob: new Blob([name]), previewUrl: `blob:${name}` }
}

describe('resolvePendingImages', () => {
  it('replaces nested PendingImage leaves (cover + gallery) with uploaded paths, preserving array order', async () => {
    const upload = vi.fn(async (blob: Blob) => `/uploads/${await blob.text()}.webp`)
    const input = {
      title: { uk: 'Проект' },
      cover: pending('cover'),
      gallery: ['/uploads/existing.webp', pending('gallery-1'), pending('gallery-2')],
    }

    const result = await resolvePendingImages(input, upload)

    expect(result).toEqual({
      title: { uk: 'Проект' },
      cover: '/uploads/cover.webp',
      gallery: ['/uploads/existing.webp', '/uploads/gallery-1.webp', '/uploads/gallery-2.webp'],
    })
    expect(upload).toHaveBeenCalledTimes(3)
  })

  it('returns the input unchanged and never calls upload when there is nothing pending', async () => {
    const upload = vi.fn(async () => '/uploads/should-not-be-called.webp')
    const input = { title: { uk: 'Проект' }, cover: '/uploads/existing.webp', gallery: ['/uploads/a.webp'] }

    const result = await resolvePendingImages(input, upload)

    expect(result).toEqual(input)
    expect(upload).not.toHaveBeenCalled()
  })

  it('propagates an upload failure', async () => {
    const upload = vi.fn(async () => {
      throw new Error('network error')
    })

    await expect(resolvePendingImages({ cover: pending('cover') }, upload)).rejects.toThrow('network error')
  })
})
