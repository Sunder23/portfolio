const DEFAULT_MAX_DIMENSION = 1920
const DEFAULT_TARGET_BYTES = 300 * 1024
const QUALITY_START = 0.82
const QUALITY_STEP = 0.1
const QUALITY_FLOOR = 0.4
const MAX_DIMENSION_SHRINK_PASSES = 2
const DIMENSION_SHRINK_FACTOR = 0.8

export interface CompressImageOptions {
  maxDimension?: number
  targetBytes?: number
}

export async function compressImage(file: File, opts: CompressImageOptions = {}): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`Файл "${file.name}" не является изображением (${file.type || 'неизвестный тип'})`)
  }

  const targetBytes = opts.targetBytes ?? DEFAULT_TARGET_BYTES
  let maxDimension = opts.maxDimension ?? DEFAULT_MAX_DIMENSION

  console.info(`[admin/imageCompress] start ${file.name} (${file.type}, ${file.size} bytes)`)

  const bitmap = await createImageBitmap(file)

  let blob: Blob | null = null
  let usedQuality = QUALITY_START
  let usedDimension = maxDimension

  try {
    for (let dimensionPass = 0; dimensionPass <= MAX_DIMENSION_SHRINK_PASSES; dimensionPass++) {
      const { width, height } = scaleDimensions(bitmap.width, bitmap.height, maxDimension)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas 2D context недоступен')
      }
      ctx.drawImage(bitmap, 0, 0, width, height)

      for (let quality = QUALITY_START; quality >= QUALITY_FLOOR; quality -= QUALITY_STEP) {
        blob = await canvasToBlob(canvas, quality)
        usedQuality = quality
        usedDimension = maxDimension
        if (blob.size <= targetBytes) break
      }

      if (blob && blob.size <= targetBytes) break
      maxDimension = Math.round(maxDimension * DIMENSION_SHRINK_FACTOR)
    }
  } finally {
    bitmap.close()
  }

  if (!blob) {
    throw new Error('Не удалось сжать изображение')
  }

  console.info(
    `[admin/imageCompress] done ${file.name}: ${blob.size} bytes, quality=${usedQuality.toFixed(2)}, maxDimension=${usedDimension}`,
  )

  return blob
}

function scaleDimensions(width: number, height: number, maxDimension: number): { width: number; height: number } {
  const longestEdge = Math.max(width, height)
  if (longestEdge <= maxDimension) {
    return { width, height }
  }
  const scale = maxDimension / longestEdge
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob вернул null'))
      },
      'image/webp',
      quality,
    )
  })
}
