import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project } from '@/types'

const PROJECT: Project = {
  title: { uk: 'Проєкт' },
  slug: 'demo-project',
  shortDescription: { uk: 'Короткий опис' },
  description: { uk: '' },
  stack: ['React', 'TypeScript'],
  category: ['Web', 'Portfolio'],
  role: 'Fullstack developer',
  year: 2026,
  url: '',
  cover: '',
  gallery: [],
  featured: false,
  order: 0,
  published: true,
}

describe('ProjectCard', () => {
  it('renders role, category, and stack as badges', () => {
    render(
      <MemoryRouter>
        <ProjectCard project={PROJECT} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Fullstack developer')).toBeInTheDocument()
    expect(screen.getByText('Web')).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('omits the role/category row entirely when both are empty', () => {
    render(
      <MemoryRouter>
        <ProjectCard project={{ ...PROJECT, role: '', category: [] }} />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Fullstack developer')).not.toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })
})
