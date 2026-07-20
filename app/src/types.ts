import type { Locale } from '@/lib/locale'

export type Localized<T = string> = { uk: T; ru?: T; en?: T }

export function resolveLocalized<T>(field: Localized<T>, locale: Locale): T {
  return field[locale] ?? field.uk
}

export interface Project {
  title: Localized
  slug: string
  shortDescription: Localized
  description: Localized
  stack: string[]
  category: string[]
  role: string
  year: number
  url: string
  cover: string
  gallery: string[]
  featured: boolean
  order: number
  published: boolean
}

export interface Taxonomies {
  stack: string[]
  category: string[]
  role: string[]
}

export interface SocialLink {
  platform: string
  url: string
}

export interface Profile {
  name: string
  title: Localized
  bio: Localized
  location: string
  email: string
  socials: SocialLink[]
  avatar: string
  cv?: string
}

export interface Testimonial {
  name: string
  role?: string
  quote: Localized
  avatar?: string
}

export interface Credential {
  title: Localized
  issuer: string
  period: Localized
  kind: 'education' | 'certificate'
  url?: string
}

export interface SkillCategory {
  category: string
  items: string[]
}

export interface Experience {
  position: Localized
  company: string
  industry: Localized
  period: Localized
  summary: Localized
  responsibilities: Localized
  achievements: Localized
  stack: string[]
}

export interface CommitSummary {
  shortSha: string
  message: string
  date: string
  url: string
}

export interface CommitActivityWeek {
  weekStart: string
  days: number[]
}
