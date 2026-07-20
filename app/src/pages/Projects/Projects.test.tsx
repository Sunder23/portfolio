import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Projects from '@/pages/Projects'
import { getProjects } from '@/lib/data'
import type { Project } from '@/types'

vi.mock('@/lib/data', () => ({
  getProjects: vi.fn(),
}))

function project(overrides: Partial<Project>): Project {
  return {
    title: { uk: 'Проєкт' },
    slug: 'demo-project',
    shortDescription: { uk: '' },
    description: { uk: '' },
    stack: ['React'],
    category: ['Web'],
    role: 'Fullstack developer',
    year: 2026,
    url: '',
    cover: '',
    gallery: [],
    featured: false,
    order: 0,
    published: true,
    ...overrides,
  }
}

const PROJECTS: Project[] = [
  project({ slug: 'one', role: 'Fullstack developer', stack: ['React'], category: ['Web'] }),
  project({ slug: 'two', role: 'WordPress developer', stack: ['PHP'], category: ['CMS'] }),
]

describe('Projects', () => {
  it('reveals the filter panel behind a mobile toggle button, with an active-filter count badge', async () => {
    vi.mocked(getProjects).mockResolvedValue(PROJECTS)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/?role=WordPress+developer']}>
        <Projects />
      </MemoryRouter>,
    )

    const mobilePanel = within(await screen.findByTestId('mobile-filter-panel'))
    const toggle = mobilePanel.getByRole('button', { name: /projects\.filter\.toggle/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(mobilePanel.getByText('1')).toBeInTheDocument()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(await mobilePanel.findByRole('tab', { name: 'WordPress developer' })).toBeInTheDocument()
  })
})
