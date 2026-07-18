// Titles are primarily Ukrainian/Russian (Cyrillic) — a plain ASCII-only slugify would strip
// almost everything and produce an empty string, so Cyrillic is transliterated to Latin first.
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'i', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia',
}

function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('')
}

export function slugify(text: string): string {
  const slug = transliterate(text)
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'untitled'
}

export function makeUniqueSlug(base: string, existing: string[]): string {
  const existingSet = new Set(existing)
  if (!existingSet.has(base)) return base

  let suffix = 2
  while (existingSet.has(`${base}-${suffix}`)) {
    suffix++
  }
  return `${base}-${suffix}`
}
