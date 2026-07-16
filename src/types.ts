export type Localized<T = string> = { uk: T; ru?: T; en?: T }

export interface Project {
  id: string
  title: Localized
  slug: string
  shortDescription: Localized
  description: Localized
  stack: string[]
  role: string
  year: number
  url: string
  cover: string
  gallery: string[]
  featured: boolean
  order: number
  published: boolean
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
}

export interface SkillCategory {
  category: string
  items: string[]
}
