import { describe, expect, it } from 'vitest'
import { makeUniqueSlug, slugify } from '@/lib/slug'

describe('slugify', () => {
  it('transliterates a Ukrainian title into a readable Latin slug', () => {
    expect(slugify('WordPress-портал нерухомості')).toBe('wordpress-portal-nerukhomosti')
  })

  it('transliterates a Russian title into a readable Latin slug', () => {
    expect(slugify('Сайт-портфолио')).toBe('sayt-portfolio')
  })

  it('collapses punctuation and whitespace into single hyphens', () => {
    expect(slugify('  Hello,   World!!  ')).toBe('hello-world')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--Already Hyphenated--')).toBe('already-hyphenated')
  })

  it('falls back to "untitled" for empty or whitespace-only input', () => {
    expect(slugify('')).toBe('untitled')
    expect(slugify('   ')).toBe('untitled')
    expect(slugify('!!!')).toBe('untitled')
  })
})

describe('makeUniqueSlug', () => {
  it('returns the base slug when it does not collide', () => {
    expect(makeUniqueSlug('portfolio-site', ['other-project'])).toBe('portfolio-site')
  })

  it('appends -2 when the base slug already exists', () => {
    expect(makeUniqueSlug('portfolio-site', ['portfolio-site'])).toBe('portfolio-site-2')
  })

  it('finds the next free numeric suffix', () => {
    expect(makeUniqueSlug('portfolio-site', ['portfolio-site', 'portfolio-site-2', 'portfolio-site-3'])).toBe(
      'portfolio-site-4',
    )
  })
})
