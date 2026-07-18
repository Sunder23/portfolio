import type { ComponentType } from 'react'
import { FolderKanban, UserRound, Wrench } from 'lucide-react'

export interface AdminNavChild {
  label: string
  path: string
}

export interface AdminNavItem {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  path: string
  children?: AdminNavChild[]
}

// WordPress-style sidebar tree: adding a new content type is a new entry here,
// not a branch in AdminLayout/Admin.tsx (see ARCHITECTURE.md registry principle).
export const navConfig: AdminNavItem[] = [
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    path: '/admin/projects',
    children: [
      { label: 'All Projects', path: '/admin/projects' },
      { label: 'Add New', path: '/admin/projects/new' },
      { label: 'Tech Stack', path: '/admin/taxonomies/stack' },
      { label: 'Categories', path: '/admin/taxonomies/category' },
      { label: 'Roles', path: '/admin/taxonomies/role' },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserRound,
    path: '/admin/profile',
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: Wrench,
    path: '/admin/skills',
  },
]
